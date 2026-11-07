"use client";

import { Button } from "@my-day/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function NotificationsPage() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["notifications"], queryFn: () => api.notifications.list({ page: 1, pageSize: 50 }) });
  const unread = useQuery({ queryKey: ["notifications-unread"], queryFn: api.notifications.unreadCount });

  const markReadMut = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: api.notifications.markAllRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-fg">Notifications</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">Unread: {unread.data?.count ?? 0}</span>
          <Button variant="outline" size="sm" onClick={() => markAllMut.mutate()} disabled={markAllMut.isPending}>
            Mark all read
          </Button>
        </div>
      </div>

      {list.isPending && <p className="text-muted text-sm">Loading…</p>}

      <div className="space-y-2">
        {(list.data?.items ?? []).map((n) => (
          <div key={n.id} className={`rounded-xl border border-line/50 bg-surface p-4 ${n.read ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-fg">{n.title}</p>
                {n.message && <p className="text-sm text-muted mt-1">{n.message}</p>}
              </div>
              {!n.read && (
                <button type="button" onClick={() => markReadMut.mutate(n.id)} className="text-xs text-accent hover:underline">
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}