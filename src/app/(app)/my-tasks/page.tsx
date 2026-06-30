import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import Board from "@/models/Board";
import User from "@/models/User";
import { MyTasksClient } from "./MyTasksClient";

export default async function MyTasksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  // Fetch all tasks assigned to current user
  const tasks = await Task.find({ assigneeId: session.id })
    .populate("boardId", "title")
    .sort({ createdAt: -1 })
    .lean();

  // Fetch all boards for reference/filters
  const boards = await Board.find().select("title").lean();

  // Fetch all users for assigning tasks
  const users = await User.find().select("name email avatar role createdAt").lean();

  const serializedTasks = tasks.map((t: any) => ({
    id: t._id.toString(),
    title: t.title,
    description: t.description ?? "",
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate?.toISOString() ?? null,
    order: t.order,
    boardId: t.boardId._id?.toString() ?? t.boardId.toString(),
    boardName: t.boardId.title ?? "Unknown Board",
    assigneeId: session.id,
    creatorId: t.creatorId.toString(),
    createdAt: t.createdAt?.toISOString() ?? "",
    updatedAt: t.updatedAt?.toISOString() ?? "",
  }));

  const serializedBoards = boards.map((b: any) => ({
    id: b._id.toString(),
    title: b.title,
  }));

  const serializedUsers = users.map((u: any) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    avatar: u.avatar ?? "",
    role: u.role,
    createdAt: u.createdAt?.toISOString() ?? "",
  }));


  return (
    <MyTasksClient
      initialTasks={serializedTasks}
      boards={serializedBoards}
      users={serializedUsers}
      currentUser={session}
    />
  );
}
