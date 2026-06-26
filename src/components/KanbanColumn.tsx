"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CardData, ColumnData, SessionUser } from "@/types";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  column: ColumnData;
  currentUser: SessionUser;
  onOpenCard: (card: CardData) => void;
}

export function KanbanColumn({ column, currentUser, onOpenCard }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      className={`flex w-80 shrink-0 flex-col rounded-xl border bg-slate-100/80 p-3 ${
        isOver ? "border-brand-400 ring-2 ring-brand-200" : "border-slate-200"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          {column.title}
        </h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
          {column.cards.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex min-h-[200px] flex-1 flex-col gap-3">
        <SortableContext
          items={column.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              currentUser={currentUser}
              onOpen={onOpenCard}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
