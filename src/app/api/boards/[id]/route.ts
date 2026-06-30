import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorized, forbidden } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Board from "@/models/Board";
import Task from "@/models/Task";
import User from "@/models/User";
import Activity from "@/models/Activity";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  await connectDB();
  const board = await Board.findById(params.id);
  if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

  const tasks = await Task.find({ boardId: params.id })
    .populate("assigneeId", "name email avatar")
    .populate("creatorId", "name email avatar")
    .sort({ status: 1, order: 1 });

  const users = await User.find().select("name email avatar role");

  return NextResponse.json({
    board: {
      id: board._id.toString(),
      title: board.title,
      description: board.description,
      createdBy: board.createdBy.toString(),
      createdAt: board.createdAt,
    },
    tasks: tasks.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString() ?? null,
      order: t.order,
      boardId: t.boardId.toString(),
      assigneeId: t.assigneeId?.toString() ?? null,
      assignee: t.assigneeId ? {
        id: (t.assigneeId as any)._id?.toString() ?? t.assigneeId.toString(),
        name: (t.assigneeId as any).name ?? "",
        email: (t.assigneeId as any).email ?? "",
        avatar: (t.assigneeId as any).avatar ?? "",
      } : null,
      creatorId: t.creatorId.toString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
    users: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      avatar: u.avatar ?? "",
      role: u.role,
    })),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();
  if (session.role !== "admin") return forbidden();

  await connectDB();
  const body = await request.json();
  const board = await Board.findByIdAndUpdate(
    params.id,
    { title: body.title, description: body.description },
    { new: true }
  );

  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ board: { id: board._id.toString(), title: board.title } });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();
  if (session.role !== "admin") return forbidden();

  await connectDB();
  const board = await Board.findById(params.id);
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await Task.deleteMany({ boardId: params.id });
  await Board.findByIdAndDelete(params.id);

  await Activity.create({
    userId: session.id,
    userName: session.name,
    action: "deleted board",
    entity: "board",
    entityName: board.title,
  });

  return NextResponse.json({ success: true });
}
