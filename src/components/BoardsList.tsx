"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

interface BoardListItem {
  id: string;
  title: string;
  columns: { _count: { cards: number } }[];
}

export function BoardsList() {
  const [boards, setBoards] = useState<BoardListItem[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadBoards() {
    const res = await fetch("/api/boards");
    if (res.ok) {
      const data = await res.json();
      setBoards(data.boards);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadBoards();
  }, []);

  async function createBoard(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    if (res.ok) {
      setTitle("");
      await loadBoards();
    }
    setCreating(false);
  }

  if (loading) {
    return <p className="text-slate-600">Loading boards...</p>;
  }

  return (
    <div className="space-y-8">
      <form onSubmit={createBoard} className="card-surface flex flex-wrap gap-3 p-4">
        <input
          className="input-field max-w-md flex-1"
          placeholder="New board title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={creating}>
          Create board
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((board) => {
          const cardCount = board.columns.reduce(
            (sum, col) => sum + col._count.cards,
            0
          );
          return (
            <Link
              key={board.id}
              href={`/boards/${board.id}`}
              className="card-surface block p-5 transition hover:border-brand-300 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-slate-900">{board.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{cardCount} cards</p>
            </Link>
          );
        })}
      </div>

      {boards.length === 0 && (
        <p className="text-center text-slate-500">No boards yet. Create your first one above.</p>
      )}
    </div>
  );
}
