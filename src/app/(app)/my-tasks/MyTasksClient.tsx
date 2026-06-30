"use client";

import { useState, useMemo } from "react";
import type { TaskData, UserSummary, SessionUser } from "@/types";
import { priorityColors, formatDate } from "@/lib/utils";
import { CardModal } from "@/components/CardModal";
import { canEditCard, canDeleteCard } from "@/lib/permissions";

interface Props {
  initialTasks: TaskData[];
  boards: { id: string; title: string }[];
  users: UserSummary[];
  currentUser: SessionUser;
}

export function MyTasksClient({ initialTasks, boards, users, currentUser }: Props) {
  const [tasks, setTasks] = useState<TaskData[]>(initialTasks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [boardFilter, setBoardFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                            t.description.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
      const matchesBoard = boardFilter === "all" || t.boardId === boardFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesBoard;
    });
  }, [tasks, search, statusFilter, priorityFilter, boardFilter]);

  async function handleSaveCard(updates: Partial<TaskData> & { boardId: string }) {
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

  async function handleDeleteCard() {
    if (!selectedTask) return;
    const res = await fetch(`/api/tasks/${selectedTask.id}?boardId=${selectedTask.boardId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
    }
  }

  const selectedEditable = selectedTask ? canEditCard(currentUser, selectedTask) : false;
  const selectedDeletable = selectedTask ? canDeleteCard(currentUser, selectedTask) : false;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">My Tasks</h1>
        <p className="page-subtitle">Tasks assigned to you across all project boards.</p>
      </div>

      {/* Filters and Search */}
      <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="form-group">
          <label className="label text-xs uppercase tracking-wider text-slate-500">Search Tasks</label>
          <input
            type="text"
            className="input"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label text-xs uppercase tracking-wider text-slate-500">Filter by Status</label>
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div className="form-group">
          <label className="label text-xs uppercase tracking-wider text-slate-500">Filter by Priority</label>
          <select className="input text-capitalize" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="form-group">
          <label className="label text-xs uppercase tracking-wider text-slate-500">Filter by Board</label>
          <select className="input" value={boardFilter} onChange={(e) => setBoardFilter(e.target.value)}>
            <option value="all">All Boards</option>
            {boards.map((b) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="card overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 font-medium">No tasks found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Title</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Board</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTask(task)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 text-sm block">{task.title}</span>
                      {task.description && (
                        <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">{task.description}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {(task as any).boardName || "Project Board"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`badge ${
                          task.status === "todo"
                            ? "badge-todo"
                            : task.status === "in_progress"
                            ? "badge-in_progress"
                            : "badge-done"
                        }`}
                      >
                        {task.status === "todo" ? "To Do" : task.status === "in_progress" ? "In Progress" : "Done"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${priorityColors[task.priority] || "badge-medium"} capitalize`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(task.dueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTask && (
        <CardModal
          card={selectedTask}
          users={users}
          canEdit={selectedEditable}
          boardId={selectedTask.boardId}
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveCard}
          onDelete={selectedDeletable ? handleDeleteCard : undefined}
        />
      )}
    </div>
  );
}
