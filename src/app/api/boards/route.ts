import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorized } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Board from "@/models/Board";
import Activity from "@/models/Activity";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  await connectDB();
  const boards = await Board.find().populate("createdBy", "name email").sort({ createdAt: -1 });

  return NextResponse.json({
    boards: boards.map((b) => ({
      id: b._id.toString(),
      title: b.title,
      description: b.description,
      createdBy: b.createdBy,
      createdAt: b.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  const body = await request.json();
  const { title, description } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  await connectDB();
  const board = await Board.create({
    title: title.trim(),
    description: description?.trim() ?? "",
    createdBy: session.id,
    members: [session.id],
  });

  await Activity.create({
    userId: session.id,
    userName: session.name,
    action: "created board",
    entity: "board",
    entityId: board._id.toString(),
    entityName: board.title,
    boardId: board._id.toString(),
    boardName: board.title,
  });

  return NextResponse.json({
    board: {
      id: board._id.toString(),
      title: board.title,
      description: board.description,
      createdBy: session.id,
      createdAt: board.createdAt,
    },
  }, { status: 201 });
}
