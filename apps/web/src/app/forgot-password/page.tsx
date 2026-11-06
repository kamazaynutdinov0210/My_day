"use client";

import { Button } from "@my-day/ui";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      await api.auth.forgotPassword({ email });
      setStatus("done");
    } catch (err) {
      // Always show success to prevent account enumeration
      setStatus("done");
      void err;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to sign in
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent text-xl mb-4">
            ✉
          </div>
          <h1 className="text-2xl font-semibold text-fg">Reset your password</h1>
          <p className="mt-1.5 text-sm text-muted">
            Enter your email address and we&apos;ll send you a secure reset link.
          </p>
        </div>

        {status === "done" ? (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-good/30 bg-good/10 p-5 text-center">
              <div className="mb-3 text-3xl">✓</div>
              <p className="font-medium text-fg">Check your email</p>
              <p className="mt-1 text-sm text-muted">
                If an account exists for{" "}
                <span className="font-medium text-fg">{email}</span>, we&apos;ve sent
                a password reset link. It expires in 1 hour.
              </p>
            </div>
            <div className="rounded-lg bg-raised/50 p-4 text-xs text-muted space-y-1">
              <p className="font-medium text-fg text-sm">Didn&apos;t receive the email?</p>
              <ul className="list-inside list-disc space-y-0.5">
                <li>Check your spam or junk folder</li>
                <li>Make sure the email address is correct</li>
                <li>Wait a few minutes before trying again</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => { setStatus("idle"); setEmail(""); }}
              className="w-full text-center text-sm text-accent hover:underline"
            >
              Try a different email
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-muted">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="h-10 w-full rounded-lg border border-line bg-raised/50 px-3 text-sm text-fg placeholder:text-muted/50 transition-colors hover:border-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>

            {errorMsg && (
              <p className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{errorMsg}</p>
            )}

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={status === "loading" || !email}
            >
              {status === "loading" ? "Sending…" : "Send reset link"}
            </Button>

            <div className="rounded-lg bg-raised/40 p-3 text-xs text-muted">
              <p className="font-medium text-fg mb-1">Security note</p>
              For your security, we never send your existing password via email.
              Reset links are single-use and expire after 1 hour.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

