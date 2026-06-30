"use client";

import { useState } from "react";
import type { UserSummary, SessionUser } from "@/types";

interface Props {
  initialUsers: UserSummary[];
  currentUser: SessionUser;
}

export function TeamMembersClient({ initialUsers, currentUser }: Props) {
  const [users, setUsers] = useState<UserSummary[]>(initialUsers);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleRoleChange(userId: string, newRole: "admin" | "member") {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Are you sure you want to remove this user from the team?")) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch {
      alert("Failed to delete user.");
    }
  }

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Team Members</h1>
        <p className="page-subtitle">Manage user roles and team memberships.</p>
      </div>

      {/* Users List Card */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((member) => {
                const initials = member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                const isSelf = member.id === currentUser.id;

                return (
                  <tr key={member.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-9 h-9 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full object-cover" />
                        ) : initials}
                      </div>
                      <span className="font-semibold text-slate-800 text-sm block">
                        {member.name} {isSelf && <span className="ml-1 text-xs text-violet-500">(You)</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {member.email}
                    </td>
                    <td className="px-6 py-4">
                      {isSelf ? (
                        <span className="badge badge-admin capitalize">{member.role}</span>
                      ) : (
                        <select
                          disabled={updatingId === member.id}
                          className="input py-1.5 px-3 w-32 capitalize text-xs"
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as any)}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(member.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isSelf && (
                        <button
                          onClick={() => handleDeleteUser(member.id)}
                          className="btn-ghost text-red-500 hover:bg-red-50 py-1.5 px-3 rounded-lg text-xs font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
