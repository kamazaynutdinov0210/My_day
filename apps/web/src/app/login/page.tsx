"use client";

import { ApiError } from "@my-day/api-client";
import { Button, cn } from "@my-day/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api";

/* ─── Password strength ───────────────────────────────── */
function getStrength(pw: string) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Very weak", color: "bg-bad" };
  if (score === 2) return { score, label: "Weak", color: "bg-bad/70" };
  if (score === 3) return { score, label: "Fair", color: "bg-warn" };
  if (score === 4) return { score, label: "Strong", color: "bg-good/80" };
  return { score, label: "Very strong", color: "bg-good" };
}

/* ─── HelpTooltip ─────────────────────────────────────── */
function HelpTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div className="relative inline-flex">
      <button
        ref={ref}
        type="button"
        aria-label="Help"
        onClick={() => setOpen(!open)}
        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-muted/40 text-[10px] text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        ?
      </button>
      {open && (
        <div className="absolute bottom-6 left-1/2 z-50 w-56 -translate-x-1/2 rounded-lg border border-line bg-raised p-3 text-xs text-fg shadow-xl animate-fade-in tooltip-arrow">
          {text}
        </div>
      )}
    </div>
  );
}

/* ─── Google G SVG ────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/* ─── Field ───────────────────────────────────────────── */
function Field({
  label, type, value, onChange, autoComplete, error, hint, showToggle,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void;
  autoComplete?: string; error?: string; hint?: string; showToggle?: boolean;
}) {
  const [show, setShow] = useState(false);
  const inputType = showToggle ? (show ? "text" : "password") : type;
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-muted">{label}</span>
      <div className="relative">
        <input
          className={cn(
            "h-10 w-full rounded-lg border bg-raised/50 px-3 text-sm text-fg placeholder:text-muted/50",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            error ? "border-bad focus-visible:ring-bad" : "border-line hover:border-muted/60",
            showToggle && "pr-10",
          )}
          type={inputType}
          value={value}
          autoComplete={autoComplete}
          required
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(e.target.value)}
        />
        {showToggle && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-bad">{error}</span>}
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

/* ─── Main page ───────────────────────────────────────── */
type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [agreed, setAgreed] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const strength = getStrength(form.password);

  const auth = useMutation({
    mutationFn: () =>
      mode === "login"
        ? api.auth.login({ email: form.email, password: form.password })
        : api.auth.register({ name: form.name, email: form.email, password: form.password }),
    onSuccess: ({ user }) => {
      qc.setQueryData(["me"], user);
      router.replace("/");
    },
  });

  const err = auth.error instanceof ApiError ? auth.error : null;

  /* ── Google Identity Services ────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined" || !("google" in window)) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google;
    if (!g?.accounts?.id) return;
    g.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
      callback: async ({ credential }: { credential: string }) => {
        setGoogleLoading(true);
        setGoogleError(null);
        try {
          const result = await api.auth.google({ credential });
          qc.setQueryData(["me"], result.user);
          router.replace("/");
        } catch (e) {
          setGoogleError(e instanceof Error ? e.message : "Google sign-in failed.");
        } finally {
          setGoogleLoading(false);
        }
      },
    });
    if (googleBtnRef.current) {
      g.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: "100%",
      });
    }
  }, [router, qc]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "register" && form.password !== form.confirm) return;
    if (mode === "register" && !agreed) return;
    auth.mutate();
  };

  const switchMode = (m: Mode) => {
    auth.reset();
    setGoogleError(null);
    setForm({ name: "", email: "", password: "", confirm: "" });
    setMode(m);
  };

  return (
    <>
      {/* Load Google Identity Services */}
      <script src="https://accounts.google.com/gsi/client" async defer />

      <div className="flex min-h-screen bg-bg">
        {/* Left decorative panel — hidden on mobile */}
        <div className="hidden flex-col justify-between bg-surface lg:flex lg:w-[45%] border-r border-line/50 p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
              ◈
            </div>
            <span className="text-lg font-semibold tracking-tight">My Day</span>
          </div>

          <div className="space-y-6">
            <blockquote className="text-2xl font-light leading-relaxed text-muted">
              &ldquo;Your personal productivity operating system — secure by design, built for clarity.&rdquo;            </blockquote>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { icon: "⬡", label: "AES-256 Encryption" },
                { icon: "✓", label: "Task Management" },
                { icon: "⊛", label: "Password Generator" },
              ].map((f) => (
                <div key={f.label} className="rounded-xl border border-line/50 bg-raised/40 p-4 text-center">
                  <div className="mb-2 text-2xl text-accent">{f.icon}</div>
                  <p className="text-xs text-muted">{f.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted/60">
            © {new Date().getFullYear()} My Day — Personal Productivity OS
          </p>
        </div>

        {/* Right auth panel */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm space-y-8 animate-fade-in">
            {/* Title */}
            <div>
              <div className="mb-2 flex items-center gap-2 lg:hidden">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent text-sm">◈</div>
                <span className="font-semibold">My Day</span>
              </div>
              <h1 className="text-2xl font-semibold text-fg">
                {mode === "login" ? "Welcome back" : "Create an account"}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {mode === "login"
                  ? "Sign in to your personal productivity OS."
                  : "Get started with My Day — it's free."}
              </p>
            </div>

            {/* Google button */}
            <div className="space-y-3">
              {/* Rendered by Google Identity Services */}
              <div ref={googleBtnRef} className="w-full" />

              {/* Fallback button (when GIS script not loaded or no client ID) */}
              <button
                type="button"
                disabled={googleLoading}
                onClick={() => {
                  // If GIS is available, prompt will appear via renderButton
                  // Otherwise show a helpful message
                  if (!(window as unknown as { google?: { accounts?: unknown } }).google?.accounts) {
                    setGoogleError("Google sign-in is not available in this environment. Please use email.");
                  }
                }}
                className={cn(
                  "flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-line",
                  "bg-raised/50 text-sm font-medium text-fg transition-colors",
                  "hover:bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  "disabled:opacity-50",
                )}
              >
                {googleLoading ? (
                  <span className="animate-pulse">Signing in with Google…</span>
                ) : (
                  <>
                    <GoogleIcon />
                    Continue with Google
                  </>
                )}
              </button>

              {googleError && (
                <p className="text-xs text-bad">{googleError}</p>
              )}
            </div>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-line/50" />
              <span className="text-xs text-muted">or continue with email</span>
              <div className="flex-1 border-t border-line/50" />
            </div>

            {/* Email form */}
            <form onSubmit={submit} className="space-y-4" noValidate>
              {mode === "register" && (
                <Field
                  label="Full name"
                  type="text"
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  autoComplete="name"
                  error={err?.fieldError("name")}
                />
              )}

              <Field
                label="Email address"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                autoComplete="email"
                error={err?.fieldError("email")}
              />

              <div className="space-y-1.5">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-muted">Password</span>
                  <HelpTooltip text="Use a strong, unique password with uppercase letters, numbers, and symbols for best security." />
                </div>
                <div className="relative">
                  <Field
                    label=""
                    type="password"
                    value={form.password}
                    onChange={(v) => setForm({ ...form, password: v })}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    error={err?.fieldError("password")}
                    showToggle
                  />
                </div>
                {/* Strength bar (register only) */}
                {mode === "register" && form.password && (
                  <div className="space-y-1 animate-fade-in">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div
                          key={s}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-all",
                            strength.score >= s ? strength.color : "bg-line",
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted">{strength.label}</p>
                  </div>
                )}
              </div>

              {mode === "register" && (
                <Field
                  label="Confirm password"
                  type="password"
                  value={form.confirm}
                  onChange={(v) => setForm({ ...form, confirm: v })}
                  autoComplete="new-password"
                  error={
                    form.confirm && form.confirm !== form.password
                      ? "Passwords do not match"
                      : undefined
                  }
                  showToggle
                />
              )}

              {/* Global error */}
              {err && !err.details.length && (
                <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">
                  {err.message}
                </p>
              )}

              {/* Forgot password (login) */}
              {mode === "login" && (
                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted hover:text-accent transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              {/* Terms (register) */}
              {mode === "register" && (
                <label className="flex items-start gap-2.5 text-xs text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-line accent-accent"
                    required
                  />
                  <span>
                    I agree to the{" "}
                    <span className="text-accent hover:underline cursor-pointer">Terms of Service</span>
                    {" "}and{" "}
                    <span className="text-accent hover:underline cursor-pointer">Privacy Policy</span>
                  </span>
                </label>
              )}

              <Button
                type="submit"
                className="h-11 w-full"
                disabled={
                  auth.isPending ||
                  (mode === "register" && (!agreed || (Boolean(form.confirm) && form.confirm !== form.password)))
                }
              >
                {auth.isPending
                  ? "Please wait…"
                  : mode === "login"
                  ? "Sign in"
                  : "Create account"}
              </Button>
            </form>

            {/* Switch mode */}
            <p className="text-center text-sm text-muted">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="font-medium text-accent hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-medium text-accent hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
