"use client";

import { ApiError } from "@my-day/api-client";
import { Button, Skeleton, StateMessage, cn } from "@my-day/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { api } from "@/lib/api";
import { useUi } from "@/stores/ui";

const NAV = [
  {
    section: "Workspace",
    items: [
      { href: "/", label: "My Day", icon: "☀️", ready: true },
      { href: "/tasks", label: "Tasks", icon: "✓", ready: true },
      { href: "/projects", label: "Projects", icon: "◈", ready: false },
      { href: "/calendar", label: "Calendar", icon: "▦", ready: false },
      { href: "/notes", label: "Notes", icon: "✎", ready: false },
    ],
  },
  {
    section: "Security",
    items: [
      { href: "/encryption", label: "Encryption", icon: "⬡", ready: true },
      { href: "/encryption-history", label: "Encryption History", icon: "◷", ready: true },
      { href: "/password-generator", label: "Password Generator", icon: "⊛", ready: true },
    ],
  },
  {
    section: "Insights",
    items: [
      { href: "/notifications", label: "Notifications", icon: "◎", ready: false },
      { href: "/analytics", label: "Analytics", icon: "▲", ready: false },
      { href: "/integrations", label: "Integrations", icon: "⌁", ready: false },
    ],
  },
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

  const pref = me.data?.themePreference;
  useEffect(() => {
    if (!pref) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        pref === "system" ? (mq.matches ? "dark" : "light") : pref;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [pref]);

  const logout = useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => { qc.clear(); router.replace("/login"); },
  });

  if (me.isPending)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );

  if (me.error) {
    if (me.error instanceof ApiError && me.error.isUnauthorized) return null;
    return (
      <main className="mx-auto max-w-md p-8">
        <StateMessage
          tone="error"
          title="Failed to load profile"
          hint={me.error.message}
          action={<Button variant="outline" onClick={() => me.refetch()}>Retry</Button>}
        />
      </main>
    );
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[15rem_1fr]">
      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-line/50 bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <span className="text-accent text-lg">◈</span>
          <span className="font-semibold tracking-tight">My Day</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={navOpen}
          aria-controls="main-nav"
          onClick={() => setNavOpen(!navOpen)}
        >
          {navOpen ? "✕" : "☰"}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-line/50 bg-surface",
          "md:block",
          navOpen ? "block" : "hidden",
        )}
      >
        {/* Logo */}
        <div className="hidden items-center gap-2.5 border-b border-line/50 px-5 py-5 md:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent text-sm">
            ◈
          </div>
          <span className="font-semibold tracking-tight text-fg">My Day</span>
        </div>

        {/* Navigation */}
        <nav id="main-nav" aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((group) => (
            <div key={group.section} className="mb-5">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted/60">
                {group.section}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) =>
                  item.ready ? (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setNavOpen(false)}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        "hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                        pathname === item.href
                          ? "bg-raised font-medium text-fg"
                          : "text-muted hover:text-fg",
                      )}
                    >
                      <span className={cn("text-base leading-none", pathname === item.href ? "text-accent" : "opacity-70")}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      key={item.href}
                      aria-disabled="true"
                      className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted/40"
                    >
                      <span className="text-base leading-none opacity-40">{item.icon}</span>
                      {item.label}
                    </span>
                  ),
                )}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-line/50 px-3 py-3">
          <div className="rounded-lg bg-raised/50 px-3 py-2.5">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-semibold">
                {me.data?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <p className="truncate text-sm font-medium text-fg">{me.data?.name}</p>
            </div>
            <p className="mb-2 truncate text-xs text-muted">{me.data?.email}</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full text-xs text-muted hover:text-bad"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
