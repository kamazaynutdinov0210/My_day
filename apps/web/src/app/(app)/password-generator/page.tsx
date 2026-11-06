"use client";

import { type PasswordGenerateOptions, type PasswordStrengthResult, type PasswordType } from "@my-day/types";
import { Button, cn } from "@my-day/ui";
import { useState, useCallback } from "react";

/* ─── Client-side cryptographically secure password generation ─── */
const CHARSET = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}|;:,.<>?",
  ambiguous: "O0Il1",
};

const WORD_LIST = [
  "apple","brave","cloud","delta","eagle","flame","globe","hover","ivory","joker",
  "karma","lunar","maple","noble","ocean","pearl","quest","radar","solar","tiger",
  "ultra","vivid","water","xenon","yacht","zebra","amber","blade","coral","dusk",
  "ember","frost","grace","hedge","inner","jewel","knack","lemon","mystic","north",
  "ozone","pixel","quartz","river","stone","torch","unity","venom","wheel","axiom",
];

function secureRandInt(max: number): number {
  const array = new Uint32Array(1);
  let result: number;
  do {
    crypto.getRandomValues(array);
    result = array[0]!;
  } while (result >= Math.floor(0xffffffff / max) * max);
  return result % max;
}

function generatePassword(opts: PasswordGenerateOptions): string {
  const { type, length = 16, includeUppercase = true, includeLowercase = true,
    includeNumbers = true, includeSymbols = false, excludeAmbiguous = false,
    customCharset, wordCount = 4, wordSeparator = "-", capitalizeWords = true } = opts;

  if (type === "PASSPHRASE") {
    const words = Array.from({ length: wordCount }, () => {
      const w = WORD_LIST[secureRandInt(WORD_LIST.length)]!;
      return capitalizeWords ? w.charAt(0).toUpperCase() + w.slice(1) : w;
    });
    return words.join(wordSeparator);
  }

  if (type === "NUMERIC_PIN") {
    return Array.from({ length }, () => secureRandInt(10).toString()).join("");
  }

  let charset = customCharset ?? "";
  if (!customCharset) {
    if (type === "ALPHANUMERIC") { charset = CHARSET.upper + CHARSET.lower + CHARSET.numbers; }
    else if (type === "SPECIAL_CHARS") { charset = CHARSET.upper + CHARSET.lower + CHARSET.numbers + CHARSET.symbols; }
    else {
      if (includeUppercase) charset += CHARSET.upper;
      if (includeLowercase) charset += CHARSET.lower;
      if (includeNumbers) charset += CHARSET.numbers;
      if (includeSymbols) charset += CHARSET.symbols;
    }
  }

  if (excludeAmbiguous) charset = charset.split("").filter((c) => !CHARSET.ambiguous.includes(c)).join("");
  if (!charset) charset = CHARSET.lower + CHARSET.numbers;

  let result = "";
  const targetLen = type === "HIGH_ENTROPY" ? Math.max(length, 24) : length;
  for (let i = 0; i < targetLen; i++) {
    result += charset[secureRandInt(charset.length)];
  }
  return result;
}

function assessStrength(password: string): PasswordStrengthResult {
  if (!password) return {
    score: 0, label: "VERY_WEAK", entropyBits: 0, crackTimeDisplay: "instant",
    feedback: ["Password is empty"], recommendations: ["Enter a password"],
    checks: { hasMinLength: false, hasUppercase: false, hasLowercase: false, hasNumbers: false, hasSymbols: false, noRepeatedChars: false },
  };

  const checks = {
    hasMinLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSymbols: /[^A-Za-z0-9]/.test(password),
    noRepeatedChars: !/(.)\1{2,}/.test(password),
  };

  // Estimate charset size for entropy
  let charsetSize = 0;
  if (checks.hasLowercase) charsetSize += 26;
  if (checks.hasUppercase) charsetSize += 26;
  if (checks.hasNumbers) charsetSize += 10;
  if (checks.hasSymbols) charsetSize += 32;
  const entropyBits = charsetSize > 0 ? Math.log2(charsetSize) * password.length : 0;

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (checks.hasUppercase && checks.hasLowercase) score++;
  if (checks.hasNumbers) score++;
  if (checks.hasSymbols && checks.noRepeatedChars) score++;

  const labels: PasswordStrengthResult["label"][] = ["VERY_WEAK","WEAK","FAIR","STRONG","VERY_STRONG"];
  const crackTimes = ["instant", "seconds", "minutes to hours", "years", "centuries"];
  const label = labels[Math.min(score, 4)]!;

  const feedback: string[] = [];
  if (!checks.hasMinLength) feedback.push("Use at least 12 characters");
  if (!checks.hasUppercase) feedback.push("Add uppercase letters");
  if (!checks.hasLowercase) feedback.push("Add lowercase letters");
  if (!checks.hasNumbers) feedback.push("Add numbers");
  if (!checks.hasSymbols) feedback.push("Add special characters");
  if (!checks.noRepeatedChars) feedback.push("Avoid repeating characters");

  return {
    score, label, entropyBits: Math.round(entropyBits), crackTimeDisplay: crackTimes[Math.min(score, 4)]!,
    feedback, recommendations: score >= 4 ? ["Great password!"] : feedback,
    checks,
  };
}

