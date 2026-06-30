"use client";

import { useRouter } from "next/navigation";
import type { ActivityData } from "@/types";

interface Props {
  initialActivities: ActivityData[];
  currentPage: number;
  totalPages: number;
}

export function ActivityLogsClient({ initialActivities, currentPage, totalPages }: Props) {
  const router = useRouter();

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return;
    router.push(`/activity-logs?page=${newPage}`);
  }

  function getEntityIcon(entity: string) {
    switch (entity) {
      case "task":
        return "📋";
      case "board":
        return "🗂️";
      case "user":
        return "👤";
      case "standup":
        return "🎯";
      default:
        return "⚡";
    }
  }

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Activity Logs</h1>
        <p className="page-subtitle">Historical audit trail of all team actions.</p>
      </div>

      {/* Activity Timeline Card */}
      <div className="card p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {initialActivities.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No activity logged yet.</div>
            ) : (
              initialActivities.map((activity, idx) => {
                const isLast = idx === initialActivities.length - 1;
                return (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {!isLast && (
                        <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-lg border border-slate-100">
                            {getEntityIcon(activity.entity)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-slate-700">
                              <span className="font-semibold text-slate-900">{activity.userName}</span>{" "}
                              <span className="text-slate-500">{activity.action}</span>
                              {activity.entityName && (
                                <span className="font-semibold text-slate-900"> &ldquo;{activity.entityName}&rdquo;</span>
                              )}
                              {activity.boardName && (
                                <span className="text-slate-500"> on board <span className="font-medium text-slate-700">{activity.boardName}</span></span>
                              )}
                            </p>
                          </div>
                          <div className="text-right text-xs whitespace-nowrap text-slate-400">
                            {new Date(activity.createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="btn-secondary btn-sm px-4"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="btn-secondary btn-sm px-4"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
