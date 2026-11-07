"use client";

import { Button } from "@my-day/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";

function VerifyEmailForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("Missing verification token."); return; }
    api.auth.verifyEmail(token)
      .then(() => { setStatus("success"); setMessage("Your email has been verified."); })
      .catch((e) => { setStatus("error"); setMessage(e instanceof Error ? e.message : "Verification failed."); });
  }, [token]);

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-muted">Verifying your email…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in text-center">
      <div className={`rounded-xl border p-6 ${status === "success" ? "border-good/30 bg-good/10" : "border-bad/30 bg-bad/10"}`}>
        <p className="font-semibold text-fg">{status === "success" ? "Email verified" : "Verification failed"}</p>
        <p className="mt-1.5 text-sm text-muted">{message}</p>
      </div>
      <Button className="w-full h-10" onClick={() => router.replace("/login")}>
        Continue to sign in
      </Button>
      <Link href="/login" className="block text-sm text-muted hover:text-fg">Back to sign in</Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Verify email</h1>
          <p className="mt-1.5 text-sm text-muted">Confirming your email address.</p>
        </div>
        <Suspense fallback={<div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}