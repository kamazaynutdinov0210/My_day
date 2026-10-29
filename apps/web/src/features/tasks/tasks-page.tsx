"use client";

import { ApiError } from "@my-day/api-client";
import type { Task, TaskPriority, TaskStatus } from "@my-day/types";
import { Button, Skeleton, StateMessage, cn } from "@my-day/ui";
import { useQuery } from "@tanstack/react-query";
import { cloneElement, useEffect, useId, useRef, useState, type FormEvent, type ReactElement } from "react";
import { api } from "@/lib/api";
import { endOfZonedDay, formatDueDate, zonedYmd } from "@/lib/time";
import { useDebounced } from "@/lib/use-debounced";
import {
  PRIORITY_LABEL, PRIORITY_OPTIONS, STATUS_LABEL, STATUS_OPTIONS, TAB_LABEL, type TaskTab,
} from "./labels";
import { useCreateTask, useDeleteTask, useTasks, useToggleTask, useUpdateTask } from "./queries";

const TABS: TaskTab[] = ["active", "done", "all"];

const FIELD =
  "h-10 w-full rounded-md border border-line bg-bg px-3 text-sm text-fg placeholder:text-muted " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent aria-[invalid=true]:border-bad";

const EMPTY_TEXT: Record<TaskTab, { title: string; hint: string }> = {
  active: { title: "Активных задач нет", hint: "Создайте задачу кнопкой «Новая задача»." },
  done: { title: "Выполненных задач пока нет", hint: "Отметьте задачу галочкой, и она появится здесь." },
  all: { title: "Задач пока нет", hint: "Создайте первую задачу кнопкой «Новая задача»." },
};