/* ─── Type definitions ───────────────────────────────── */
const PASSWORD_TYPES: { id: PasswordType; label: string; desc: string; icon: string }[] = [
  { id: "RANDOM_STRONG", label: "Strong Random", desc: "Mixed chars, high entropy", icon: "⊛" },
  { id: "PASSPHRASE",    label: "Passphrase",    desc: "Memorable word combination", icon: "✎" },
  { id: "ALPHANUMERIC",  label: "Alphanumeric",  desc: "Letters and numbers only", icon: "Aa" },
  { id: "SPECIAL_CHARS", label: "Special Chars", desc: "Includes symbols", icon: "#!" },
  { id: "NUMERIC_PIN",   label: "Numeric PIN",   desc: "Digits only", icon: "0-9" },
  { id: "HIGH_ENTROPY",  label: "High Entropy",  desc: "Maximum security (24+ chars)", icon: "🔒" },
  { id: "CUSTOM_FORMAT", label: "Custom",        desc: "Build your own charset", icon: "⚙" },
];

const SCORE_COLOR = ["bg-bad", "bg-bad/70", "bg-warn", "bg-good/80", "bg-good"];
const SCORE_LABEL = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];

/* ─── Tooltip ───────────────────────────────────────── */
function HelpIcon({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex"
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      <button type="button"
        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-muted/40 text-[10px] text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none"
        aria-label="Help">?</button>
      {open && (
        <div className="absolute bottom-6 left-1/2 z-50 w-56 -translate-x-1/2 rounded-lg border border-line bg-raised p-3 text-xs text-fg shadow-xl animate-fade-in leading-relaxed">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-raised" />
        </div>
      )}
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────── */
export default function PasswordGeneratorPage() {
  const [pwType, setPwType] = useState<PasswordType>("RANDOM_STRONG");
  const [opts, setOpts] = useState<Omit<PasswordGenerateOptions, "type">>({
    length: 16, includeUppercase: true, includeLowercase: true,
    includeNumbers: true, includeSymbols: false, excludeAmbiguous: false,
    wordCount: 4, wordSeparator: "-", capitalizeWords: true, customCharset: "",
  });
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [generated, setGenerated] = useState<string[]>([]);

  const generate = useCallback(() => {
    const count = 5;
    const newPws = Array.from({ length: count }, () =>
      generatePassword({ type: pwType, ...opts })
    );
    setPasswords(newPws);
    setGenerated((prev) => [...newPws, ...prev].slice(0, 50));
  }, [pwType, opts]);

  const copyPw = async (pw: string, idx: number) => {
    await navigator.clipboard.writeText(pw);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const selectedPw = passwords[0] ?? "";
  const strength = assessStrength(selectedPw);

  const toggle = (key: keyof typeof opts) =>
    setOpts({ ...opts, [key]: !opts[key as keyof typeof opts] });

  const isPassphrase = pwType === "PASSPHRASE";
  const isPin = pwType === "NUMERIC_PIN";
  const isCustom = pwType === "CUSTOM_FORMAT";

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-fg flex items-center gap-2">
          <span className="text-accent">⊛</span> Password Generator
        </h1>
        <p className="mt-1 text-sm text-muted">
          Cryptographically secure password generation using the Web Crypto API.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Type selector */}
          <div className="rounded-xl border border-line/50 bg-surface p-4 space-y-3">
            <div className="flex items-center gap-1">
              <h2 className="text-sm font-semibold">Password Type</h2>
              <HelpIcon text="Choose what kind of password to generate. Use passphrases for memorability or high-entropy for maximum security." />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {PASSWORD_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPwType(t.id)}
                  className={cn(
                    "flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors",
                    pwType === t.id
                      ? "border-accent bg-accent/10 text-fg"
                      : "border-line bg-raised/40 text-muted hover:border-muted/60 hover:text-fg",
                  )}
                >
                  <span className="text-base leading-tight">{t.icon}</span>
                  <span className="font-medium">{t.label}</span>
                  <span className="opacity-70">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="rounded-xl border border-line/50 bg-surface p-4 space-y-4">
            <h2 className="text-sm font-semibold">Options</h2>

            {/* Length / word count */}
            {!isPin && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-muted">
                    {isPassphrase ? "Word count" : "Length"}
                  </label>
                  <span className="text-sm font-mono text-fg tabular-nums">
                    {isPassphrase ? opts.wordCount : opts.length}
                  </span>
                </div>
                <input
                  type="range"
                  min={isPassphrase ? 3 : 8}
                  max={isPassphrase ? 10 : 64}
                  value={isPassphrase ? opts.wordCount : opts.length}
                  onChange={(e) =>
                    isPassphrase
                      ? setOpts({ ...opts, wordCount: Number(e.target.value) })
                      : setOpts({ ...opts, length: Number(e.target.value) })
                  }
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[10px] text-muted/60 mt-0.5">
                  <span>{isPassphrase ? "3" : "8"}</span>
                  <span>{isPassphrase ? "10 words" : "64 chars"}</span>
                </div>
              </div>
            )}

            {isPin && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-muted">PIN length</label>
                  <span className="text-sm font-mono text-fg">{opts.length}</span>
                </div>
                <input type="range" min={4} max={12} value={opts.length}
                  onChange={(e) => setOpts({ ...opts, length: Number(e.target.value) })}
                  className="w-full accent-accent" />
              </div>
            )}

            {/* Toggles (not for passphrase / pin) */}
            {!isPassphrase && !isPin && !isCustom && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "includeUppercase" as const, label: "Uppercase (A-Z)", help: "ABC" },
                  { key: "includeLowercase" as const, label: "Lowercase (a-z)", help: "abc" },
                  { key: "includeNumbers" as const, label: "Numbers (0-9)", help: "123" },
                  { key: "includeSymbols" as const, label: "Symbols (!@#)", help: "!@#" },
                  { key: "excludeAmbiguous" as const, label: "Exclude ambiguous (O,0,I,l)", help: "No 0O1Il" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(opts[key])}
                      onChange={() => toggle(key)}
                      className="h-3.5 w-3.5 rounded accent-accent"
                    />
                    <span className="text-muted hover:text-fg transition-colors text-xs">{label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Passphrase options */}
            {isPassphrase && (
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-muted text-xs">Separator</span>
                  <input type="text" value={opts.wordSeparator} maxLength={3}
                    onChange={(e) => setOpts({ ...opts, wordSeparator: e.target.value })}
                    className="h-8 rounded-lg border border-line bg-raised/40 px-2 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer self-end pb-1">
                  <input type="checkbox" checked={opts.capitalizeWords}
                    onChange={() => toggle("capitalizeWords")} className="h-3.5 w-3.5 accent-accent" />
                  <span className="text-muted text-xs">Capitalize words</span>
                </label>
              </div>
            )}

            {/* Custom charset */}
            {isCustom && (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-muted flex items-center gap-1">
                  Custom character set
                  <HelpIcon text="Enter only the characters you want to use. The generator picks randomly from this set using cryptographically secure randomness." />
                </span>
                <input type="text" value={opts.customCharset ?? ""}
                  onChange={(e) => setOpts({ ...opts, customCharset: e.target.value })}
                  placeholder="e.g. ABCDEFGabcdefg0123456789"
                  className="h-9 rounded-lg border border-line bg-raised/40 px-3 text-sm text-fg font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
              </label>
            )}

            <Button onClick={generate} className="h-10 w-full">
              Generate Passwords
            </Button>
          </div>

          {/* Results */}
          {passwords.length > 0 && (
            <div className="rounded-xl border border-line/50 bg-surface p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Generated Passwords</h2>
                <button type="button" onClick={generate}
                  className="text-xs text-accent hover:underline">Regenerate</button>
              </div>
              <div className="space-y-2">
                {passwords.map((pw, i) => (
                  <div key={i}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                      i === 0 ? "border-accent/30 bg-accent/5" : "border-line/50 bg-raised/30",
                    )}>
                    <code className="flex-1 font-mono text-sm text-fg break-all">{pw}</code>
                    <button type="button" onClick={() => copyPw(pw, i)}
                      className="shrink-0 rounded px-2 py-1 text-xs text-muted hover:bg-raised hover:text-fg transition-colors">
                      {copied === i ? "✓" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Strength meter */}
          {selectedPw && (
            <div className="rounded-xl border border-line/50 bg-surface p-4 space-y-3 animate-fade-in">
              <div className="flex items-center gap-1">
                <h2 className="text-sm font-semibold">Strength Analysis</h2>
                <HelpIcon text="Entropy bits measure how unpredictable the password is. Higher entropy = harder to brute-force." />
              </div>
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[0,1,2,3,4].map((s) => (
                    <div key={s} className={cn("h-2 flex-1 rounded-full transition-all",
                      s <= strength.score ? SCORE_COLOR[strength.score] : "bg-line")} />
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={cn("font-medium", strength.score >= 3 ? "text-good" : strength.score >= 2 ? "text-warn" : "text-bad")}>
                    {SCORE_LABEL[strength.score]}
                  </span>
                  <span className="text-muted">{strength.entropyBits} bits entropy</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted">Checks</p>
                {Object.entries(strength.checks).map(([key, ok]) => {
                  const labels: Record<string, string> = {
                    hasMinLength: "12+ characters",
                    hasUppercase: "Uppercase letters",
                    hasLowercase: "Lowercase letters",
                    hasNumbers: "Numbers",
                    hasSymbols: "Special characters",
                    noRepeatedChars: "No repeated chars",
                  };
                  return (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      <span className={ok ? "text-good" : "text-muted/40"}>
                        {ok ? "✓" : "○"}
                      </span>
                      <span className={ok ? "text-fg/80" : "text-muted/40"}>{labels[key]}</span>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-lg bg-raised/40 p-2.5 text-xs">
                <span className="text-muted">Crack time estimate: </span>
                <span className="text-fg font-medium">{strength.crackTimeDisplay}</span>
              </div>
            </div>
          )}

          {/* Security tips */}
          <div className="rounded-xl border border-line/50 bg-surface p-4 space-y-2.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Best Practices</p>
            <ul className="space-y-2 text-xs text-muted">
              <li className="flex gap-2"><span className="text-good shrink-0">✓</span> Use a unique password for every account</li>
              <li className="flex gap-2"><span className="text-good shrink-0">✓</span> Store passwords in a password manager</li>
              <li className="flex gap-2"><span className="text-good shrink-0">✓</span> Enable 2FA on all important accounts</li>
              <li className="flex gap-2"><span className="text-bad shrink-0">✕</span> Never reuse passwords across sites</li>
              <li className="flex gap-2"><span className="text-bad shrink-0">✕</span> Never share passwords via email or chat</li>
            </ul>
          </div>

          {/* History */}
          {generated.length > 0 && (
            <div className="rounded-xl border border-line/50 bg-surface p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">Session History</p>
                <button type="button" onClick={() => setShowHistory(!showHistory)}
                  className="text-xs text-muted hover:text-fg transition-colors">
                  {showHistory ? "Hide" : `Show (${generated.length})`}
                </button>
              </div>
              {showHistory && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {generated.map((pw, i) => (
                    <div key={i} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-raised/50 group">
                      <code className="flex-1 truncate font-mono text-xs text-fg/70">{pw}</code>
                      <button type="button" onClick={() => copyPw(pw, 1000 + i)}
                        className="hidden group-hover:block text-[10px] text-muted hover:text-fg">
                        {copied === 1000 + i ? "✓" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-muted/50">Session history is cleared when you leave this page.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

