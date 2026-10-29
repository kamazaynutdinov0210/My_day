import { ApiError } from "@my-day/api-client";
import type { Task } from "@my-day/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  api: {
    auth: { me: vi.fn() },
    tasks: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), complete: vi.fn() },
  },
}));
import { api } from "@/lib/api";
import { TasksPage } from "./tasks-page";

const m = api as unknown as {
  auth: { me: ReturnType<typeof vi.fn> };
  tasks: Record<"list" | "create" | "update" | "remove" | "complete", ReturnType<typeof vi.fn>>;
};

const task = (o: Partial<Task>): Task => ({
  id: "c1", userId: "u", title: "Write report", description: null, status: "TODO", priority: "MEDIUM", dueDate: null,
  startDate: null, estimatedDuration: null, actualDuration: null, projectId: null, parentTaskId: null,
  recurrenceFreq: "NONE", recurrenceRule: null, completedAt: null, tagIds: [], createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z", ...o,
});
const page = (items: Task[], totalPages = 1, totalItems = items.length) => ({ items, pagination: { page: 1, pageSize: 20, totalItems, totalPages } });

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><TasksPage /></QueryClientProvider>);
}

beforeAll(() => {
  // jsdom has no <dialog> modal support; emulate the open/close behaviour the browser provides.
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
});
beforeEach(() => {
  Object.values(m.tasks).forEach((f) => f.mockReset());
  m.auth.me.mockResolvedValue({ id: "u", name: "T", email: "t@x.y", timezone: "Asia/Tashkent" });
  m.tasks.list.mockResolvedValue(page([task({}), task({ id: "c2", title: "Pay rent", priority: "URGENT", dueDate: "2020-01-01T18:59:00Z" })]));
});
afterEach(cleanup);

