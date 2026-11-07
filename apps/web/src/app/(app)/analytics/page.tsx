"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AnalyticsPage() {
  const overview = useQuery({ queryKey: ["analytics-overview"], queryFn: () => api.analytics.overview() });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-fg">Analytics</h1>

      {overview.isPending && <p className="text-muted text-sm">Loading…</p>}
      {overview.isError && <p className="text-bad text-sm">{String(overview.error)}</p>}

      {overview.data && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Tasks completed", value: overview.data.tasksCompleted },
            { label: "Overdue", value: overview.data.tasksOverdue },
            { label: "Completion rate", value: `${Math.round(overview.data.completionRate * 100)}%` },
            { label: "Focus minutes", value: overview.data.focusMinutes },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-line/50 bg-surface p-4">
              <p className="text-xs text-muted">{s.label}</p>
              <p className="text-2xl font-semibold text-fg mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {overview.data && overview.data.projectProgress.length > 0 && (
        <div className="rounded-xl border border-line/50 bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">Project progress</h2>
          {overview.data.projectProgress.map((p) => (
            <div key={p.projectId}>
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>{p.name}</span>
                <span>{p.progressPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-line">
                <div className="h-2 rounded-full bg-accent" style={{ width: `${p.progressPercent}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}