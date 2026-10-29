import type { CreateTaskInput, TaskPriority, UpdateTaskInput } from "@my-day/types";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { tabStatuses, type TaskTab } from "./labels";

export const PAGE_SIZE = 20;

export interface TaskListFilters {
  tab: TaskTab;
  priority?: TaskPriority;
  search: string;
  page: number;
}

export const useTasks = (f: TaskListFilters) =>
  useQuery({
    queryKey: ["tasks", "list", f],
    queryFn: () =>
      api.tasks.list({
        status: tabStatuses(f.tab),
        priority: f.priority ? [f.priority] : undefined,
        search: f.search.trim() || undefined,
        page: f.page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

/** Every task mutation refreshes all task lists (including the dashboard's) and analytics. */
function useRefreshTasks() {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: ["tasks"] }), qc.invalidateQueries({ queryKey: ["analytics"] })]);
}

export const useCreateTask = () => {
  const refresh = useRefreshTasks();
  return useMutation({ mutationFn: (input: CreateTaskInput) => api.tasks.create(input), onSuccess: refresh });
};

export const useUpdateTask = () => {
  const refresh = useRefreshTasks();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) => api.tasks.update(id, input),
    onSuccess: refresh,
  });
};

export const useDeleteTask = () => {
  const refresh = useRefreshTasks();
  return useMutation({ mutationFn: (id: string) => api.tasks.remove(id), onSuccess: refresh });
};

/** Checkbox toggle: completes an open task, reopens a completed one. */
export const useToggleTask = () => {
  const refresh = useRefreshTasks();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      done ? api.tasks.update(id, { status: "TODO" }) : api.tasks.complete(id),
    onSuccess: refresh,
  });
};
