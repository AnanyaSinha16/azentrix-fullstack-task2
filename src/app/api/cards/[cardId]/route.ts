import { NextRequest, NextResponse } from "next/server";
import { Priority } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, unauthorized, forbidden } from "@/lib/auth";
import { canEditCard, canDeleteCard } from "@/lib/permissions";
import { emitBoardEvent } from "@/lib/socket-events";

const updateSchema = z.object({
  boardId: z.string(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.nativeEnum(Priority).optional(),
  columnId: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const existing = await prisma.card.findUnique({
      where: { id: params.cardId },
      include: { column: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    if (!canEditCard(session, existing)) {
      return forbidden("You can only edit cards assigned to you");
    }

    const { boardId, title, description, assigneeId, dueDate, priority, columnId, order } =
      parsed.data;

    if (columnId && columnId !== existing.columnId) {
      const targetColumn = await prisma.column.findFirst({
        where: { id: columnId, boardId: existing.column.boardId },
      });
      if (!targetColumn) {
        return NextResponse.json({ error: "Target column not found" }, { status: 404 });
      }
    }

    const card = await prisma.card.update({
      where: { id: params.cardId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(priority !== undefined && { priority }),
        ...(columnId !== undefined && { columnId }),
        ...(order !== undefined && { order }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    emitBoardEvent(boardId, "card:updated", { card });

    return NextResponse.json({ card });
  } catch (error) {
    console.error("Update card error:", error);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get("boardId");
  if (!boardId) {
    return NextResponse.json({ error: "boardId is required" }, { status: 400 });
  }

  const existing = await prisma.card.findUnique({
    where: { id: params.cardId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  if (!canDeleteCard(session, existing)) {
    return forbidden("You cannot delete this card");
  }

  await prisma.card.delete({ where: { id: params.cardId } });
  emitBoardEvent(boardId, "card:deleted", { cardId: params.cardId });

  return NextResponse.json({ ok: true });
}
