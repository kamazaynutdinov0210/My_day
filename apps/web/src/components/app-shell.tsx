"use client";

import { ApiError } from "@my-day/api-client";
import { Button, Skeleton, StateMessage, cn } from "@my-day/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { api } from "@/lib/api";
import { useUi } from "@/stores/ui";

// `ready: false` items are disabled until their screens exist — no dead links.
const NAV = [
  { href: "/", label: "Мой день", ready: true },
  { href: "/tasks", label: "Задачи", ready: false },
  { href: "/projects", label: "Проекты", ready: false },
  { href: "/calendar", label: "Календарь", ready: false },
  { href: "/notes", label: "Заметки", ready: false },
  { href: "/notifications", label: "Уведомления", ready: false },
  { href: "/analytics", label: "Аналитика", ready: false },
  { href: "/integrations", label: "Интеграции", ready: false },
];

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const { navOpen, setNavOpen } = useUi();
  const me = useQuery({ queryKey: ["me"], queryFn: api.auth.me, retry: false });

  useEffect(() => {
    if (me.error instanceof ApiError && me.error.isUnauthorized) router.replace("/login");
  }, [me.error, router]);

  // Apply the saved theme preference ("system" follows the OS).
  const pref = me.data?.themePreference;
  useEffect(() => {
    if (!pref) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => { document.documentElement.dataset.theme = pref === "system" ? (mq.matches ? "dark" : "light") : pref; };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [pref]);

  const logout = useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => { qc.clear(); router.replace("/login"); },
  });

  if (me.isPending) return <div className="p-8"><Skeleton className="h-8 w-48" /></div>;
  if (me.error) {
    if (me.error instanceof ApiError && me.error.isUnauthorized) return null;
    return (
      <main className="mx-auto max-w-md p-8">
        <StateMessage tone="error" title="Не удалось загрузить профиль" hint={me.error.message}
          action={<Button variant="outline" onClick={() => me.refetch()}>Повторить</Button>} />
      </main>
    );
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[14rem_1fr]">
      <header className="flex items-center justify-between border-b border-line px-4 py-3 md:hidden">
        <span className="font-semibold">Мой день</span>
        <Button variant="ghost" size="sm" aria-expanded={navOpen} aria-controls="main-nav" onClick={() => setNavOpen(!navOpen)}>Меню</Button>
      </header>
      <aside className={cn("border-r border-line bg-surface p-4 md:block", navOpen ? "block" : "hidden")}>
        <p className="mb-6 hidden text-lg font-semibold md:block">Мой день</p>
        <nav id="main-nav" aria-label="Основная навигация" className="flex flex-col gap-1">
          {NAV.map((item) =>
            item.ready ? (
              <Link key={item.href} href={item.href} onClick={() => setNavOpen(false)}
                aria-current={pathname === item.href ? "page" : undefined}
                className={cn("rounded-md px-3 py-2 text-sm hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                  pathname === item.href ? "bg-raised font-medium text-fg" : "text-muted")}>
                {item.label}
              </Link>
            ) : (
              <span key={item.href} aria-disabled="true" className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-muted/50">
                {item.label}
              </span>
            ),
          )}
        </nav>
        <div className="mt-8 border-t border-line pt-4 text-sm">
          <p className="truncate font-medium">{me.data.name}</p>
          <p className="truncate text-muted">{me.data.email}</p>
          <Button variant="ghost" size="sm" className="mt-2 -ml-3" disabled={logout.isPending} onClick={() => logout.mutate()}>Выйти</Button>
        </div>
      </aside>
      <main className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
