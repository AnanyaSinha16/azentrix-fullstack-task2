"use client";

import { FormEvent, useEffect, useState } from "react";
import { Priority } from "@prisma/client";
import { CardData, UserSummary } from "@/types";

interface CardModalProps {
  card: CardData | null;
  users: UserSummary[];
  canEdit: boolean;
  onClose: () => void;
  onSave: (updates: Partial<CardData> & { boardId: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  boardId: string;
}

export function CardModal({
  card,
  users,
  canEdit,
  onClose,
  onSave,
  onDelete,
  boardId,
}: CardModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description);
      setAssigneeId(card.assigneeId ?? "");
      setDueDate(card.dueDate ? card.dueDate.slice(0, 10) : "");
      setPriority(card.priority);
    }
  }, [card]);

  if (!card) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    await onSave({
      boardId,
      title,
      description,
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
      priority,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card-surface max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Card details</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            ✕
          </button>
        </div>

        {!canEdit && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Read-only: you can only edit cards assigned to you (admins can edit all).
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              className="input-field min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Assignee</label>
              <select
                className="input-field"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                disabled={!canEdit}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Due date</label>
              <input
                type="date"
                className="input-field"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Priority</label>
            <select
              className="input-field"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              disabled={!canEdit}
            >
              {Object.values(Priority).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {canEdit && (
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
            {canEdit && onDelete && (
              <button
                type="button"
                className="ml-auto rounded-lg bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700"
                onClick={async () => {
                  await onDelete();
                  onClose();
                }}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
