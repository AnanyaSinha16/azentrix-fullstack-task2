import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import Standup from "@/models/Standup";
import Activity from "@/models/Activity";
import User from "@/models/User";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const today = new Date().toISOString().split("T")[0];

  const [totalTasks, completedTasks, inProgressTasks, todoTasks, overdueTasks, teamCount, todayStandups, recentActivities, myStandup] =
    await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: "done" }),
      Task.countDocuments({ status: "in_progress" }),
      Task.countDocuments({ status: "todo" }),
      Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $ne: "done" } }),
      User.countDocuments(),
      Standup.find({ date: today }).lean(),
      Activity.find().sort({ createdAt: -1 }).limit(10).lean(),
      Standup.findOne({ userId: session.id, date: today }).lean(),
    ]);

  const sprintProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <DashboardClient
      user={session}
      stats={{ totalTasks, completedTasks, inProgressTasks, todoTasks, overdueTasks, teamCount, sprintProgress }}
      todayStandups={todayStandups.map((s: any) => ({
        id: s._id.toString(),
        userId: s.userId.toString(),
        userName: s.userName,
        yesterday: s.yesterday,
        today: s.today,
        blockers: s.blockers,
        date: s.date,
        createdAt: s.createdAt?.toISOString() ?? "",
      }))}
      recentActivities={recentActivities.map((a: any) => ({
        id: a._id.toString(),
        userId: a.userId.toString(),
        userName: a.userName,
        action: a.action,
        entity: a.entity,
        entityName: a.entityName,
        boardName: a.boardName,
        createdAt: a.createdAt?.toISOString() ?? "",
      }))}
      myStandup={myStandup ? {
        id: (myStandup as any)._id.toString(),
        userId: (myStandup as any).userId.toString(),
        userName: (myStandup as any).userName,
        yesterday: (myStandup as any).yesterday,
        today: (myStandup as any).today,
        blockers: (myStandup as any).blockers,
        date: (myStandup as any).date,
        createdAt: (myStandup as any).createdAt?.toISOString() ?? "",
      } : null}
    />
  );
}