describe("Tasks page", () => {
  it("lists active tasks, flags overdue ones, and asks the API for open statuses only", async () => {
    renderPage();
    expect(await screen.findByText("Write report")).toBeTruthy();
    expect(screen.getByText("Pay rent")).toBeTruthy();
    expect(screen.getByText(/Просрочено:/)).toBeTruthy();
    expect(within(screen.getByRole("list")).getByText("Срочно")).toBeTruthy();
    expect(m.tasks.list).toHaveBeenCalledWith({ status: ["BACKLOG", "TODO", "IN_PROGRESS", "WAITING"], priority: undefined, search: undefined, page: 1, pageSize: 20 });
    expect(screen.getByText("Найдено: 2")).toBeTruthy();
  });

  it("switching to 'Выполненные' filters to COMPLETED; 'Все' sends no status filter", async () => {
    const user = userEvent.setup(); renderPage(); await screen.findByText("Write report");
    await user.click(screen.getByRole("button", { name: "Выполненные" }));
    await waitFor(() => expect(m.tasks.list).toHaveBeenLastCalledWith(expect.objectContaining({ status: ["COMPLETED"], page: 1 })));
    await user.click(screen.getByRole("button", { name: "Все" }));
    await waitFor(() => expect(m.tasks.list).toHaveBeenLastCalledWith(expect.objectContaining({ status: undefined })));
  });

  it("debounced search and priority filter reach the API, and 'no results' offers a reset", async () => {
    const user = userEvent.setup(); renderPage(); await screen.findByText("Write report");
    m.tasks.list.mockResolvedValue(page([]));
    await user.type(screen.getByLabelText("Поиск по задачам"), "rent");
    await waitFor(() => expect(m.tasks.list).toHaveBeenLastCalledWith(expect.objectContaining({ search: "rent", page: 1 })));
    expect(m.tasks.list.mock.calls.filter((c) => c[0].search === "r").length).toBe(0); // debounced, not per keystroke
    await user.selectOptions(screen.getByLabelText("Приоритет"), "HIGH");
    await waitFor(() => expect(m.tasks.list).toHaveBeenLastCalledWith(expect.objectContaining({ priority: ["HIGH"], search: "rent" })));
    expect(await screen.findByText("Ничего не найдено")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Сбросить фильтры" }));
    await waitFor(() => expect(m.tasks.list).toHaveBeenLastCalledWith(expect.objectContaining({ search: undefined, priority: undefined })));
  });

  it("checkbox completes an open task and reopens a completed one", async () => {
    const user = userEvent.setup();
    m.tasks.complete.mockResolvedValue(task({})); m.tasks.update.mockResolvedValue(task({}));
    m.tasks.list.mockResolvedValue(page([task({}), task({ id: "c9", title: "Done thing", status: "COMPLETED" })]));
    renderPage();
    await user.click(await screen.findByRole("checkbox", { name: "Выполнить: Write report" }));
    await waitFor(() => expect(m.tasks.complete).toHaveBeenCalledWith("c1"));
    await user.click(screen.getByRole("checkbox", { name: "Вернуть в работу: Done thing" }));
    await waitFor(() => expect(m.tasks.update).toHaveBeenCalledWith("c9", { status: "TODO" }));
  });

  it("creates a task: date-only due becomes end of that day in the user's timezone, blank description is omitted", async () => {
    const user = userEvent.setup(); m.tasks.create.mockResolvedValue(task({}));
    renderPage(); await screen.findByText("Write report");
    await user.click(screen.getByRole("button", { name: "Новая задача" }));
    const dialog = await screen.findByRole("dialog");
    expect((within(dialog).getByRole("button", { name: "Создать" }) as HTMLButtonElement).disabled).toBe(true); // title required
    await user.type(within(dialog).getByLabelText("Название"), "  Buy milk  ");
    await user.selectOptions(within(dialog).getByLabelText("Приоритет"), "HIGH");
    await user.type(within(dialog).getByLabelText("Срок"), "2026-10-30");
    await user.click(within(dialog).getByRole("button", { name: "Создать" }));
    await waitFor(() => expect(m.tasks.create).toHaveBeenCalledWith({ title: "Buy milk", description: undefined, priority: "HIGH", dueDate: "2026-10-30T18:59:00.000Z" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull()); // closes after success
  });

  it("shows the API's field error under the title and keeps the dialog open", async () => {
    const user = userEvent.setup();
    m.tasks.create.mockRejectedValue(new ApiError(400, "VALIDATION_ERROR", "Validation failed", [{ field: "title", message: "title must be shorter than or equal to 500 characters" }]));
    renderPage(); await screen.findByText("Write report");
    await user.click(screen.getByRole("button", { name: "Новая задача" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Название"), "x");
    await user.click(within(dialog).getByRole("button", { name: "Создать" }));
    expect(await within(dialog).findByText(/must be shorter/)).toBeTruthy();
    expect(within(dialog).getByLabelText("Название").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("edits: prefilled, unchanged due date is NOT resent, cleared description becomes null", async () => {
    const user = userEvent.setup(); m.tasks.update.mockResolvedValue(task({}));
    m.tasks.list.mockResolvedValue(page([task({ title: "Plan", description: "old", dueDate: "2030-05-10T18:59:00Z", priority: "LOW" })]));
    renderPage();
    await user.click(await screen.findByRole("button", { name: "Открыть задачу: Plan" }));
    const dialog = await screen.findByRole("dialog");
    expect((within(dialog).getByLabelText("Название") as HTMLInputElement).value).toBe("Plan");
    expect((within(dialog).getByLabelText("Срок") as HTMLInputElement).value).toBe("2030-05-10");
    await user.clear(within(dialog).getByLabelText("Описание"));
    await user.selectOptions(within(dialog).getByLabelText("Статус"), "IN_PROGRESS");
    await user.click(within(dialog).getByRole("button", { name: "Сохранить" }));
    await waitFor(() => expect(m.tasks.update).toHaveBeenCalledWith("c1", { title: "Plan", description: null, priority: "LOW", status: "IN_PROGRESS" }));
  });

  it("clearing the due date sends null; delete needs a second confirmation", async () => {
    const user = userEvent.setup(); m.tasks.update.mockResolvedValue(task({})); m.tasks.remove.mockResolvedValue(null);
    m.tasks.list.mockResolvedValue(page([task({ title: "Plan", dueDate: "2030-05-10T18:59:00Z" })]));
    renderPage();
    await user.click(await screen.findByRole("button", { name: "Открыть задачу: Plan" }));
    let dialog = await screen.findByRole("dialog");
    await user.clear(within(dialog).getByLabelText("Срок"));
    await user.click(within(dialog).getByRole("button", { name: "Сохранить" }));
    await waitFor(() => expect(m.tasks.update).toHaveBeenCalledWith("c1", expect.objectContaining({ dueDate: null })));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await user.click(await screen.findByRole("button", { name: "Открыть задачу: Plan" }));
    dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Удалить" }));
    expect(m.tasks.remove).not.toHaveBeenCalled(); // first click only asks
    await user.click(within(dialog).getByRole("button", { name: "Да, удалить" }));
    await waitFor(() => expect(m.tasks.remove).toHaveBeenCalledWith("c1"));
  });

  it("paginates and can recover from a load error", async () => {
    const user = userEvent.setup();
    m.tasks.list.mockResolvedValue(page([task({})], 3, 41));
    renderPage();
    expect(await screen.findByText("Страница 1 из 3")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Назад" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "Вперёд" }));
    await waitFor(() => expect(m.tasks.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));
  });

  it("shows an error with retry when loading fails", async () => {
    const user = userEvent.setup();
    m.tasks.list.mockRejectedValueOnce(new ApiError(500, "INTERNAL_ERROR", "Internal server error"));
    renderPage();
    expect(await screen.findByText("Не удалось загрузить задачи")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Повторить" }));
    expect(await screen.findByText("Write report")).toBeTruthy();
  });
});
