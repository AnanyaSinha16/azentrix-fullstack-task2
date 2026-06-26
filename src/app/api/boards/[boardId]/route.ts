import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, unauthorized } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  const board = await prisma.board.findUnique({
    where: { id: params.boardId },
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: {
          cards: {
            orderBy: { order: "asc" },
            include: {
              assignee: { select: { id: true, name: true, email: true } },
              creator: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ board, users, currentUser: session });
}
