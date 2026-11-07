"use client";

import { Button } from "@my-day/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";

export default function CalendarPage() {
  const qc = useQueryClient();
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const events = useQuery({ queryKey: ["calendar-events", from, to], queryFn: () => api.calendar.events({ from, to }) });

  const createMut = useMutation({
    mutationFn: () => api.calendar.createEvent({ title: title.trim(), startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString() }),
    onSuccess: () => { setTitle(""); setStartAt(""); setEndAt(""); void qc.invalidateQueries({ queryKey: ["calendar-events"] }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.calendar.removeEvent(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["calendar-events"] }),
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-fg">Calendar</h1>

      <div className="rounded-xl border border-line/50 bg-surface p-4 space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title…"
          className="h-9 w-full rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
        <div className="grid grid-cols-2 gap-2">
          <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)}
            className="h-9 rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
          <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)}
            className="h-9 rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
        </div>
        <Button onClick={() => createMut.mutate()} disabled={!title.trim() || !startAt || !endAt || createMut.isPending} className="h-9">
          {createMut.isPending ? "Creating…" : "Create event"}
        </Button>
      </div>

      {events.isPending && <p className="text-muted text-sm">Loading…</p>}

      <div className="space-y-2">
        {(events.data ?? []).map((e) => (
          <div key={e.id} className="rounded-xl border border-line/50 bg-surface p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-fg">{e.title}</p>
              <p className="text-xs text-muted">{new Date(e.startAt).toLocaleString()} – {new Date(e.endAt).toLocaleString()}</p>
            </div>
            <button type="button" onClick={() => deleteMut.mutate(e.id)} className="text-xs text-muted hover:text-bad">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}