export function TasksPage() {
  const me = useQuery({ queryKey: ["me"], queryFn: api.auth.me });
  const tz = me.data?.timezone ?? "Asia/Tashkent";

  const [tab, setTab] = useState<TaskTab>("active");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Task | "new" | null>(null);
  const search = useDebounced(searchInput);

  const tasks = useTasks({ tab, priority: priority || undefined, search, page });
  const totalPages = tasks.data?.pagination.totalPages ?? 1;
  const filtered = Boolean(searchInput.trim() || priority);

  // Deleting the last task on the last page would otherwise leave an empty page.
  useEffect(() => {
    if (tasks.data && page > totalPages) setPage(totalPages);
  }, [tasks.data, page, totalPages]);

  const resetFilters = () => { setPriority(""); setSearchInput(""); setPage(1); };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Задачи</h1>
          <p className="text-sm text-muted" aria-live="polite">
            {tasks.data ? `Найдено: ${tasks.data.pagination.totalItems}` : "\u00a0"}
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>Новая задача</Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Показать задачи" className="flex rounded-md border border-line p-0.5">
          {TABS.map((t) => (
            <button key={t} type="button" aria-pressed={tab === t} onClick={() => { setTab(t); setPage(1); }}
              className={cn("rounded px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                tab === t ? "bg-raised font-medium text-fg" : "text-muted hover:text-fg")}>
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
        <select aria-label="Приоритет" value={priority} className={cn(FIELD, "w-auto min-w-40")}
          onChange={(e) => { setPriority(e.target.value as TaskPriority | ""); setPage(1); }}>
          <option value="">Любой приоритет</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
        </select>
        <input type="search" aria-label="Поиск по задачам" placeholder="Поиск…" value={searchInput}
          className={cn(FIELD, "min-w-48 flex-1 sm:max-w-xs")}
          onChange={(e) => { setSearchInput(e.target.value); setPage(1); }} />
      </div>

      <section aria-label="Список задач" aria-busy={tasks.isFetching} className="rounded-lg border border-line bg-surface p-5">
        {tasks.isPending && (
          <div className="space-y-3"><Skeleton className="h-6" /><Skeleton className="h-6" /><Skeleton className="h-6 w-2/3" /></div>
        )}
        {tasks.isError && (
          <StateMessage tone="error" title="Не удалось загрузить задачи" hint={tasks.error.message}
            action={<Button variant="outline" size="sm" onClick={() => tasks.refetch()}>Повторить</Button>} />
        )}
        {tasks.data && tasks.data.items.length === 0 && (
          filtered
            ? <StateMessage title="Ничего не найдено" hint="Попробуйте изменить поиск или приоритет."
                action={<Button variant="outline" size="sm" onClick={resetFilters}>Сбросить фильтры</Button>} />
            : <StateMessage title={EMPTY_TEXT[tab].title} hint={EMPTY_TEXT[tab].hint} />
        )}
        {tasks.data && tasks.data.items.length > 0 && (
          <ul className={cn("divide-y divide-line", tasks.isPlaceholderData && "opacity-60")}>
            {tasks.data.items.map((t) => <TaskRow key={t.id} task={t} tz={tz} onOpen={() => setEditing(t)} />)}
          </ul>
        )}
      </section>

      {totalPages > 1 && (
        <nav aria-label="Страницы" className="flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Назад</Button>
          <span className="text-muted">Страница {page} из {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Вперёд</Button>
        </nav>
      )}

      <TaskDialog target={editing} tz={tz} onClose={() => setEditing(null)} />
    </div>
  );
}

function TaskRow({ task, tz, onOpen }: { task: Task; tz: string; onOpen: () => void }) {
  const toggle = useToggleTask();
  const done = task.status === "COMPLETED";
  const overdue = !done && task.status !== "CANCELLED" && task.dueDate !== null && Date.parse(task.dueDate) < Date.now();
  const showStatus = task.status !== "TODO" && task.status !== "COMPLETED";

  return (
    <li className="flex items-center gap-3 py-3 text-sm first:pt-0 last:pb-0">
      <input type="checkbox" className="size-4 shrink-0 accent-[rgb(var(--accent))]" checked={done} disabled={toggle.isPending}
        aria-label={done ? `Вернуть в работу: ${task.title}` : `Выполнить: ${task.title}`}
        onChange={() => toggle.mutate({ id: task.id, done })} />
      <button type="button" onClick={onOpen} aria-label={`Открыть задачу: ${task.title}`}
        className={cn("min-w-0 flex-1 truncate text-left hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
          done && "text-muted line-through")}>
        {task.title}
      </button>
      {showStatus && <span className="hidden shrink-0 rounded-full bg-raised px-2 py-0.5 text-xs text-muted sm:inline">{STATUS_LABEL[task.status]}</span>}
      {(task.priority === "URGENT" || task.priority === "HIGH") && (
        <span className={cn("shrink-0 text-xs", task.priority === "URGENT" ? "text-bad" : "text-muted")}>{PRIORITY_LABEL[task.priority]}</span>
      )}
      {task.dueDate && (
        <span className={cn("shrink-0 tabular-nums", overdue ? "text-bad" : "text-muted")}>
          {overdue && <span className="sr-only">Просрочено: </span>}
          {formatDueDate(task.dueDate, tz)}
        </span>
      )}
      {toggle.isError && <span role="alert" className="shrink-0 text-xs text-bad">Не удалось обновить</span>}
    </li>
  );
}

function TaskDialog({ target, tz, onClose }: { target: Task | "new" | null; tz: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = target !== null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} aria-labelledby="task-dialog-title" onClose={onClose}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-0 text-fg backdrop:bg-black/60">
      {target && <TaskForm key={target === "new" ? "new" : target.id} task={target === "new" ? null : target} tz={tz} onDone={onClose} />}
    </dialog>
  );
}

function Labeled({ label, error, children }: {
  label: string; error?: string; children: ReactElement<{ id?: string; "aria-describedby"?: string }>;
}) {
  const id = useId();
  // The error is linked with aria-describedby (not nested in the label) so the field's name stays "label".
  return (
    <div className="text-sm">
      <label htmlFor={id} className="mb-1 block text-muted">{label}</label>
      {cloneElement(children, { id, "aria-describedby": error ? `${id}-error` : undefined })}
      {error && <span id={`${id}-error`} role="alert" className="mt-1 block text-bad">{error}</span>}
    </div>
  );
}

function TaskForm({ task, tz, onDone }: { task: Task | null; tz: string; onDone: () => void }) {
  const create = useCreateTask();
  const update = useUpdateTask();
  const remove = useDeleteTask();

  const originalDue = task?.dueDate ? zonedYmd(task.dueDate, tz) : "";
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "MEDIUM");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "TODO");
  const [due, setDue] = useState(originalDue);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const pending = create.isPending || update.isPending || remove.isPending;
  const error = create.error ?? update.error ?? remove.error;
  const apiError = error instanceof ApiError ? error : undefined;
  const titleError = apiError?.fieldError("title");
  const otherError = error && !titleError ? error.message : undefined;

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    if (task) {
      update.mutate({
        id: task.id,
        input: {
          title: trimmed,
          description: description.trim() || null,
          priority,
          status,
          // Only send the due date when it changed, so a time-of-day set elsewhere is not overwritten.
          ...(due !== originalDue ? { dueDate: due ? endOfZonedDay(due, tz) : null } : {}),
        },
      }, { onSuccess: onDone });
    } else {
      create.mutate({
        title: trimmed,
        description: description.trim() || undefined,
        priority,
        dueDate: due ? endOfZonedDay(due, tz) : undefined,
      }, { onSuccess: onDone });
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-5">
      <h2 id="task-dialog-title" className="text-lg font-semibold">{task ? "Редактировать задачу" : "Новая задача"}</h2>

      <Labeled label="Название" error={titleError}>
        <input className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={500}
          autoFocus aria-invalid={Boolean(titleError)} />
      </Labeled>
      <Labeled label="Описание">
        <textarea className={cn(FIELD, "h-24 py-2")} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Labeled>
      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled label="Приоритет">
          <select className={FIELD} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
          </select>
        </Labeled>
        <Labeled label="Срок">
          <input type="date" className={FIELD} value={due} onChange={(e) => setDue(e.target.value)} />
        </Labeled>
      </div>
      {task && (
        <Labeled label="Статус">
          <select className={FIELD} value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </Labeled>
      )}

      {otherError && <p role="alert" className="text-sm text-bad">{otherError}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {task && !confirmDelete && (
          <Button variant="ghost" className="mr-auto text-bad hover:text-bad" disabled={pending} onClick={() => setConfirmDelete(true)}>Удалить</Button>
        )}
        {task && confirmDelete && (
          <span className="mr-auto flex items-center gap-2 text-sm">
            <span className="text-bad">Удалить навсегда?</span>
            <Button variant="outline" size="sm" disabled={pending} onClick={() => remove.mutate(task.id, { onSuccess: onDone })}>Да, удалить</Button>
            <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirmDelete(false)}>Нет</Button>
          </span>
        )}
        {!task && <span className="mr-auto" />}
        <Button variant="outline" disabled={pending} onClick={onDone}>Отмена</Button>
        <Button type="submit" disabled={pending || !title.trim()}>{task ? "Сохранить" : "Создать"}</Button>
      </div>
    </form>
  );
}
