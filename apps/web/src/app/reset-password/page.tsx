"use client";

import { Button, cn } from "@my-day/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";

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

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [tokenStatus, setTokenStatus] = useState<"verifying" | "valid" | "invalid">("verifying");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const strength = getStrength(password);

  useEffect(() => {
    if (!token) { setTokenStatus("invalid"); return; }
    api.auth.verifyResetToken(token)
      .then((r) => setTokenStatus(r.valid ? "valid" : "invalid"))
      .catch(() => setTokenStatus("invalid"));
  }, [token]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setErrorMsg("Passwords do not match."); return; }
    setStatus("loading");
    setErrorMsg("");
    try {
      await api.auth.resetPassword({ token, password });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to reset password.");
    }
  };

  if (tokenStatus === "verifying") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-muted">Verifying your reset link…</p>
      </div>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <div className="space-y-4 animate-fade-in text-center">
        <div className="rounded-xl border border-bad/30 bg-bad/10 p-6">
          <div className="mb-3 text-3xl">✕</div>
          <p className="font-semibold text-fg">Link is invalid or expired</p>
          <p className="mt-1.5 text-sm text-muted">
            Password reset links are single-use and expire after 1 hour.
          </p>
        </div>
        <Link href="/forgot-password">
          <Button className="w-full h-10">Request a new link</Button>
        </Link>
        <Link href="/login" className="block text-sm text-muted hover:text-fg">
          Back to sign in
        </Link>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="space-y-4 animate-fade-in text-center">
        <div className="rounded-xl border border-good/30 bg-good/10 p-6">
          <div className="mb-3 text-3xl">✓</div>
          <p className="font-semibold text-fg">Password updated</p>
          <p className="mt-1.5 text-sm text-muted">
            Your password has been reset. All active sessions have been signed out.
          </p>
        </div>
        <Button
          className="w-full h-10"
          onClick={() => router.replace("/login")}
        >
          Continue to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {/* Password */}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">New password</span>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            className="h-10 w-full rounded-lg border border-line bg-raised/50 px-3 pr-10 text-sm text-fg placeholder:text-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <button type="button" tabIndex={-1} onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg text-xs">
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
        {password && (
          <div className="space-y-1 animate-fade-in">
            <div className="flex gap-1">
              {[1,2,3,4,5].map((s) => (
                <div key={s} className={cn("h-1 flex-1 rounded-full transition-all", strength.score >= s ? strength.color : "bg-line")} />
              ))}
            </div>
            <p className="text-xs text-muted">{strength.label}</p>
          </div>
        )}
      </label>

      {/* Confirm */}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">Confirm new password</span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          className={cn(
            "h-10 w-full rounded-lg border bg-raised/50 px-3 text-sm text-fg placeholder:text-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            confirm && confirm !== password ? "border-bad focus-visible:ring-bad" : "border-line",
          )}
        />
        {confirm && confirm !== password && (
          <span className="text-xs text-bad">Passwords do not match</span>
        )}
      </label>

      {errorMsg && (
        <p className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{errorMsg}</p>
      )}

      <Button
        type="submit"
        className="h-11 w-full"
        disabled={
          status === "loading" ||
          !password ||
          password !== confirm ||
          strength.score < 2
        }
      >
        {status === "loading" ? "Updating password…" : "Set new password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div>
          <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to sign in
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent text-xl mb-4">
            ⊛
          </div>
          <h1 className="text-2xl font-semibold text-fg">Set new password</h1>
          <p className="mt-1.5 text-sm text-muted">
            Choose a strong, unique password for your account.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

