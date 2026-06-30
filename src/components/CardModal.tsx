"use client";

import { FormEvent, useEffect, useState } from "react";
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

const PRIORITIES = ["low", "medium", "high"] as const;

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
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || "");
      setAssigneeId(card.assigneeId ?? "");
      setDueDate(card.dueDate ? card.dueDate.slice(0, 10) : "");
      setPriority(card.priority as "low" | "medium" | "high" || "medium");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-2xl animate-slideUp border border-slate-100">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Task details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-xl">
            &times;
          </button>
        </div>

        {!canEdit && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 border border-amber-100">
            Read-only: you can only edit cards assigned to you (admins can edit all).
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              className="input min-h-[100px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              placeholder="Add a details description for this task..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="form-group">
              <label className="label">Assignee</label>
              <select
                className="input"
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
            <div className="form-group">
              <label className="label">Due date</label>
              <input
                type="date"
                className="input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Priority</label>
            <select
              className="input capitalize"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              disabled={!canEdit}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
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
                className="ml-auto btn-danger"
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
