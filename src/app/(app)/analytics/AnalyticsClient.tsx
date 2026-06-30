"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import type { AnalyticsData } from "@/types";

interface Props {
  data: AnalyticsData;
}

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#64748b"];
const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

export function AnalyticsClient({ data }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="py-24 text-center text-slate-400">
        Loading analytics visualizations...
      </div>
    );
  }

  // Format priority keys for nice display
  const priorityData = data.byPriority.map((p) => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    value: p.count,
  }));

  // Format status keys for display
  const statusData = data.byStatus.map((s) => ({
    name: s.status === "in_progress" ? "In Progress" : s.status === "todo" ? "To Do" : "Done",
    value: s.count,
  }));

  return (
    <div className="fade-in space-y-8">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Visual performance indicators and workload indicators.</p>
      </div>

      {/* Numerical Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Completion Rate</span>
          <span className="text-3xl font-extrabold text-violet-600 block mt-2">{data.completionRate}%</span>
        </div>
        <div className="card p-5">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Total Tasks</span>
          <span className="text-3xl font-extrabold text-slate-800 block mt-2">{data.totalTasks}</span>
        </div>
        <div className="card p-5">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">In Progress</span>
          <span className="text-3xl font-extrabold text-blue-600 block mt-2">{data.inProgressTasks}</span>
        </div>
        <div className="card p-5">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Overdue Tasks</span>
          <span className="text-3xl font-extrabold text-red-500 block mt-2">{data.overdueTasks}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Trend (Line Chart) */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Completion Trend (Last 7 Days)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.completionTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={(str) => {
                  const d = new Date(str);
                  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                }} stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="completed" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Board Performance (Bar Chart) */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Task Breakdown per Board</h3>
          <div className="h-80 w-full">
            {data.byBoard.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No task data per board available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byBoard} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="boardName" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" name="Total Tasks" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priorities Breakdown (Pie Chart) */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Priority Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            {priorityData.length === 0 ? (
              <div className="text-slate-400 text-sm">No priority data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PRIORITY_COLORS[entry.name.toLowerCase()] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tasks`, "Count"]} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Breakdown (Pie Chart) */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Status Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            {statusData.length === 0 ? (
              <div className="text-slate-400 text-sm">No status data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tasks`, "Count"]} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
