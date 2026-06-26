"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardData, SessionUser } from "@/types";
import { cn, formatDate, priorityColors } from "@/lib/utils";
import { canEditCard } from "@/lib/permissions";

interface KanbanCardProps {
  card: CardData;
  currentUser: SessionUser;
  onOpen: (card: CardData) => void;
}

export function KanbanCard({ card, currentUser, onOpen }: KanbanCardProps) {
  const editable = canEditCard(currentUser, card);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: card.id,
      disabled: !editable,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "card-surface cursor-pointer p-3",
        isDragging && "opacity-50 ring-2 ring-brand-400",
        !editable && "opacity-80"
      )}
      onClick={() => onOpen(card)}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
        {editable && (
          <button
            type="button"
            className="cursor-grab text-slate-400 hover:text-slate-600 active:cursor-grabbing"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            aria-label="Drag card"
          >
            ⠿
          </button>
        )}
      </div>
      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-600">{card.description}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
            priorityColors[card.priority]
          )}
        >
          {card.priority}
        </span>
        <span className="text-[10px] text-slate-500">{formatDate(card.dueDate)}</span>
      </div>
      {card.assignee && (
        <p className="mt-2 text-xs text-slate-500">Assignee: {card.assignee.name}</p>
      )}
    </div>
  );
}
