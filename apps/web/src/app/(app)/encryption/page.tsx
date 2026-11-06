"use client";

import { type EncryptionAlgorithmInfo } from "@my-day/types";
import { Button, cn } from "@my-day/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { api } from "@/lib/api";

/* ─── Tooltip ────────────────────────────────────────── */
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <div className="absolute bottom-7 left-1/2 z-50 w-64 -translate-x-1/2 rounded-lg border border-line bg-raised p-3 text-xs text-fg shadow-xl animate-fade-in leading-relaxed">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-raised" />
        </div>
      )}
    </div>
  );
}

function HelpIcon({ text }: { text: string }) {
  return (
    <Tooltip text={text}>
      <button
        type="button"
        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-muted/40 text-[10px] text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none"
        aria-label="More information"
      >
        ?
      </button>
    </Tooltip>
  );
}

/* ─── Algorithm selector ─────────────────────────────── */
const CATEGORY_LABELS: Record<string, string> = {
  SYMMETRIC: "Symmetric Encryption",
  ASYMMETRIC: "Asymmetric Encryption",
  HASHING: "Hashing",
  KEY_DERIVATION: "Key Derivation",
};

const RATING_BADGE: Record<string, string> = {
  RECOMMENDED: "badge badge-green",
  ACCEPTABLE: "badge badge-blue",
  DEPRECATED: "badge badge-amber",
  INSECURE: "badge badge-red",
};

function AlgorithmSelector({
  algorithms, selected, onChange,
}: {
  algorithms: EncryptionAlgorithmInfo[];
  selected: string;
  onChange: (id: string) => void;
}) {
  const groups = algorithms.reduce<Record<string, EncryptionAlgorithmInfo[]>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([cat, algs]) => (
        <div key={cat}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted/60">
            {CATEGORY_LABELS[cat] ?? cat}
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {algs.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onChange(a.id)}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors",
                  selected === a.id
                    ? "border-accent bg-accent/10 text-fg"
                    : "border-line bg-raised/40 text-muted hover:border-muted/60 hover:text-fg",
                  a.deprecated && "opacity-60",
                )}
              >
                <span className="font-medium leading-tight">{a.name}</span>
                <span className={RATING_BADGE[a.securityCharacteristics.rating]}>
                  {a.securityCharacteristics.rating.toLowerCase()}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Algo info panel ────────────────────────────────── */
