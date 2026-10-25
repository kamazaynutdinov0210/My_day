"use client";

import type { CalendarEvent, Notification, Task } from "@my-day/types";
import { Button, Skeleton, StateMessage, cn } from "@my-day/ui";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { formatDuration, formatTime, minutesOfDay, zonedDayRange } from "@/lib/time";
import {
  useActiveTasks, useCompleteTask, useMarkAllRead, useOverdueTasks, useTodayEvents, useUnreadNotifications,
} from "./queries";

const RIBBON_START = 6 * 60; // 06:00
const RIBBON_SPAN = 18 * 60; // until 24:00

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-medium">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function ListSkeleton() {
  return <div className="space-y-2"><Skeleton className="h-6" /><Skeleton className="h-6" /><Skeleton className="h-6 w-2/3" /></div>;
}

export function Dashboard() {
  const me = useQuery({ queryKey: ["me"], queryFn: api.auth.me });
  const tz = me.data?.timezone ?? "Asia/Tashkent";
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // Display-only clock. Reminders are server-side (BullMQ); this timer never triggers anything.
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now);
  const range = useMemo(() => zonedDayRange(tz), [tz, dayKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const events = useTodayEvents(range);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(now));
  const greeting = hour < 5 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
  const scheduled = (events.data ?? []).reduce((sum, e) => sum + Math.max(0, (Date.parse(e.endAt) - Date.parse(e.startAt)) / 60000), 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm capitalize text-muted">
            {new Intl.DateTimeFormat("ru-RU", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(now)}
          </p>
          <h1 className="text-3xl font-semibold">{greeting}{me.data ? `, ${me.data.name}` : ""}</h1>
        </div>
        <div className="text-right">
          <p className="text-4xl font-semibold tabular-nums">{formatTime(now.toISOString(), tz)}</p>
          <p className="text-sm text-muted">{events.data ? `В календаре на сегодня: ${formatDuration(Math.round(scheduled))}` : "\u00a0"}</p>
        </div>
      </header>

      <Section title="Расписание на сегодня">
        <DayRibbon events={events.data ?? []} tz={tz} now={now} />
        {events.isPending && <ListSkeleton />}
        {events.isError && <StateMessage tone="error" title="Не удалось загрузить события" hint={events.error.message}
          action={<Button variant="outline" size="sm" onClick={() => events.refetch()}>Повторить</Button>} />}
        {events.data && events.data.length === 0 && (
          <StateMessage title="На сегодня событий нет" hint="Добавьте событие в календаре, и оно появится на шкале дня." />
        )}
        {events.data && events.data.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm">
            {events.data.slice(0, 6).map((e) => (
              <li key={e.id} className="flex gap-3">
                <span className="w-24 shrink-0 tabular-nums text-muted">{formatTime(e.startAt, tz)}–{formatTime(e.endAt, tz)}</span>
                <span className="truncate">{e.title}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <TasksSection overdueBefore={range.from} />
        <NotificationsSection />
      </div>
    </div>
  );
}

function DayRibbon({ events, tz, now }: { events: CalendarEvent[]; tz: string; now: Date }) {
  const pct = (min: number) => Math.max(0, Math.min(100, ((min - RIBBON_START) / RIBBON_SPAN) * 100));
  const nowPct = pct(minutesOfDay(now.toISOString(), tz));
  return (
    <div className="relative h-14 rounded-md bg-raised" role="img"
      aria-label={`Шкала дня с 06:00 до 24:00, событий: ${events.length}`}>
      {[6, 9, 12, 15, 18, 21].map((h) => (
        <span key={h} aria-hidden className="absolute top-full mt-1 -translate-x-1/2 text-xs text-muted" style={{ left: `${pct(h * 60)}%` }}>
          {String(h).padStart(2, "0")}
        </span>
      ))}
      {events.map((e) => {
        const start = minutesOfDay(e.startAt, tz);
        const end = Math.max(start + 15, minutesOfDay(e.endAt, tz) || 24 * 60);
        return (
          <div key={e.id} title={`${e.title}, ${formatTime(e.startAt, tz)}–${formatTime(e.endAt, tz)}`}
            className="absolute inset-y-2 min-w-1 overflow-hidden rounded-sm bg-accent/80 px-1.5 text-xs leading-10 text-accent-fg"
            style={{ left: `${pct(start)}%`, width: `${Math.max(0.8, pct(end) - pct(start))}%` }}>
            <span className="hidden sm:inline">{e.title}</span>
          </div>
        );
      })}
      <div aria-hidden className="absolute inset-y-0 w-0.5 bg-fg" style={{ left: `${nowPct}%` }} />
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const complete = useCompleteTask();
  return (
    <li className="flex items-center gap-3 text-sm">
      <input type="checkbox" className="size-4 accent-[rgb(var(--accent))]" aria-label={`Выполнить: ${task.title}`}
        disabled={complete.isPending} checked={complete.isPending} onChange={() => complete.mutate(task.id)} />
      <span className="truncate">{task.title}</span>
      {(task.priority === "URGENT" || task.priority === "HIGH") && (
        <span className={cn("ml-auto shrink-0 text-xs", task.priority === "URGENT" ? "text-bad" : "text-muted")}>
          {task.priority === "URGENT" ? "Срочно" : "Важно"}
        </span>
      )}
    </li>
  );
}

function TasksSection({ overdueBefore }: { overdueBefore: string }) {
  const active = useActiveTasks();
  const overdue = useOverdueTasks(overdueBefore);
  const retry = () => { void active.refetch(); void overdue.refetch(); };
  return (
    <Section title="Задачи" aside={overdue.data && overdue.data.pagination.totalItems > 0
      ? <span className="text-sm text-bad">Просрочено: {overdue.data.pagination.totalItems}</span> : null}>
      {(active.isPending || overdue.isPending) && <ListSkeleton />}
      {(active.isError || overdue.isError) && (
        <StateMessage tone="error" title="Не удалось загрузить задачи" hint={(active.error ?? overdue.error)?.message}
          action={<Button variant="outline" size="sm" onClick={retry}>Повторить</Button>} />
      )}
      {active.data && overdue.data && (
        active.data.items.length + overdue.data.items.length === 0 ? (
          <StateMessage title="Активных задач нет" hint="Создайте задачу, и она появится здесь." />
        ) : (
          <ul className="space-y-2.5">
            {overdue.data.items.map((t) => <TaskRow key={t.id} task={t} />)}
            {active.data.items.filter((t) => !overdue.data.items.some((o) => o.id === t.id)).map((t) => <TaskRow key={t.id} task={t} />)}
          </ul>
        )
      )}
    </Section>
  );
}

function NotificationsSection() {
  const unread = useUnreadNotifications();
  const markAll = useMarkAllRead();
  return (
    <Section title="Уведомления" aside={unread.data && unread.data.pagination.totalItems > 0 && (
      <Button variant="ghost" size="sm" disabled={markAll.isPending} onClick={() => markAll.mutate()}>Прочитать все</Button>
    )}>
      {unread.isPending && <ListSkeleton />}
      {unread.isError && <StateMessage tone="error" title="Не удалось загрузить уведомления" hint={unread.error.message}
        action={<Button variant="outline" size="sm" onClick={() => unread.refetch()}>Повторить</Button>} />}
      {unread.data && (unread.data.items.length === 0
        ? <StateMessage title="Новых уведомлений нет" />
        : <ul className="space-y-3 text-sm">
            {unread.data.items.map((n: Notification) => (
              <li key={n.id}>
                <p className="font-medium">{n.title}</p>
                <p className="text-muted">{n.message}</p>
              </li>
            ))}
            {unread.data.pagination.totalItems > unread.data.items.length && (
              <li className="text-muted">и ещё {unread.data.pagination.totalItems - unread.data.items.length}</li>
            )}
          </ul>)}
    </Section>
  );
}
