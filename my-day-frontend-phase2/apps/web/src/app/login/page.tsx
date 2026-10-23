"use client";

import { ApiError } from "@my-day/api-client";
import { Button, cn } from "@my-day/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";

const field = "h-10 w-full rounded-md border border-line bg-surface px-3 text-sm placeholder:text-muted " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";

export default function LoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const auth = useMutation({
    mutationFn: () =>
      mode === "login"
        ? api.auth.login({ email: form.email, password: form.password })
        : api.auth.register(form),
    onSuccess: ({ user }) => {
      qc.setQueryData(["me"], user);
      router.replace("/");
    },
  });
  const err = auth.error instanceof ApiError ? auth.error : null;

  const submit = (e: FormEvent) => { e.preventDefault(); auth.mutate(); };
  const input = (key: keyof typeof form, label: string, type: string, autoComplete: string) => (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <input
        className={cn(field, err?.fieldError(key) && "border-bad")}
        type={type} autoComplete={autoComplete} required value={form[key]}
        aria-invalid={Boolean(err?.fieldError(key))}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
      {err?.fieldError(key) && <span className="text-bad">{err.fieldError(key)}</span>}
    </label>
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold">{mode === "login" ? "Вход в «Мой день»" : "Создать аккаунт"}</h1>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {mode === "register" && input("name", "Имя", "text", "name")}
        {input("email", "Почта", "email", "email")}
        {input("password", "Пароль", "password", mode === "login" ? "current-password" : "new-password")}
        {err && !err.details.length && <p role="alert" className="text-sm text-bad">{err.message}</p>}
        <Button type="submit" disabled={auth.isPending}>
          {auth.isPending ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"}
        </Button>
      </form>
      <Button variant="ghost" size="sm" className="self-start" onClick={() => { auth.reset(); setMode(mode === "login" ? "register" : "login"); }}>
        {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
      </Button>
    </main>
  );
}