function AlgoInfo({ algo }: { algo: EncryptionAlgorithmInfo }) {
  return (
    <div className={cn(
      "rounded-xl border p-4 text-sm space-y-3 animate-fade-in",
      algo.deprecated ? "border-warn/30 bg-warn/5" : "border-line bg-raised/30",
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-fg">{algo.name}</p>
          <p className="text-xs text-muted mt-0.5">{algo.purpose}</p>
        </div>
        <span className={RATING_BADGE[algo.securityCharacteristics.rating]}>
          {algo.securityCharacteristics.rating.toLowerCase()}
        </span>
      </div>
      {algo.deprecated && (
        <div className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
          ⚠ {algo.deprecationReason ?? "This algorithm is deprecated. Do not use for new applications."}
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {algo.securityCharacteristics.keySize && (
          <div><span className="text-muted">Key size: </span><span className="text-fg">{algo.securityCharacteristics.keySize}</span></div>
        )}
        {algo.securityCharacteristics.authTag !== undefined && (
          <div><span className="text-muted">Auth tag: </span><span className="text-fg">{algo.securityCharacteristics.authTag ? "Yes" : "No"}</span></div>
        )}
      </div>
      {algo.recommendedUseCases.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted mb-1">Recommended for</p>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-fg/80">
            {algo.recommendedUseCases.map((u) => <li key={u}>{u}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── CopyButton ─────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md px-2.5 py-1 text-xs text-muted hover:bg-raised hover:text-fg transition-colors"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

/* ─── Output box ─────────────────────────────────────── */
function OutputBox({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <CopyButton text={value} />
      </div>
      <pre className="max-h-32 overflow-auto rounded-lg border border-line bg-raised/40 p-3 text-xs text-fg/90 whitespace-pre-wrap break-all">
        {value}
      </pre>
    </div>
  );
}

/* ─── Tabs ───────────────────────────────────────────── */
type Tab = "encrypt" | "decrypt" | "hash" | "keygen";

const TABS: { id: Tab; label: string; help: string }[] = [
  { id: "encrypt", label: "Encrypt", help: "Transform plaintext into ciphertext using a secret key. Only someone with the key can decrypt it." },
  { id: "decrypt", label: "Decrypt", help: "Reverse encryption to recover the original plaintext using the same key (symmetric) or private key (asymmetric)." },
  { id: "hash", label: "Hash", help: "Produce a fixed-length digest from input data. Hashing is one-way — it cannot be reversed to recover the original data." },
  { id: "keygen", label: "Key Generation", help: "Generate a public/private key pair for asymmetric encryption algorithms such as RSA-OAEP or ECC." },
];

/* ─── Main page ───────────────────────────────────────── */
export default function EncryptionPage() {
  const [tab, setTab] = useState<Tab>("encrypt");
  const [algo, setAlgo] = useState("AES-256-GCM");

  // Encrypt state
  const [plaintext, setPlaintext] = useState("");
  const [encKey, setEncKey] = useState("");
  const [aad, setAad] = useState("");

  // Decrypt state
  const [ciphertext, setCiphertext] = useState("");
  const [decKey, setDecKey] = useState("");
  const [iv, setIv] = useState("");
  const [tag, setTag] = useState("");

  // Hash state
  const [hashData, setHashData] = useState("");
  const [hashSalt, setHashSalt] = useState("");

  // Keygen state
  const [keyAlgo, setKeyAlgo] = useState<"RSA-OAEP" | "ECC">("RSA-OAEP");
  const [keySize, setKeySize] = useState<2048 | 4096>(2048);

  const algorithms = useQuery({ queryKey: ["crypto-algorithms"], queryFn: api.crypto.algorithms });

  const selectedAlgo = algorithms.data?.find((a) => a.id === algo);
  const isAsymmetric = selectedAlgo?.category === "ASYMMETRIC";

  const encryptMut = useMutation({
    mutationFn: () => api.crypto.encrypt({
      algorithm: algo, plaintext, key: encKey || undefined, additionalData: aad || undefined,
    }),
  });

  const decryptMut = useMutation({
    mutationFn: () => api.crypto.decrypt({
      algorithm: algo, ciphertext, key: decKey || undefined, iv: iv || undefined, tag: tag || undefined,
    }),
  });

  const hashMut = useMutation({
    mutationFn: () => api.crypto.hash({ algorithm: algo, data: hashData, salt: hashSalt || undefined }),
  });

  const keygenMut = useMutation({
    mutationFn: () => api.crypto.generateKeyPair({ algorithm: keyAlgo, keySize }),
  });

  const symmetricAlgos = algorithms.data?.filter(a =>
    a.category === "SYMMETRIC" || a.category === "ASYMMETRIC"
  ) ?? [];
  const hashAlgos = algorithms.data?.filter(a =>
    a.category === "HASHING" || a.category === "KEY_DERIVATION"
  ) ?? [];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-fg flex items-center gap-2">
          <span className="text-accent">⬡</span> Encryption Studio
        </h1>
        <p className="mt-1 text-sm text-muted">
          Encrypt, decrypt, hash, and generate cryptographic keys using industry-standard algorithms.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-raised/40 p-1 border border-line/50 w-fit">
        {TABS.map((t) => (
          <div key={t.id} className="flex items-center">
            <button
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                tab === t.id ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
              )}
            >
              {t.label}
              <HelpIcon text={t.help} />
            </button>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main panel */}
        <div className="space-y-5">
          {/* Algorithm selector */}
          {tab !== "keygen" && (
            <div className="rounded-xl border border-line/50 bg-surface p-4 space-y-3">
              <div className="flex items-center gap-1">
                <h2 className="text-sm font-semibold">Select Algorithm</h2>
                <HelpIcon text="Choose the cryptographic algorithm for your operation. Recommended algorithms are shown with a green badge." />
              </div>
              {algorithms.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  Loading algorithms…
                </div>
              )}
              {algorithms.data && (
                <AlgorithmSelector
                  algorithms={
                    (tab === "hash") ? hashAlgos : symmetricAlgos
                  }
                  selected={algo}
                  onChange={setAlgo}
                />
              )}
            </div>
          )}

          {/* Operation panel */}
          <div className="rounded-xl border border-line/50 bg-surface p-4 space-y-4">
            {/* ── ENCRYPT ── */}
            {tab === "encrypt" && (
              <>
                <h2 className="text-sm font-semibold">Encrypt Data</h2>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-muted flex items-center gap-1">
                    Plaintext
                    <HelpIcon text="The original data you want to protect. It will be encrypted and unreadable without the key." />
                  </span>
                  <textarea
                    value={plaintext}
                    onChange={(e) => setPlaintext(e.target.value)}
                    rows={4}
                    placeholder="Enter text to encrypt…"
                    className="w-full rounded-lg border border-line bg-raised/40 px-3 py-2 text-sm text-fg placeholder:text-muted/50 resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </label>
                {!isAsymmetric && (
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted flex items-center gap-1">
                      Encryption key
                      <HelpIcon text="Leave blank to auto-generate a secure key. Keep this key safe — without it, you cannot decrypt your data." />
                    </span>
                    <input
                      type="text"
                      value={encKey}
                      onChange={(e) => setEncKey(e.target.value)}
                      placeholder="Leave blank to auto-generate"
                      className="h-9 rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                  </label>
                )}
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-muted flex items-center gap-1">
                    Additional authenticated data (optional)
                    <HelpIcon text="AAD is included in the authentication tag but not encrypted. Useful for binding ciphertext to context (e.g. user ID)." />
                  </span>
                  <input
                    type="text"
                    value={aad}
                    onChange={(e) => setAad(e.target.value)}
                    placeholder="Optional context data…"
                    className="h-9 rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </label>
                <Button
                  onClick={() => encryptMut.mutate()}
                  disabled={!plaintext || encryptMut.isPending}
                  className="h-9"
                >
                  {encryptMut.isPending ? "Encrypting…" : "Encrypt →"}
                </Button>
                {encryptMut.isError && (
                  <p className="text-sm text-bad">{String(encryptMut.error)}</p>
                )}
                {encryptMut.data && (
                  <div className="space-y-3 animate-fade-in border-t border-line/50 pt-4">
                    <OutputBox label="Ciphertext" value={encryptMut.data.ciphertext} />
                    {encryptMut.data.key && <OutputBox label="Key (save this!)" value={encryptMut.data.key} />}
                    {encryptMut.data.iv && <OutputBox label="IV / Nonce" value={encryptMut.data.iv} />}
                    {encryptMut.data.tag && <OutputBox label="Auth Tag" value={encryptMut.data.tag} />}
                    <p className="text-xs text-muted">
                      ⏱ {encryptMut.data.durationMs.toFixed(2)} ms · Algorithm: {encryptMut.data.algorithm}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ── DECRYPT ── */}
            {tab === "decrypt" && (
              <>
                <h2 className="text-sm font-semibold">Decrypt Data</h2>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-muted">Ciphertext</span>
                  <textarea
                    value={ciphertext}
                    onChange={(e) => setCiphertext(e.target.value)}
                    rows={3}
                    placeholder="Paste ciphertext here…"
                    className="w-full rounded-lg border border-line bg-raised/40 px-3 py-2 text-sm text-fg placeholder:text-muted/50 resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted">Key</span>
                    <input type="text" value={decKey} onChange={(e) => setDecKey(e.target.value)}
                      placeholder="Decryption key…"
                      className="h-9 rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted">IV / Nonce</span>
                    <input type="text" value={iv} onChange={(e) => setIv(e.target.value)}
                      placeholder="IV from encryption…"
                      className="h-9 rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
                  </label>
                </div>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-muted flex items-center gap-1">Auth Tag
                    <HelpIcon text="The GCM/Poly1305 authentication tag ensures the ciphertext was not tampered with." />
                  </span>
                  <input type="text" value={tag} onChange={(e) => setTag(e.target.value)}
                    placeholder="Auth tag (for GCM/Poly1305)…"
                    className="h-9 rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
                </label>
                <Button
                  onClick={() => decryptMut.mutate()}
                  disabled={!ciphertext || decryptMut.isPending}
                  className="h-9"
                >
                  {decryptMut.isPending ? "Decrypting…" : "Decrypt →"}
                </Button>
                {decryptMut.isError && <p className="text-sm text-bad">{String(decryptMut.error)}</p>}
                {decryptMut.data && (
                  <div className="space-y-3 animate-fade-in border-t border-line/50 pt-4">
                    <OutputBox label="Plaintext" value={decryptMut.data.plaintext} />
                    <p className="text-xs text-muted">
                      {decryptMut.data.verified ? "✓ Authentication verified" : "⚠ Authentication not verified"}
                      {" · "}{decryptMut.data.durationMs.toFixed(2)} ms
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ── HASH ── */}
            {tab === "hash" && (
              <>
                <div className="flex items-center gap-1">
                  <h2 className="text-sm font-semibold">Hash Data</h2>
                  <HelpIcon text="Hashing is a one-way operation — it cannot be reversed. Use it to verify data integrity or store passwords securely." />
                </div>
                <div className="rounded-lg border border-warn/30 bg-warn/8 px-3 py-2 text-xs text-warn">
                  ⚠ Hashing is irreversible. Never use it as a substitute for encryption if you need to recover the original data.
                </div>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-muted">Input data</span>
                  <textarea
                    value={hashData}
                    onChange={(e) => setHashData(e.target.value)}
                    rows={3}
                    placeholder="Text to hash…"
                    className="w-full rounded-lg border border-line bg-raised/40 px-3 py-2 text-sm text-fg placeholder:text-muted/50 resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-muted flex items-center gap-1">Salt (optional)
                    <HelpIcon text="A random value added before hashing to prevent rainbow-table attacks. Required for password hashing algorithms (Argon2id, PBKDF2)." />
                  </span>
                  <input type="text" value={hashSalt} onChange={(e) => setHashSalt(e.target.value)}
                    placeholder="Custom salt or leave blank for auto…"
                    className="h-9 rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
                </label>
                <Button
                  onClick={() => hashMut.mutate()}
                  disabled={!hashData || hashMut.isPending}
                  className="h-9"
                >
                  {hashMut.isPending ? "Hashing…" : "Hash →"}
                </Button>
                {hashMut.isError && <p className="text-sm text-bad">{String(hashMut.error)}</p>}
                {hashMut.data && (
                  <div className="space-y-3 animate-fade-in border-t border-line/50 pt-4">
                    <OutputBox label="Digest" value={hashMut.data.digest} />
                    {hashMut.data.salt && <OutputBox label="Salt used" value={hashMut.data.salt} />}
                    <p className="text-xs text-muted">⏱ {hashMut.data.durationMs.toFixed(2)} ms · {hashMut.data.algorithm}</p>
                  </div>
                )}
              </>
            )}

            {/* ── KEYGEN ── */}
            {tab === "keygen" && (
              <>
                <div className="flex items-center gap-1">
                  <h2 className="text-sm font-semibold">Generate Key Pair</h2>
                  <HelpIcon text="Generate a public/private key pair for asymmetric cryptography. Keep the private key secret — only share the public key." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted">Algorithm</span>
                    <select
                      value={keyAlgo}
                      onChange={(e) => setKeyAlgo(e.target.value as "RSA-OAEP" | "ECC")}
                      className="h-9 rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <option value="RSA-OAEP">RSA-OAEP</option>
                      <option value="ECC">ECC (ECDH)</option>
                    </select>
                  </label>
                  {keyAlgo === "RSA-OAEP" && (
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="text-muted flex items-center gap-1">Key size
                        <HelpIcon text="4096-bit keys offer higher security but slower performance. 2048-bit is adequate for most use cases." />
                      </span>
                      <select
                        value={keySize}
                        onChange={(e) => setKeySize(Number(e.target.value) as 2048 | 4096)}
                        className="h-9 rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <option value={2048}>2048-bit</option>
                        <option value={4096}>4096-bit</option>
                      </select>
                    </label>
                  )}
                </div>
                <div className="rounded-lg border border-bad/20 bg-bad/5 px-3 py-2 text-xs text-muted">
                  🔒 Private keys are shown once and not stored. Save them immediately in a secure location.
                </div>
                <Button
                  onClick={() => keygenMut.mutate()}
                  disabled={keygenMut.isPending}
                  className="h-9"
                >
                  {keygenMut.isPending ? "Generating…" : "Generate Key Pair →"}
                </Button>
                {keygenMut.isError && <p className="text-sm text-bad">{String(keygenMut.error)}</p>}
                {keygenMut.data && (
                  <div className="space-y-3 animate-fade-in border-t border-line/50 pt-4">
                    <OutputBox label="Public Key" value={keygenMut.data.publicKey} />
                    <OutputBox label="Private Key (keep secret!)" value={keygenMut.data.privateKey} />
                    <p className="text-xs text-muted">Algorithm: {keygenMut.data.algorithm}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right panel: algo info */}
        <div className="space-y-4">
          {selectedAlgo && tab !== "keygen" && <AlgoInfo algo={selectedAlgo} />}

          {/* Security tips */}
          <div className="rounded-xl border border-line/50 bg-surface p-4 space-y-2.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Security Tips</p>
            <ul className="space-y-2 text-xs text-muted">
              <li className="flex gap-2"><span className="text-good shrink-0">✓</span> Use AES-256-GCM or ChaCha20-Poly1305 for symmetric encryption</li>
              <li className="flex gap-2"><span className="text-good shrink-0">✓</span> Use Argon2id for password hashing</li>
              <li className="flex gap-2"><span className="text-good shrink-0">✓</span> Never reuse IVs with the same key</li>
              <li className="flex gap-2"><span className="text-bad shrink-0">✕</span> Do not use MD5 or SHA-1 for security-sensitive operations</li>
              <li className="flex gap-2"><span className="text-bad shrink-0">✕</span> Never store private keys in unencrypted form</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

