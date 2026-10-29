import type { TaskPriority, TaskStatus } from "@my-day/types";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  BACKLOG: "Бэклог",
  TODO: "К выполнению",
  IN_PROGRESS: "В работе",
  WAITING: "Ожидание",
  COMPLETED: "Выполнена",
  CANCELLED: "Отменена",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
  URGENT: "Срочно",
};

export const STATUS_OPTIONS = Object.keys(STATUS_LABEL) as TaskStatus[];
export const PRIORITY_OPTIONS = Object.keys(PRIORITY_LABEL) as TaskPriority[];

export type TaskTab = "active" | "done" | "all";

export const TAB_LABEL: Record<TaskTab, string> = { active: "Активные", done: "Выполненные", all: "Все" };

/** Statuses a tab shows; `undefined` means no status filter. */
export function tabStatuses(tab: TaskTab): TaskStatus[] | undefined {
  if (tab === "active") return ["BACKLOG", "TODO", "IN_PROGRESS", "WAITING"];
  if (tab === "done") return ["COMPLETED"];
  return undefined;
}
