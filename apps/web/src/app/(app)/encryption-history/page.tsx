"use client";

import { type EncryptionHistoryItem, type EncryptionOperationType, type EncryptionCategory, type EncryptionStatus } from "@my-day/types";
import { Button, cn } from "@my-day/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";

/* ─── Badge helpers ─────────────────────────────────── */
const OP_BADGE: Record<EncryptionOperationType, string> = {
  ENCRYPT: "badge badge-blue",
  DECRYPT: "badge badge-green",
  HASH:    "badge badge-amber",
  KEYGEN:  "badge badge-muted",
};
const OP_LABEL: Record<EncryptionOperationType, string> = {
  ENCRYPT: "Encrypt", DECRYPT: "Decrypt", HASH: "Hash", KEYGEN: "Key Gen",
};
const STATUS_BADGE: Record<EncryptionStatus, string> = {
  SUCCESS: "badge badge-green",
  FAILED:  "badge badge-red",
};
const CAT_LABEL: Record<EncryptionCategory, string> = {
  SYMMETRIC: "Symmetric", ASYMMETRIC: "Asymmetric", HASHING: "Hashing", KEY_DERIVATION: "Key Derivation",
};

/* ─── Detail modal ───────────────────────────────────── */
function DetailModal({ item, onClose }: { item: EncryptionHistoryItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 space-y-4 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-fg">{item.algorithm}</h2>
            <p className="text-xs text-muted mt-0.5">{new Date(item.createdAt).toLocaleString()}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-fg transition-colors text-lg leading-none"
            aria-label="Close"
          >✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted mb-1">Operation</p>
            <span className={OP_BADGE[item.operationType]}>{OP_LABEL[item.operationType]}</span>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Status</p>
            <span className={STATUS_BADGE[item.status]}>{item.status.toLowerCase()}</span>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Category</p>
            <p className="text-fg">{CAT_LABEL[item.category]}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Data type</p>
            <p className="text-fg">{item.dataType}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted mb-1.5">Operation ID</p>
          <code className="text-xs text-fg/70 break-all font-mono">{item.id}</code>
        </div>

        {item.metadata && Object.keys(item.metadata).length > 0 && (
          <div>
            <p className="text-xs text-muted mb-1.5">Metadata</p>
            <pre className="rounded-lg bg-raised/40 border border-line p-3 text-xs text-fg/80 overflow-auto max-h-40">
              {JSON.stringify(item.metadata, null, 2)}
            </pre>
          </div>
        )}

        <div className="rounded-lg bg-raised/40 p-3 text-xs text-muted">
          🔒 Plaintext, keys, and sensitive values are never stored in history.
        </div>

        <Button variant="outline" className="w-full h-9 text-sm" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

/* ─── Clear confirm ──────────────────────────────────── */
function ClearConfirmModal({ count, onConfirm, onClose }: { count: number; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-bad/30 bg-surface p-6 space-y-4 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="mb-3 text-3xl">⚠</div>
          <h2 className="font-semibold text-fg">Clear all history?</h2>
          <p className="mt-1.5 text-sm text-muted">
            This will permanently delete {count} operation record{count !== 1 ? "s" : ""}. This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-9" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 h-9 bg-bad hover:bg-bad/90" onClick={onConfirm}>Clear all</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────── */
export default function EncryptionHistoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [opFilter, setOpFilter] = useState<EncryptionOperationType | "">("");
  const [catFilter, setCatFilter] = useState<EncryptionCategory | "">("");
  const [statusFilter, setStatusFilter] = useState<EncryptionStatus | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<EncryptionHistoryItem | null>(null);
  const [showClear, setShowClear] = useState(false);

  const params = {
    page,
    pageSize: 20,
    search: search || undefined,
    operationType: (opFilter || undefined) as EncryptionOperationType | undefined,
    category: (catFilter || undefined) as EncryptionCategory | undefined,
    status: (statusFilter || undefined) as EncryptionStatus | undefined,
    from: fromDate || undefined,
    to: toDate ? `${toDate}T23:59:59` : undefined,
  };

  const history = useQuery({
    queryKey: ["encryption-history", params],
    queryFn: () => api.crypto.history.list(params),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => api.crypto.history.remove(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["encryption-history"] }); },
  });

  const clearMut = useMutation({
    mutationFn: api.crypto.history.clear,
    onSuccess: () => {
      setShowClear(false);
      void qc.invalidateQueries({ queryKey: ["encryption-history"] });
    },
  });

  const items = history.data?.items ?? [];
  const total = history.data?.pagination.totalItems ?? 0;
  const totalPages = history.data?.pagination.totalPages ?? 1;

  const selectFilter = "h-8 rounded-lg border border-line bg-raised/40 px-2.5 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  return (
    <>
      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}
      {showClear && (
        <ClearConfirmModal
          count={total}
          onConfirm={() => clearMut.mutate()}
          onClose={() => setShowClear(false)}
        />
      )}

      <div className="p-4 md:p-8 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-fg flex items-center gap-2">
              <span className="text-accent">◷</span> Encryption History
            </h1>
            <p className="mt-1 text-sm text-muted">
              Persistent log of all cryptographic operations. Sensitive data is never stored.
            </p>
          </div>
          {total > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-bad border-bad/30 hover:bg-bad/10 shrink-0"
              onClick={() => setShowClear(true)}
              disabled={clearMut.isPending}
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search algorithm…"
            className="h-8 rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg placeholder:text-muted/50 w-44 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <select value={opFilter} onChange={(e) => { setOpFilter(e.target.value as EncryptionOperationType | ""); setPage(1); }} className={selectFilter}>
            <option value="">All operations</option>
            <option value="ENCRYPT">Encrypt</option>
            <option value="DECRYPT">Decrypt</option>
            <option value="HASH">Hash</option>
            <option value="KEYGEN">Key Gen</option>
          </select>
          <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value as EncryptionCategory | ""); setPage(1); }} className={selectFilter}>
            <option value="">All categories</option>
            <option value="SYMMETRIC">Symmetric</option>
            <option value="ASYMMETRIC">Asymmetric</option>
            <option value="HASHING">Hashing</option>
            <option value="KEY_DERIVATION">Key Derivation</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as EncryptionStatus | ""); setPage(1); }} className={selectFilter}>
            <option value="">All statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className={selectFilter}
            aria-label="From date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className={selectFilter}
            aria-label="To date"
          />
          {(search || opFilter || catFilter || statusFilter || fromDate || toDate) && (
            <button
              type="button"
              onClick={() => { setSearch(""); setOpFilter(""); setCatFilter(""); setStatusFilter(""); setFromDate(""); setToDate(""); setPage(1); }}
              className="text-xs text-muted hover:text-fg transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-line/50 bg-surface overflow-hidden">
          {history.isPending ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted text-sm">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              Loading history…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="text-4xl opacity-30">◷</div>
              <p className="text-sm font-medium text-muted">No operations yet</p>
              <p className="text-xs text-muted/70 max-w-xs">
                Operations performed in the Encryption Studio will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line/50 text-xs text-muted">
                    <th className="px-4 py-3 text-left font-medium">Operation</th>
                    <th className="px-4 py-3 text-left font-medium">Algorithm</th>
                    <th className="px-4 py-3 text-left font-medium">Category</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b border-line/30 transition-colors hover:bg-raised/30 cursor-pointer",
                        i === items.length - 1 && "border-b-0",
                      )}
                      onClick={() => setSelected(item)}
                    >
                      <td className="px-4 py-3">
                        <span className={OP_BADGE[item.operationType]}>{OP_LABEL[item.operationType]}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-fg">{item.algorithm}</td>
                      <td className="px-4 py-3 text-muted text-xs">{CAT_LABEL[item.category]}</td>
                      <td className="px-4 py-3">
                        <span className={STATUS_BADGE[item.status]}>{item.status.toLowerCase()}</span>
                      </td>
                      <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMut.mutate(item.id);
                          }}
                          disabled={removeMut.isPending}
                          className="rounded px-2 py-1 text-xs text-muted hover:bg-bad/15 hover:text-bad transition-colors"
                          aria-label="Delete record"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted text-xs">{total} record{total !== 1 ? "s" : ""} total</p>
            <div className="flex gap-1">
              <Button
                variant="outline" size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-7 px-2.5 text-xs"
              >
                ← Prev
              </Button>
              <span className="flex items-center px-3 text-xs text-muted">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline" size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="h-7 px-2.5 text-xs"
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

