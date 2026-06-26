import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { BoardView } from "@/components/BoardView";

export default async function BoardDetailPage({
  params,
}: {
  params: { boardId: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const board = await prisma.board.findUnique({
    where: { id: params.boardId },
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: {
          cards: {
            orderBy: { order: "asc" },
            include: {
              assignee: { select: { id: true, name: true, email: true, role: true } },
              creator: { select: { id: true, name: true, email: true, role: true } },
            },
          },
        },
      },
    },
  });

  if (!board) notFound();

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  const serializedBoard = {
    ...board,
    columns: board.columns.map((col) => ({
      ...col,
      cards: col.cards.map((card) => ({
        ...card,
        dueDate: card.dueDate?.toISOString() ?? null,
      })),
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={session} />
      <main className="mx-auto max-w-[1400px] px-4 py-8">
        <BoardView
          boardId={board.id}
          initialBoard={serializedBoard}
          users={users}
          currentUser={session}
        />
      </main>
    </div>
  );
}
