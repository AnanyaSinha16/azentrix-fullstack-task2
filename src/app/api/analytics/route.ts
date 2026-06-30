import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorized } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import Board from "@/models/Board";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  await connectDB();

  const [totalTasks, completedTasks, inProgressTasks, todoTasks] = await Promise.all([
    Task.countDocuments(),
    Task.countDocuments({ status: "done" }),
    Task.countDocuments({ status: "in_progress" }),
    Task.countDocuments({ status: "todo" }),
  ]);

  const now = new Date();
  const overdueTasks = await Task.countDocuments({
    dueDate: { $lt: now },
    status: { $ne: "done" },
  });

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Priority breakdown
  const byPriorityRaw = await Task.aggregate([
    { $group: { _id: "$priority", count: { $sum: 1 } } },
  ]);
  const byPriority = byPriorityRaw.map((p) => ({ priority: p._id, count: p.count }));

  // Status breakdown
  const byStatusRaw = await Task.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const byStatus = byStatusRaw.map((s) => ({ status: s._id, count: s.count }));

  // Board breakdown
  const boards = await Board.find().select("title");
  const byBoard = await Promise.all(
    boards.map(async (b) => {
      const total = await Task.countDocuments({ boardId: b._id });
      const completed = await Task.countDocuments({ boardId: b._id, status: "done" });
      return { boardName: b.title, total, completed };
    })
  );

  // Completion trend last 7 days
  const completionTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const start = new Date(dateStr);
    const end = new Date(dateStr);
    end.setDate(end.getDate() + 1);
    const count = await Task.countDocuments({
      status: "done",
      updatedAt: { $gte: start, $lt: end },
    });
    completionTrend.push({ date: dateStr, completed: count });
  }

  return NextResponse.json({
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    overdueTasks,
    completionRate,
    byPriority,
    byStatus,
    byBoard: byBoard.filter((b) => b.total > 0),
    completionTrend,
  });
}
