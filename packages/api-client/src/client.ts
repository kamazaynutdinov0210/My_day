import type {
  ActivityLogEntry, ActivityLogFilterParams, AIChatRequest, AIChatResponse,
  AIConfirmActionRequest, AIResponse, AISummarizeRequest, AnalyticsOverview,
  AnalyticsQueryParams, AuthLoginInput, AuthRegisterInput, AuthSessionResult,
  CalendarEvent, CalendarEventFilterParams, ConnectIntegrationInput,
  CreateCalendarEventInput, CreateNoteInput, CreateProjectInput, CreateReminderInput,
  CreateTagInput, CreateTaskInput, CreateTimeEntryInput, DailyBriefing,
  DailyBriefingGenerateRequest, EmailFilterParams, EmailMessage, EntityId,
  IntegrationAccount, IntegrationCatalogEntry, Message, MessageFilterParams, Note,
  NoteFilterParams, Notification, NotificationFilterParams, PaginationParams, Project,
  ProjectFilterParams, Reminder, ReminderStatus, Tag, Task, TaskComment, TaskFilterParams,
  TimeEntry, UpdateCalendarEventInput, UpdateNoteInput, UpdateProjectInput,
  UpdateReminderInput, UpdateTaskInput, UpdateUserSettingsInput, User,
} from "@my-day/types";
import { createHttp, type HttpOptions, type Page } from "./http.js";
import type { HealthStatus, SearchResults, UnreadCount } from "./types.js";

type Paged<F> = F & PaginationParams;
export interface ReminderFilterParams { status?: ReminderStatus[]; taskId?: EntityId; eventId?: EntityId }
export interface TimeEntryFilterParams { taskId?: EntityId; from?: string; to?: string }

