"use client";

import { Button, cn } from "@my-day/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => api.projects.list({ page: 1, pageSize: 50 }) });

  const createMut = useMutation({
    mutationFn: () => api.projects.create({ name: name.trim() }),
    onSuccess: () => { setName(""); void qc.invalidateQueries({ queryKey: ["projects"] }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.projects.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-fg">Projects</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) createMut.mutate(); }}
        className="flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New project name…"
          className="h-9 flex-1 rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <Button type="submit" disabled={!name.trim() || createMut.isPending} className="h-9">
          {createMut.isPending ? "Creating…" : "Create"}
        </Button>
      </form>

      {projects.isPending && <p className="text-muted text-sm">Loading…</p>}
      {projects.isError && <p className="text-bad text-sm">{String(projects.error)}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {(projects.data?.items ?? []).map((p) => (
          <div key={p.id} className="rounded-xl border border-line/50 bg-surface p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-fg">{p.name}</p>
              <p className="text-xs text-muted">{p.status}</p>
            </div>
            <button
              type="button"
              onClick={() => deleteMut.mutate(p.id)}
              className="text-xs text-muted hover:text-bad"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}