import type { CalendarEvent } from "@my-day/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const ACTIVE = ["TODO", "IN_PROGRESS"] as const;
const OPEN = ["TODO", "IN_PROGRESS", "WAITING"] as const;

export const useTodayEvents = (range: { from: string; to: string }) =>
  useQuery({
    queryKey: ["calendar", "events", range],
    queryFn: () => api.calendar.events(range),
    select: (events: CalendarEvent[]) =>
      events.filter((e) => e.status !== "CANCELLED").sort((a, b) => a.startAt.localeCompare(b.startAt)),
  });

export const useActiveTasks = () =>
  useQuery({ queryKey: ["tasks", "active"], queryFn: () => api.tasks.list({ status: [...ACTIVE], pageSize: 8 }) });

/** Open tasks whose due date is before the start of today (stable key; no per-render timestamps). */
export const useOverdueTasks = (beforeIso: string) =>
  useQuery({
    queryKey: ["tasks", "overdue", beforeIso],
    queryFn: () => api.tasks.list({ status: [...OPEN], dueBefore: beforeIso, pageSize: 5 }),
  });

export const useCompleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.tasks.complete(id),
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ["tasks"] }), qc.invalidateQueries({ queryKey: ["analytics"] })]),
  });
};

export const useUnreadNotifications = () =>
  useQuery({ queryKey: ["notifications", "unread"], queryFn: () => api.notifications.list({ read: false, pageSize: 5 }) });

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};
