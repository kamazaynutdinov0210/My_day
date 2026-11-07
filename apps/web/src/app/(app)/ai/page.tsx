"use client";

import { Button } from "@my-day/ui";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";

export default function AiPage() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [proposed, setProposed] = useState<unknown>(null);

  const chatMut = useMutation({
    mutationFn: () => api.ai.chat({ message }),
    onSuccess: (data) => {
      setReply(data.reply);
      setProposed(data.proposedAction);
    },
  });

  const confirmMut = useMutation({
    mutationFn: () => api.ai.confirm({ action: proposed as never, confirmed: true }),
    onSuccess: () => { setProposed(null); setReply("Action applied."); },
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-fg">AI Assistant</h1>

      <div className="rounded-xl border border-line/50 bg-surface p-4 space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Ask me to create a task, event, or reminder…"
          className="w-full rounded-lg border border-line bg-raised/40 px-3 py-2 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <Button onClick={() => chatMut.mutate()} disabled={!message.trim() || chatMut.isPending} className="h-9">
          {chatMut.isPending ? "Thinking…" : "Send"}
        </Button>
      </div>

      {reply && (
        <div className="rounded-xl border border-line/50 bg-surface p-4 space-y-3">
          <p className="text-sm text-fg">{reply}</p>
          {proposed != null && (
            <div className="space-y-2">
              <pre className="text-xs text-muted overflow-auto">{JSON.stringify(proposed, null, 2)}</pre>
              <Button size="sm" onClick={() => confirmMut.mutate()} disabled={confirmMut.isPending}>
                {confirmMut.isPending ? "Applying…" : "Confirm action"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}