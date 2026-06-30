import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorized, forbidden } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import Board from "@/models/Board";
import Activity from "@/models/Activity";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  await connectDB();
  const task = await Task.findById(params.id)
    .populate("assigneeId", "name email avatar")
    .populate("creatorId", "name email avatar");

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
      assignee: task.assigneeId ? {
        id: (task.assigneeId as any)._id?.toString(),
        name: (task.assigneeId as any).name,
        email: (task.assigneeId as any).email,
      } : null,
      creatorId: task.creatorId.toString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  await connectDB();
  const task = await Task.findById(params.id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only admin or creator/assignee can edit
  const canEdit =
    session.role === "admin" ||
    task.creatorId.toString() === session.id ||
    task.assigneeId?.toString() === session.id;

  if (!canEdit) return forbidden();

  const body = await request.json();
  const { title, description, status, priority, dueDate, assigneeId, order } = body;

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : undefined;
  if (assigneeId !== undefined) task.assigneeId = assigneeId || undefined;
  if (order !== undefined) task.order = order;

  await task.save();

  const board = await Board.findById(task.boardId);

  await Activity.create({
    userId: session.id,
    userName: session.name,
    action: status ? `moved task to ${status.replace("_", " ")}` : "updated task",
    entity: "task",
    entityId: task._id.toString(),
    entityName: task.title,
    boardId: task.boardId.toString(),
    boardName: board?.title ?? "",
  });

  // Emit socket event
  try {
    global.io?.to(`board:${task.boardId.toString()}`).emit("task:updated", {
      task: { id: task._id.toString(), ...task.toObject() },
    });
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
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  await connectDB();
  const task = await Task.findById(params.id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canDelete =
    session.role === "admin" || task.creatorId.toString() === session.id;
  if (!canDelete) return forbidden();

  const boardId = task.boardId.toString();
  const board = await Board.findById(boardId);

  await Task.findByIdAndDelete(params.id);

  await Activity.create({
    userId: session.id,
    userName: session.name,
    action: "deleted task",
    entity: "task",
    entityName: task.title,
    boardId,
    boardName: board?.title ?? "",
  });

  try {
    global.io?.to(`board:${boardId}`).emit("task:deleted", { taskId: params.id });
  } catch {}

  return NextResponse.json({ success: true });
}
