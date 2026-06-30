import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorized } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import Board from "@/models/Board";
import Activity from "@/models/Activity";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  await connectDB();
  const { searchParams } = new URL(request.url);
  const assigneeId = searchParams.get("assigneeId");
  const boardId = searchParams.get("boardId");

  const filter: Record<string, unknown> = {};
  if (assigneeId) filter.assigneeId = assigneeId;
  if (boardId) filter.boardId = boardId;

  const tasks = await Task.find(filter)
    .populate("assigneeId", "name email avatar")
    .populate("boardId", "title")
    .sort({ createdAt: -1 });

  return NextResponse.json({
    tasks: tasks.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString() ?? null,
      order: t.order,
      boardId: t.boardId.toString(),
      boardName: (t.boardId as any)?.title ?? "",
      assigneeId: t.assigneeId?.toString() ?? null,
      assignee: t.assigneeId ? {
        id: (t.assigneeId as any)._id?.toString() ?? t.assigneeId.toString(),
        name: (t.assigneeId as any).name ?? "",
        email: (t.assigneeId as any).email ?? "",
      } : null,
      creatorId: t.creatorId.toString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  const body = await request.json();
  const { title, boardId, status, priority, description, assigneeId, dueDate } = body;

  if (!title?.trim() || !boardId) {
    return NextResponse.json({ error: "Title and boardId required" }, { status: 400 });
  }

  await connectDB();
  const board = await Board.findById(boardId);
  if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

  // Get the max order in this status column
  const maxOrderTask = await Task.findOne({ boardId, status: status ?? "todo" }).sort({ order: -1 });
  const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

  const task = await Task.create({
    title: title.trim(),
    description: description ?? "",
    status: status ?? "todo",
    priority: priority ?? "medium",
    dueDate: dueDate ? new Date(dueDate) : undefined,
    order,
    boardId,
    assigneeId: assigneeId ?? session.id,
    creatorId: session.id,
  });

  await Activity.create({
    userId: session.id,
    userName: session.name,
    action: "created task",
    entity: "task",
    entityId: task._id.toString(),
    entityName: task.title,
    boardId: boardId,
    boardName: board.title,
  });

  // Emit socket event
  try {
    global.io?.to(`board:${boardId}`).emit("task:created", { task: { id: task._id.toString(), ...task.toObject() } });
  } catch {}

  return NextResponse.json({
    task: {
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() ?? null,
      order: task.order,
      boardId: task.boardId.toString(),
      assigneeId: task.assigneeId?.toString() ?? null,
      creatorId: task.creatorId.toString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    },
  }, { status: 201 });
}
