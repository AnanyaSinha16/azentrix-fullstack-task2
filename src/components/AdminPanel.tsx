"use client";

import { Role } from "@prisma/client";
import { useEffect, useState } from "react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  _count: { assignedCards: number; createdCards: number };
}

export function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    if (!res.ok) {
      setError("Unable to load users");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setUsers(data.users);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function updateUser(userId: string, updates: { role?: Role; name?: string }) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) await loadUsers();
  }

  async function deleteUser(userId: string) {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) await loadUsers();
  }

  if (loading) return <p>Loading users...</p>;
  if (error) return <p className="text-rose-600">{error}</p>;

  return (
    <div className="card-surface overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Cards</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">{user.name}</td>
              <td className="px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">
                <select
                  className="input-field max-w-[120px]"
                  value={user.role}
                  onChange={(e) =>
                    updateUser(user.id, { role: e.target.value as Role })
                  }
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {user._count.assignedCards} assigned / {user._count.createdCards} created
              </td>
              <td className="px-4 py-3">
                <button
                  className="text-sm text-rose-600 hover:underline"
                  onClick={() => deleteUser(user.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
