import { NextRequest, NextResponse } from "next/server";
import { Priority } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, unauthorized } from "@/lib/auth";
import { emitBoardEvent } from "@/lib/socket-events";

const createCardSchema = z.object({
  boardId: z.string(),
  columnId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.nativeEnum(Priority).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorized();

  try {
    const body = await request.json();
    const parsed = createCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { boardId, columnId, title, description, assigneeId, dueDate, priority } =
      parsed.data;

    const column = await prisma.column.findFirst({
      where: { id: columnId, boardId },
    });
    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const maxOrder = await prisma.card.aggregate({
      where: { columnId },
      _max: { order: true },
    });

    const card = await prisma.card.create({
      data: {
        title,
        description: description ?? "",
        assigneeId: assigneeId ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority ?? Priority.MEDIUM,
        order: (maxOrder._max.order ?? -1) + 1,
        columnId,
        creatorId: session.id,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    emitBoardEvent(boardId, "card:created", { card });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    console.error("Create card error:", error);
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }
}
