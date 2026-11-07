"use client";

import { Button } from "@my-day/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";

export default function RemindersPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const reminders = useQuery({ queryKey: ["reminders"], queryFn: () => api.reminders.list({ page: 1, pageSize: 50 }) });

  const createMut = useMutation({
    mutationFn: () => api.reminders.create({ title: title.trim(), remindAt: new Date(remindAt).toISOString() }),
    onSuccess: () => { setTitle(""); setRemindAt(""); void qc.invalidateQueries({ queryKey: ["reminders"] }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.reminders.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-fg">Reminders</h1>

      <div className="rounded-xl border border-line/50 bg-surface p-4 space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Reminder title…"
          className="h-9 w-full rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <input
          type="datetime-local"
          value={remindAt}
          onChange={(e) => setRemindAt(e.target.value)}
          className="h-9 w-full rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <Button onClick={() => createMut.mutate()} disabled={!title.trim() || !remindAt || createMut.isPending} className="h-9">
          {createMut.isPending ? "Creating…" : "Create reminder"}
        </Button>
      </div>

      {reminders.isPending && <p className="text-muted text-sm">Loading…</p>}

      <div className="space-y-2">
        {(reminders.data?.items ?? []).map((r) => (
          <div key={r.id} className="rounded-xl border border-line/50 bg-surface p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-fg">{r.title}</p>
              <p className="text-xs text-muted">{new Date(r.remindAt).toLocaleString()} · {r.status}</p>
            </div>
            <button type="button" onClick={() => deleteMut.mutate(r.id)} className="text-xs text-muted hover:text-bad">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}