/** Typed REST client for docs/API_CONTRACT.md. The only place apps/web is allowed to call fetch. */
export function createApiClient(options: HttpOptions = {}) {
  const { request } = createHttp(options);

  const get = async <T>(path: string, query?: object) => (await request<T>("GET", path, { query })).data;
  const send = async <T>(method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown) =>
    (await request<T>(method, path, { body })).data;
  const list = async <T>(path: string, query?: object): Promise<Page<T>> => {
    const { data, meta } = await request<T[]>("GET", path, { query });
    return {
      items: data,
      pagination: meta?.pagination ?? { page: 1, pageSize: data.length, totalItems: data.length, totalPages: 1 },
    };
  };
  const crud = <T, C, U, F>(base: string) => ({
    list: (q?: Paged<F>) => list<T>(base, q),
    get: (id: EntityId) => get<T>(`${base}/${id}`),
    create: (input: C) => send<T>("POST", base, input),
    update: (id: EntityId, input: U) => send<T>("PATCH", `${base}/${id}`, input),
    remove: (id: EntityId) => send<null>("DELETE", `${base}/${id}`),
  });

  return {
    auth: {
      register: (i: AuthRegisterInput) => send<AuthSessionResult>("POST", "/auth/register", i),
      login: (i: AuthLoginInput) => send<AuthSessionResult>("POST", "/auth/login", i),
      logout: () => send<null>("POST", "/auth/logout"),
      me: () => get<User>("/auth/me"),
    },
    users: {
      me: () => get<User>("/users/me"),
      updateMe: (i: UpdateUserSettingsInput) => send<User>("PATCH", "/users/me", i),
    },
    tasks: {
      ...crud<Task, CreateTaskInput, UpdateTaskInput, TaskFilterParams>("/tasks"),
      complete: (id: EntityId) => send<Task>("POST", `/tasks/${id}/complete`),
      comments: (id: EntityId) => get<TaskComment[]>(`/tasks/${id}/comments`),
      addComment: (id: EntityId, body: string) => send<TaskComment>("POST", `/tasks/${id}/comments`, { body }),
    },
    projects: {
      ...crud<Project, CreateProjectInput, UpdateProjectInput, ProjectFilterParams>("/projects"),
      tasks: (id: EntityId, q?: Paged<TaskFilterParams>) => list<Task>(`/projects/${id}/tasks`, q),
    },
    calendar: {
      /** `from`/`to` are required by the contract (bounded range query). Not paginated. */
      events: (q: CalendarEventFilterParams) => get<CalendarEvent[]>("/calendar/events", q),
      getEvent: (id: EntityId) => get<CalendarEvent>(`/calendar/events/${id}`),
      createEvent: (i: CreateCalendarEventInput) => send<CalendarEvent>("POST", "/calendar/events", i),
      updateEvent: (id: EntityId, i: UpdateCalendarEventInput) => send<CalendarEvent>("PATCH", `/calendar/events/${id}`, i),
      removeEvent: (id: EntityId) => send<null>("DELETE", `/calendar/events/${id}`),
    },
    notes: crud<Note, CreateNoteInput, UpdateNoteInput, NoteFilterParams>("/notes"),
    reminders: {
      list: (q?: Paged<ReminderFilterParams>) => list<Reminder>("/reminders", q),
      create: (i: CreateReminderInput) => send<Reminder>("POST", "/reminders", i),
      update: (id: EntityId, i: UpdateReminderInput) => send<Reminder>("PATCH", `/reminders/${id}`, i),
      remove: (id: EntityId) => send<null>("DELETE", `/reminders/${id}`),
    },
    notifications: {
      list: (q?: Paged<NotificationFilterParams>) => list<Notification>("/notifications", q),
      unreadCount: () => get<UnreadCount>("/notifications/unread-count"),
      markRead: (id: EntityId) => send<Notification>("POST", `/notifications/${id}/read`),
      markAllRead: () => send<null>("POST", "/notifications/read-all"),
    },
    tags: {
      list: () => get<Tag[]>("/tags"),
      create: (i: CreateTagInput) => send<Tag>("POST", "/tags", i),
      remove: (id: EntityId) => send<null>("DELETE", `/tags/${id}`),
    },
    activity: { list: (q?: Paged<ActivityLogFilterParams>) => list<ActivityLogEntry>("/activity", q) },
    search: (q: string) => get<SearchResults>("/search", { q }),
    messages: {
      list: (q?: Paged<MessageFilterParams>) => list<Message>("/messages", q),
      markRead: (id: EntityId) => send<Message>("POST", `/messages/${id}/read`),
    },
    emails: {
      list: (q?: Paged<EmailFilterParams>) => list<EmailMessage>("/emails", q),
      markRead: (id: EntityId) => send<EmailMessage>("POST", `/emails/${id}/read`),
    },
    briefing: {
      today: () => get<DailyBriefing>("/briefing/today"),
      generate: (i: DailyBriefingGenerateRequest = {}) => send<DailyBriefing>("POST", "/briefing/generate", i),
    },
    timeEntries: {
      list: (q?: Paged<TimeEntryFilterParams>) => list<TimeEntry>("/time-entries", q),
      create: (i: CreateTimeEntryInput) => send<TimeEntry>("POST", "/time-entries", i),
      stop: (id: EntityId) => send<TimeEntry>("POST", `/time-entries/${id}/stop`),
    },
    analytics: { overview: (q?: AnalyticsQueryParams) => get<AnalyticsOverview>("/analytics/overview", q) },
    integrations: {
      catalog: () => get<IntegrationCatalogEntry[]>("/integrations"),
      accounts: () => get<IntegrationAccount[]>("/integrations/accounts"),
      connect: (provider: string, i: ConnectIntegrationInput) =>
        send<IntegrationAccount>("POST", `/integrations/${provider}/connect`, i),
      disconnect: (provider: string) => send<null>("POST", `/integrations/${provider}/disconnect`),
    },
    ai: {
      chat: (i: AIChatRequest) => send<AIChatResponse>("POST", "/ai/chat", i),
      confirm: (i: AIConfirmActionRequest) => send<Task | CalendarEvent | Reminder>("POST", "/ai/actions/confirm", i),
      summarize: (i: AISummarizeRequest) => send<AIResponse>("POST", "/ai/summarize", i),
    },
    health: () => get<HealthStatus>("/health"),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
