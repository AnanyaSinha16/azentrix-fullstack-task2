import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Board from "@/models/Board";
import Task from "@/models/Task";
import User from "@/models/User";
import { KanbanBoardView } from "@/components/KanbanBoardView";

export default async function BoardPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const board = await Board.findById(params.id).lean();
  if (!board) notFound();

  const tasks = await Task.find({ boardId: params.id })
    .populate("assigneeId", "name email avatar role createdAt")
    .lean();

  const users = await User.find().select("name email avatar role createdAt").lean();

  const boardData = {
    id: (board as any)._id.toString(),
    title: (board as any).title,
    description: (board as any).description ?? "",
    createdBy: (board as any).createdBy.toString(),
    createdAt: (board as any).createdAt?.toISOString() ?? "",
  };

  const tasksData = tasks.map((t: any) => ({
    id: t._id.toString(),
    title: t.title,
    description: t.description ?? "",
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate?.toISOString() ?? null,
    order: t.order,
    boardId: t.boardId.toString(),
    assigneeId: t.assigneeId?._id?.toString() ?? t.assigneeId?.toString() ?? null,
    assignee: t.assigneeId ? {
      id: t.assigneeId._id?.toString() ?? t.assigneeId.toString(),
      name: t.assigneeId.name ?? "",
      email: t.assigneeId.email ?? "",
      avatar: t.assigneeId.avatar ?? "",
      role: t.assigneeId.role ?? "member",
      createdAt: t.assigneeId.createdAt?.toISOString() ?? "",
    } : null,
    creatorId: t.creatorId.toString(),
    createdAt: t.createdAt?.toISOString() ?? "",
    updatedAt: t.updatedAt?.toISOString() ?? "",
  }));

  const usersData = users.map((u: any) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    avatar: u.avatar ?? "",
    role: u.role,
    createdAt: u.createdAt?.toISOString() ?? "",
  }));


  return (
    <KanbanBoardView
      board={boardData}
      initialTasks={tasksData}
      users={usersData}
      currentUser={session}
    />
  );
}
