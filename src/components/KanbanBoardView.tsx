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
import { BoardData, TaskData, SessionUser, UserSummary } from "@/types";
import { KanbanColumn } from "./KanbanColumn";
import { CardModal } from "./CardModal";
import { connectSocket, disconnectSocket } from "@/lib/socket-client";
import { canEditCard, canDeleteCard } from "@/lib/permissions";

interface KanbanBoardViewProps {
  board: Omit<BoardData, "members" | "tasks">;
  initialTasks: TaskData[];
  users: UserSummary[];
  currentUser: SessionUser;
}

const COLUMNS = [
  { id: "todo" as const, title: "To Do" },
  { id: "in_progress" as const, title: "In Progress" },
  { id: "done" as const, title: "Done" },
];

export function KanbanBoardView({
  board,
  initialTasks,
  users,
  currentUser,
}: KanbanBoardViewProps) {
  const [tasks, setTasks] = useState<TaskData[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<TaskData | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newColumnId, setNewColumnId] = useState<"todo" | "in_progress" | "done">("todo");
  const [connected, setConnected] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // Group tasks by status for columns
  const columnsData = useMemo(() => {
    return COLUMNS.map((col) => ({
      id: col.id,
      title: col.title,
      cards: tasks
        .filter((t) => t.status === col.id)
        .sort((a, b) => a.order - b.order),
    }));
  }, [tasks]);

  const findTask = useCallback(
    (id: string) => {
      return tasks.find((t) => t.id === id) || null;
    },
    [tasks]
  );

  useEffect(() => {
    const socket = connectSocket();
    socket.emit("join-board", board.id);
    setConnected(socket.connected);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onCreated = ({ task }: { task: TaskData }) => {
      setTasks((prev) => {
        if (prev.some((t) => t.id === task.id)) return prev;
        return [...prev, task];
      });
    };

    const onUpdated = ({ task }: { task: TaskData }) => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    };

    const onDeleted = ({ taskId }: { taskId: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("task:created", onCreated);
    socket.on("task:updated", onUpdated);
    socket.on("task:deleted", onDeleted);

    return () => {
      socket.emit("leave-board", board.id);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("task:created", onCreated);
      socket.off("task:updated", onUpdated);
      socket.off("task:deleted", onDeleted);
      disconnectSocket();
    };
  }, [board.id]);

  async function persistTaskMove(
    taskId: string,
    status: string,
    order: number
  ) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId: board.id, status, order }),
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const found = findTask(String(event.active.id));
    if (found) setActiveTask(found);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeTaskObj = findTask(activeId);
    if (!activeTaskObj) return;

    // Check if dragging over a column directly or another task card
    const isOverColumn = COLUMNS.some((col) => col.id === overId);
    const targetStatus = isOverColumn
      ? (overId as "todo" | "in_progress" | "done")
      : (findTask(overId)?.status as "todo" | "in_progress" | "done");

    if (!targetStatus) return;

    if (activeTaskObj.status !== targetStatus) {
      setTasks((prev) => {
        return prev.map((t) => {
          if (t.id === activeId) {
            return { ...t, status: targetStatus };
          }
          return t;
        });
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeTaskObj = findTask(activeId);
    if (!activeTaskObj) return;

    const isOverColumn = COLUMNS.some((col) => col.id === overId);
    const targetStatus = isOverColumn
      ? (overId as "todo" | "in_progress" | "done")
      : (findTask(overId)?.status as "todo" | "in_progress" | "done");

    if (!targetStatus) return;

    setTasks((prev) => {
      // Filter out tasks in other columns
      const columnTasks = prev.filter((t) => t.status === targetStatus);
      const otherTasks = prev.filter((t) => t.status !== targetStatus);

      const activeIndex = columnTasks.findIndex((t) => t.id === activeId);
      let overIndex = columnTasks.findIndex((t) => t.id === overId);

      if (overIndex < 0) {
        overIndex = columnTasks.length;
      }

      let updatedColumnTasks = [...columnTasks];

      if (activeIndex >= 0) {
        updatedColumnTasks = arrayMove(columnTasks, activeIndex, overIndex);
      } else {
        // Dragged from another column, insert it
        const movedTask = prev.find((t) => t.id === activeId);
        if (movedTask) {
          const newTask = { ...movedTask, status: targetStatus };
          updatedColumnTasks.splice(overIndex, 0, newTask);
        }
      }

      // Re-assign orders
      const finalColumnTasks = updatedColumnTasks.map((t, idx) => ({
        ...t,
        order: idx,
      }));

      // Find the moved task to trigger API patch
      const updatedTaskObj = finalColumnTasks.find((t) => t.id === activeId);
      if (updatedTaskObj && canEditCard(currentUser, updatedTaskObj)) {
        void persistTaskMove(updatedTaskObj.id, updatedTaskObj.status, updatedTaskObj.order);
      }

      return [...otherTasks, ...finalColumnTasks];
    });
  }

  async function createCard(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newColumnId) return;

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: board.id,
        status: newColumnId,
        title: newTitle.trim(),
        assigneeId: currentUser.id,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setTasks((prev) => [...prev, data.task]);
      setNewTitle("");
    }
  }

  async function saveCard(updates: Partial<TaskData> & { boardId: string }) {
    if (!selectedTask) return;
    const res = await fetch(`/api/tasks/${selectedTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? data.task : t)));
    }
  }

  async function deleteCard() {
    if (!selectedTask) return;
    const res = await fetch(`/api/tasks/${selectedTask.id}?boardId=${board.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
    }
  }

  const selectedEditable = selectedTask
    ? canEditCard(currentUser, selectedTask)
    : false;
  const selectedDeletable = selectedTask
    ? canDeleteCard(currentUser, selectedTask)
    : false;

  const overlayTask = useMemo(() => activeTask, [activeTask]);

  return (
    <div className="fade-in space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/boards" className="text-sm text-violet-600 hover:text-violet-700 font-medium inline-flex items-center gap-1">
            ← All boards
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{board.title}</h1>
          {board.description && <p className="text-slate-500 text-sm mt-1">{board.description}</p>}
        </div>
        <span
          className={`badge ${
            connected
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {connected ? "Live connected" : "Connecting..."}
        </span>
      </div>

      {/* Quick Add Form */}
      <form
        onSubmit={createCard}
        className="card p-4 flex flex-wrap items-end gap-3"
      >
        <div className="min-w-[200px] flex-1">
          <label className="label text-xs uppercase tracking-wider text-slate-500">New Task Title</label>
          <input
            className="input"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Describe this task..."
          />
        </div>
        <div>
          <label className="label text-xs uppercase tracking-wider text-slate-500">Initial Status</label>
          <select
            className="input"
            value={newColumnId}
            onChange={(e) => setNewColumnId(e.target.value as any)}
          >
            {COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>
                {col.title}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary py-3">
          Add Task
        </button>
      </form>

      {/* Kanban Drag & Drop Area */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columnsData.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column as any}
              currentUser={currentUser}
              onOpenCard={setSelectedTask as any}
            />
          ))}
        </div>
        <DragOverlay>
          {overlayTask ? (
            <div className="card w-72 rotate-2 p-3 opacity-95 shadow-lg border border-violet-200">
              <h3 className="text-sm font-semibold text-slate-900">{overlayTask.title}</h3>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardModal
        card={selectedTask as any}
        users={users}
        canEdit={selectedEditable}
        boardId={board.id}
        onClose={() => setSelectedTask(null)}
        onSave={saveCard as any}
        onDelete={selectedDeletable ? deleteCard : undefined}
      />
    </div>
  );
}
