"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

interface Board {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

function BoardCard({ board, onDelete }: { board: Board; onDelete: (id: string) => void }) {
  return (
    <Link href={`/board/${board.id}`} className="card-hover p-6 block group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
          {board.title[0]?.toUpperCase()}
        </div>
        <span className="text-xs text-slate-400">
          {new Date(board.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
      <h3 className="font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">{board.title}</h3>
      {board.description && (
        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{board.description}</p>
      )}
      <div className="mt-4 flex items-center text-xs text-violet-600 font-medium">
        Open board
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="ml-1 group-hover:translate-x-1 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  async function fetchBoards() {
    const res = await fetch("/api/boards");
    if (res.ok) {
      const data = await res.json();
      setBoards(data.boards);
    }
    setLoading(false);
  }

  useEffect(() => { fetchBoards(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description }),
    });
    if (res.ok) {
      const data = await res.json();
      setBoards((prev) => [data.board, ...prev]);
      setTitle("");
      setDescription("");
      setShowModal(false);
    }
    setCreating(false);
  }

  function handleDelete(id: string) {
    setBoards((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Boards</h1>
          <p className="page-subtitle">Manage your project boards</p>
        </div>
        <button onClick={() => setShowModal(true)} id="create-board-btn" className="btn-primary">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Board
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="w-10 h-10 bg-slate-200 rounded-xl mb-3" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-slate-700">No boards yet</h3>
          <p className="text-slate-500 mt-1 text-sm">Create your first board to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Create Board</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Create New Board</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost btn-sm">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="form-group">
                <label className="label">Board name *</label>
                <input
                  autoFocus
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Product Roadmap"
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this board for?"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? "Creating..." : "Create Board"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
