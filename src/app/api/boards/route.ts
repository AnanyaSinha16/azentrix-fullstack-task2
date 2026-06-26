import { NextRequest, NextResponse } from "next/server";
import { ColumnStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, unauthorized } from "@/lib/auth";

const DEFAULT_COLUMNS: { title: string; status: ColumnStatus; order: number }[] = [
  { title: "To Do", status: ColumnStatus.TODO, order: 0 },
  { title: "In Progress", status: ColumnStatus.IN_PROGRESS, order: 1 },
  { title: "Done", status: ColumnStatus.DONE, order: 2 },
];

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  const boards = await prisma.board.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      columns: { orderBy: { order: "asc" }, include: { _count: { select: { cards: true } } } },
    },
  });

  return NextResponse.json({ boards });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const board = await prisma.board.create({
    data: {
      title,
      columns: { create: DEFAULT_COLUMNS },
    },
    include: {
      columns: { orderBy: { order: "asc" }, include: { _count: { select: { cards: true } } } },
    },
  });

  return NextResponse.json({ board }, { status: 201 });
}
