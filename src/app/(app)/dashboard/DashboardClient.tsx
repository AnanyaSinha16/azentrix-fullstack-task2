"use client";

import { FormEvent, useState } from "react";
import type { SessionUser, StandupData, ActivityData } from "@/types";

interface Stats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  overdueTasks: number;
  teamCount: number;
  sprintProgress: number;
}

interface Props {
  user: SessionUser;
  stats: Stats;
  todayStandups: StandupData[];
  recentActivities: ActivityData[];
  myStandup: StandupData | null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function DashboardClient({ user, stats, todayStandups, recentActivities, myStandup: initialStandup }: Props) {
  const [standup, setStandup] = useState(initialStandup);
  const [yesterday, setYesterday] = useState(initialStandup?.yesterday ?? "");
  const [today, setToday] = useState(initialStandup?.today ?? "");
  const [blockers, setBlockers] = useState(initialStandup?.blockers ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!initialStandup);

  async function handleStandup(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/standups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yesterday, today, blockers }),
      });
      if (res.ok) {
        const data = await res.json();
        setStandup(data.standup);
        setSubmitted(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const statCards = [
    { label: "Total Tasks", value: stats.totalTasks, icon: "📋", color: "bg-violet-50", iconBg: "bg-violet-100" },
    { label: "Completed", value: stats.completedTasks, icon: "✅", color: "bg-emerald-50", iconBg: "bg-emerald-100" },
    { label: "In Progress", value: stats.inProgressTasks, icon: "⚡", color: "bg-blue-50", iconBg: "bg-blue-100" },
    { label: "Overdue", value: stats.overdueTasks, icon: "🔴", color: "bg-red-50", iconBg: "bg-red-100" },
    { label: "Team Members", value: stats.teamCount, icon: "👥", color: "bg-amber-50", iconBg: "bg-amber-100" },
    { label: "Todo", value: stats.todoTasks, icon: "📝", color: "bg-slate-50", iconBg: "bg-slate-100" },
  ];

  return (
    <div className="fade-in space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
          <span className="text-violet-600">{user.name.split(" ")[0]}</span> 👋
        </h1>
        <p className="page-subtitle">Here&apos;s what&apos;s happening with your team today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className={`card p-5 ${stat.color}`}>
            <div className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center text-xl mb-3`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Sprint Progress */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Sprint Progress</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {stats.completedTasks} of {stats.totalTasks} tasks completed
            </p>
          </div>
          <span className="text-3xl font-bold text-violet-600">{stats.sprintProgress}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700"
            style={{ width: `${stats.sprintProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Standup Form */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center text-lg">🎯</div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Daily Standup</h2>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          {submitted && standup ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 flex items-center gap-2">
                <span>✅</span> Standup submitted!
              </div>
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">YESTERDAY</p>
                  <p className="text-sm text-slate-700">{standup.yesterday}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">TODAY</p>
                  <p className="text-sm text-slate-700">{standup.today}</p>
                </div>
                {standup.blockers && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-500 mb-1">BLOCKERS</p>
                    <p className="text-sm text-slate-700">{standup.blockers}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSubmitted(false)}
                className="btn-secondary btn-sm w-full"
              >
                Edit standup
              </button>
            </div>
          ) : (
            <form onSubmit={handleStandup} className="space-y-4">
              <div>
                <label className="label text-xs text-slate-500 uppercase tracking-wider">What did you do yesterday?</label>
                <textarea
                  required
                  rows={2}
                  value={yesterday}
                  onChange={(e) => setYesterday(e.target.value)}
                  placeholder="Completed the login UI..."
                  className="input resize-none text-sm"
                />
              </div>
              <div>
                <label className="label text-xs text-slate-500 uppercase tracking-wider">What will you do today?</label>
                <textarea
                  required
                  rows={2}
                  value={today}
                  onChange={(e) => setToday(e.target.value)}
                  placeholder="Working on dashboard analytics..."
                  className="input resize-none text-sm"
                />
              </div>
              <div>
                <label className="label text-xs text-slate-500 uppercase tracking-wider">Any blockers?</label>
                <textarea
                  rows={2}
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  placeholder="None..."
                  className="input resize-none text-sm"
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? "Submitting..." : "Submit standup"}
              </button>
            </form>
          )}
        </div>

        {/* Activity Feed */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-lg">⚡</div>
            <h2 className="text-base font-semibold text-slate-900">Team Activity</h2>
          </div>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No activity yet.</p>
            ) : (
              recentActivities.map((activity) => {
                const initials = activity.userName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">
                        <span className="font-medium">{activity.userName}</span>{" "}
                        <span className="text-slate-500">{activity.action}</span>
                        {activity.entityName && (
                          <span className="font-medium"> &ldquo;{activity.entityName}&rdquo;</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{timeAgo(activity.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Today's Standups */}
      {todayStandups.length > 0 && (
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-5">
            Team Standups Today
            <span className="ml-2 badge badge-in_progress">{todayStandups.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {todayStandups.map((s) => {
              const initials = s.userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <div key={s.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {initials}
                    </div>
                    <span className="font-medium text-sm text-slate-800">{s.userName}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-slate-400 font-medium uppercase tracking-wider mb-0.5">Yesterday</p>
                      <p className="text-slate-600">{s.yesterday}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium uppercase tracking-wider mb-0.5">Today</p>
                      <p className="text-slate-600">{s.today}</p>
                    </div>
                    {s.blockers && (
                      <div>
                        <p className="text-red-400 font-medium uppercase tracking-wider mb-0.5">Blockers</p>
                        <p className="text-slate-600">{s.blockers}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
