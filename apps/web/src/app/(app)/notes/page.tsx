"use client";

import { Button } from "@my-day/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";

export default function NotesPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const notes = useQuery({ queryKey: ["notes"], queryFn: () => api.notes.list({ page: 1, pageSize: 50 }) });

  const createMut = useMutation({
    mutationFn: () => api.notes.create({ title: title.trim(), content: content.trim() || "" }),
    onSuccess: () => { setTitle(""); setContent(""); void qc.invalidateQueries({ queryKey: ["notes"] }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.notes.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notes"] }),
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-fg">Notes</h1>

      <div className="rounded-xl border border-line/50 bg-surface p-4 space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title…"
          className="h-9 w-full rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Content…"
          className="w-full rounded-lg border border-line bg-raised/40 px-3 py-2 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <Button onClick={() => createMut.mutate()} disabled={!title.trim() || createMut.isPending} className="h-9">
          {createMut.isPending ? "Saving…" : "Save note"}
        </Button>
      </div>

      {notes.isPending && <p className="text-muted text-sm">Loading…</p>}

      <div className="space-y-3">
        {(notes.data?.items ?? []).map((n) => (
          <div key={n.id} className="rounded-xl border border-line/50 bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-medium text-fg">{n.title}</h2>
              <button type="button" onClick={() => deleteMut.mutate(n.id)} className="text-xs text-muted hover:text-bad">
                Delete
              </button>
            </div>
            {n.content && <p className="mt-2 text-sm text-muted whitespace-pre-wrap">{n.content}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}