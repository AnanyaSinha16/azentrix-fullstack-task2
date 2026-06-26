"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import Link from "next/link";
import { BoardData, CardData, SessionUser, UserSummary } from "@/types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { CardModal } from "./CardModal";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket-client";
import { canEditCard, canDeleteCard } from "@/lib/permissions";

interface BoardViewProps {
  boardId: string;
  initialBoard: BoardData;
  users: UserSummary[];
  currentUser: SessionUser;
}

function serializeCard(card: CardData): CardData {
  return {
    ...card,
    dueDate: card.dueDate ? new Date(card.dueDate).toISOString() : null,
  };
}

export function BoardView({
  boardId,
  initialBoard,
  users,
  currentUser,
}: BoardViewProps) {
  const [board, setBoard] = useState<BoardData>(() => ({
    ...initialBoard,
    columns: initialBoard.columns.map((col) => ({
      ...col,
      cards: col.cards.map(serializeCard),
    })),
  }));
  const [activeCard, setActiveCard] = useState<CardData | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newColumnId, setNewColumnId] = useState(initialBoard.columns[0]?.id ?? "");
  const [connected, setConnected] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const findColumn = useCallback(
    (id: string) => {
      if (board.columns.some((col) => col.id === id)) {
        return board.columns.find((col) => col.id === id)!;
      }
      return board.columns.find((col) => col.cards.some((c) => c.id === id));
    },
    [board.columns]
  );

  const findCard = useCallback(
    (id: string) => {
      for (const col of board.columns) {
        const card = col.cards.find((c) => c.id === id);
        if (card) return { card, columnId: col.id };
      }
      return null;
    },
    [board.columns]
  );

  useEffect(() => {
    const socket = connectSocket();
    socket.emit("join-board", boardId);
    setConnected(socket.connected);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onCreated = ({ card }: { card: CardData }) => {
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) =>
          col.id === card.columnId
            ? { ...col, cards: [...col.cards, serializeCard(card)] }
            : col
        ),
      }));
    };

    const onUpdated = ({ card }: { card: CardData }) => {
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => {
          const filtered = col.cards.filter((c) => c.id !== card.id);
          if (col.id === card.columnId) {
            const next = [...filtered, serializeCard(card)].sort(
              (a, b) => a.order - b.order
            );
            return { ...col, cards: next };
          }
          return { ...col, cards: filtered };
        }),
      }));
    };

    const onDeleted = ({ cardId }: { cardId: string }) => {
      setBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => c.id !== cardId),
        })),
      }));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("card:created", onCreated);
    socket.on("card:updated", onUpdated);
    socket.on("card:deleted", onDeleted);

    return () => {
      socket.emit("leave-board", boardId);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("card:created", onCreated);
      socket.off("card:updated", onUpdated);
      socket.off("card:deleted", onDeleted);
      disconnectSocket();
    };
  }, [boardId]);

  async function persistCardMove(
    cardId: string,
    columnId: string,
    order: number
  ) {
    await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId, columnId, order }),
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const found = findCard(String(event.active.id));
    if (found) setActiveCard(found.card);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeFound = findCard(activeId);
    if (!activeFound) return;

    const overColumn = findColumn(overId);
    const activeColumn = findColumn(activeFound.columnId);
    if (!overColumn || !activeColumn) return;

    if (activeColumn.id === overColumn.id) return;

    setBoard((prev) => {
      const activeCards = [...activeColumn.cards];
      const overCards = [...overColumn.cards];
      const activeIndex = activeCards.findIndex((c) => c.id === activeId);
      if (activeIndex < 0) return prev;

      const [moved] = activeCards.splice(activeIndex, 1);
      const overIndex = overCards.findIndex((c) => c.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : overCards.length;
      overCards.splice(insertAt, 0, { ...moved, columnId: overColumn.id });

      return {
        ...prev,
        columns: prev.columns.map((col) => {
          if (col.id === activeColumn.id) return { ...col, cards: activeCards };
          if (col.id === overColumn.id) return { ...col, cards: overCards };
          return col;
        }),
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeFound = findCard(activeId);
    if (!activeFound) return;

    const activeColumn = findColumn(activeFound.columnId)!;
    let overColumn = findColumn(overId);
    if (!overColumn) {
      const overCard = findCard(overId);
      if (overCard) overColumn = findColumn(overCard.columnId);
    }
    if (!overColumn) return;

    setBoard((prev) => {
      const columns = prev.columns.map((col) => ({ ...col, cards: [...col.cards] }));
      const sourceCol = columns.find((c) => c.id === activeColumn.id)!;
      const destCol = columns.find((c) => c.id === overColumn!.id)!;

      const activeIndex = sourceCol.cards.findIndex((c) => c.id === activeId);
      if (activeIndex < 0) return prev;

      let overIndex = destCol.cards.findIndex((c) => c.id === overId);
      if (overIndex < 0) overIndex = destCol.cards.length;

      if (sourceCol.id === destCol.id) {
        sourceCol.cards = arrayMove(sourceCol.cards, activeIndex, overIndex);
      } else {
        const [moved] = sourceCol.cards.splice(activeIndex, 1);
        destCol.cards.splice(overIndex, 0, { ...moved, columnId: destCol.id });
      }

      sourceCol.cards.forEach((c, i) => {
        c.order = i;
      });
      destCol.cards.forEach((c, i) => {
        c.order = i;
      });

      const movedCard = destCol.cards.find((c) => c.id === activeId);
      if (movedCard && canEditCard(currentUser, movedCard)) {
        void persistCardMove(movedCard.id, destCol.id, movedCard.order);
      }

      return { ...prev, columns };
    });
  }

  async function createCard(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newColumnId) return;

    await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId,
        columnId: newColumnId,
        title: newTitle.trim(),
        assigneeId: currentUser.id,
      }),
    });
    setNewTitle("");
  }

  async function saveCard(updates: Partial<CardData> & { boardId: string }) {
    if (!selectedCard) return;
    await fetch(`/api/cards/${selectedCard.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  async function deleteCard() {
    if (!selectedCard) return;
    await fetch(`/api/cards/${selectedCard.id}?boardId=${boardId}`, {
      method: "DELETE",
    });
  }

  const selectedEditable = selectedCard
    ? canEditCard(currentUser, selectedCard)
    : false;
  const selectedDeletable = selectedCard
    ? canDeleteCard(currentUser, selectedCard)
    : false;

  const overlayCard = useMemo(() => activeCard, [activeCard]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/boards" className="text-sm text-brand-600 hover:underline">
            ← All boards
          </Link>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">{board.title}</h1>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            connected
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {connected ? "Live" : "Connecting..."}
        </span>
      </div>

      <form
        onSubmit={createCard}
        className="card-surface mb-6 flex flex-wrap items-end gap-3 p-4"
      >
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-sm font-medium">New card title</label>
          <input
            className="input-field"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What needs to be done?"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Column</label>
          <select
            className="input-field"
            value={newColumnId}
            onChange={(e) => setNewColumnId(e.target.value)}
          >
            {board.columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.title}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          Add card
        </button>
      </form>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {board.columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              currentUser={currentUser}
              onOpenCard={setSelectedCard}
            />
          ))}
        </div>
        <DragOverlay>
          {overlayCard ? (
            <div className="card-surface w-72 rotate-2 p-3 opacity-95 shadow-lg">
              <h3 className="text-sm font-semibold">{overlayCard.title}</h3>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardModal
        card={selectedCard}
        users={users}
        canEdit={selectedEditable}
        boardId={boardId}
        onClose={() => setSelectedCard(null)}
        onSave={saveCard}
        onDelete={selectedDeletable ? deleteCard : undefined}
      />
    </div>
  );
}
