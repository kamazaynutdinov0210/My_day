"use client";

import { Button } from "@my-day/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function IntegrationsPage() {
  const qc = useQueryClient();
  const catalog = useQuery({ queryKey: ["integrations-catalog"], queryFn: api.integrations.catalog });
  const accounts = useQuery({ queryKey: ["integrations-accounts"], queryFn: api.integrations.accounts });

  const connectMut = useMutation({
    mutationFn: (provider: string) => api.integrations.connect(provider, { authCode: "demo", redirectUri: window.location.origin }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["integrations-accounts"] });
    },
  });

  const disconnectMut = useMutation({
    mutationFn: (provider: string) => api.integrations.disconnect(provider),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["integrations-accounts"] }),
  });

  const accountByProvider = new Map((accounts.data ?? []).map((a) => [a.provider, a]));

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-fg">Integrations</h1>

      {catalog.isPending && <p className="text-muted text-sm">Loading…</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {(catalog.data ?? []).map((c) => {
          const acc = accountByProvider.get(c.provider);
          const connected = acc?.status === "CONNECTED";
          return (
            <div key={c.id} className="rounded-xl border border-line/50 bg-surface p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-fg">{c.displayName}</p>
                <p className="text-xs text-muted">{connected ? "Connected" : "Not connected"}</p>
              </div>
              {connected ? (
                <Button variant="outline" size="sm" onClick={() => disconnectMut.mutate(c.provider)} disabled={disconnectMut.isPending}>
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" onClick={() => connectMut.mutate(c.provider)} disabled={connectMut.isPending || !c.enabled}>
                  Connect
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}