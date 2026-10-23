# API Contract

Status: **Phase 1 baseline** — endpoints below define the MVP surface
(§47 of the project brief). Backend AI implements against this; any
deviation follows `docs/ARCHITECTURE.md` §"Changing the contract."

Base path: `/api`. All request/response bodies are JSON. All timestamps on
the wire are ISO-8601 UTC strings (`IsoDateTime` in `packages/types`).

## 1. Response envelope

Every endpoint returns one of the two shapes below
(`ApiResponse<T>` in `packages/types/src/common.ts`). No module defines a
different shape.

**Success**
```json
{
  "success": true,
  "data": { "...": "..." },
  "meta": {
    "pagination": { "page": 1, "pageSize": 20, "totalItems": 42, "totalPages": 3 },
    "requestId": "..."
  }
}
```
`meta` and `meta.pagination` are present only where relevant (list endpoints).

**Error**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": [{ "field": "title", "message": "must not be empty" }]
  }
}
```

Standard `error.code` values: `VALIDATION_ERROR`, `UNAUTHORIZED`,
`FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`.
HTTP status codes follow convention (400, 401, 403, 404, 409, 429, 500)
and always pair with the matching `error.code`.

## 2. Pagination

List endpoints accept `?page=1&pageSize=20` (`PaginationParams`) and return
`meta.pagination` (`PaginationMeta`). Defaults: `page=1`, `pageSize=20`,
max `pageSize=100`.

## 3. Identifiers and timestamps

All resource IDs are opaque `cuid` strings (`EntityId`). All
`createdAt`/`updatedAt`/date-time fields are `IsoDateTime`.

## 4. Authentication

Session-based, HTTP-only secure cookie (`docs/ARCHITECTURE.md` §2, §29 of
the brief). No endpoint accepts or returns a bearer token in the JSON body.

```
POST   /api/auth/register        { AuthRegisterInput }        → AuthSessionResult
POST   /api/auth/login           { AuthLoginInput }            → AuthSessionResult
POST   /api/auth/logout          –                              → { success: true, data: null }
GET    /api/auth/me              –                              → User
```

## 5. Users

```
GET    /api/users/me                                            → User
PATCH  /api/users/me              { UpdateUserSettingsInput }   → User
```

## 6. Tasks

```
GET    /api/tasks                 ?TaskFilterParams + pagination → Task[]
POST   /api/tasks                 { CreateTaskInput }             → Task
GET    /api/tasks/:id                                             → Task
PATCH  /api/tasks/:id             { UpdateTaskInput }              → Task
DELETE /api/tasks/:id                                              → { success: true, data: null }
POST   /api/tasks/:id/complete                                    → Task
GET    /api/tasks/:id/comments                                    → TaskComment[]
POST   /api/tasks/:id/comments    { body: string }                → TaskComment
```

## 7. Projects

```
GET    /api/projects              ?ProjectFilterParams + pagination → Project[]
POST   /api/projects              { CreateProjectInput }             → Project
GET    /api/projects/:id                                              → Project
PATCH  /api/projects/:id          { UpdateProjectInput }              → Project
DELETE /api/projects/:id                                              → { success: true, data: null }
GET    /api/projects/:id/tasks    ?TaskFilterParams + pagination     → Task[]
```
`Project.progressPercent` is always computed server-side from related
Task rows at read time — never accepted as client input.

## 8. Calendar

```
GET    /api/calendar/events       ?CalendarEventFilterParams          → CalendarEvent[]
POST   /api/calendar/events       { CreateCalendarEventInput }        → CalendarEvent
GET    /api/calendar/events/:id                                        → CalendarEvent
PATCH  /api/calendar/events/:id   { UpdateCalendarEventInput }        → CalendarEvent
DELETE /api/calendar/events/:id                                        → { success: true, data: null }
```
`from`/`to` are required on the list endpoint (bounded range query).

## 9. Notes

```
GET    /api/notes                 ?NoteFilterParams + pagination → Note[]
POST   /api/notes                 { CreateNoteInput }             → Note
GET    /api/notes/:id                                              → Note
PATCH  /api/notes/:id             { UpdateNoteInput }              → Note
DELETE /api/notes/:id                                              → { success: true, data: null }
```

## 10. Reminders

```
GET    /api/reminders             ?status,taskId,eventId + pagination → Reminder[]
POST   /api/reminders             { CreateReminderInput }              → Reminder
PATCH  /api/reminders/:id         { UpdateReminderInput }              → Reminder
DELETE /api/reminders/:id                                               → { success: true, data: null }
```
Creating/updating a reminder enqueues/reschedules the corresponding BullMQ
job (`docs/EVENTS.md`) in the same request — never relies on client-side
timers.

## 11. Notifications

```
GET    /api/notifications         ?NotificationFilterParams + pagination → Notification[]
GET    /api/notifications/unread-count                                     → { count: number }
POST   /api/notifications/:id/read                                        → Notification
POST   /api/notifications/read-all                                        → { success: true, data: null }
```

## 12. Tags

```
GET    /api/tags                                                 → Tag[]
POST   /api/tags                  { CreateTagInput }             → Tag
DELETE /api/tags/:id                                              → { success: true, data: null }
```

## 13. Activity log

```
GET    /api/activity              ?ActivityLogFilterParams + pagination → ActivityLogEntry[]
```
Read-only; entries are written internally by services, never by direct
client POST.

## 14. Search

```
GET    /api/search?q=...          → {
  tasks: Task[]; projects: Project[]; events: CalendarEvent[];
  notes: Note[]; messages: Message[]; emails: EmailMessage[];
}
```
MVP is substring/full-text search over PostgreSQL columns. Semantic/AI
search is a documented future extension (§13, §26 of the brief), added as
a new endpoint version, not a silent change to this one.

## 15. Messages / Email

```
GET    /api/messages              ?MessageFilterParams + pagination   → Message[]
POST   /api/messages/:id/read                                          → Message
GET    /api/emails                ?EmailFilterParams + pagination     → EmailMessage[]
POST   /api/emails/:id/read                                            → EmailMessage
```
Populated by sync jobs (`docs/EVENTS.md`), never created directly by the
frontend.

## 16. Daily briefing

```
GET    /api/briefing/today                                             → DailyBriefing
POST   /api/briefing/generate     { DailyBriefingGenerateRequest }    → DailyBriefing
```

## 17. Time tracking

```
GET    /api/time-entries          ?taskId,from,to + pagination        → TimeEntry[]
POST   /api/time-entries          { CreateTimeEntryInput }             → TimeEntry
POST   /api/time-entries/:id/stop                                     → TimeEntry
```

## 18. Analytics

```
GET    /api/analytics/overview    ?AnalyticsQueryParams                → AnalyticsOverview
```
Every figure returned is computed from real `Task`/`CalendarEvent`/
`TimeEntry`/`AnalyticsSnapshot` rows — no decorative or hardcoded numbers
(§20, §37 of the brief).

## 19. Integrations

```
GET    /api/integrations                                               → IntegrationCatalogEntry[]
GET    /api/integrations/accounts                                      → IntegrationAccount[]
POST   /api/integrations/:provider/connect   { ConnectIntegrationInput } → IntegrationAccount
POST   /api/integrations/:provider/disconnect                          → { success: true, data: null }
POST   /api/integrations/:provider/webhook   (raw provider payload)    → 200 OK (see docs/INTEGRATIONS.md)
```

## 20. AI

```
POST   /api/ai/chat               { AIChatRequest }                    → AIChatResponse
POST   /api/ai/actions/confirm    { AIConfirmActionRequest }           → Task | CalendarEvent | Reminder
POST   /api/ai/summarize          { AISummarizeRequest }               → AIResponse
```
`AIProposedAction` from `/api/ai/chat` is never auto-applied; the client
must call `/api/ai/actions/confirm` with `confirmed: true` (§23 of the
brief).

## 21. Health

```
GET    /api/health                → { status: "ok", db: "ok" | "error", redis: "ok" | "error" }
```
Used by Docker health checks (`docker-compose.yml`).

## 22. Rate limiting

All mutating endpoints (`POST`/`PATCH`/`DELETE`) are subject to per-user
rate limiting (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` in `.env.example`).
Exceeding the limit returns `429` with `error.code = "RATE_LIMITED"`.

## 23. OpenAPI/Swagger

`apps/api` exposes live Swagger UI at `/api/docs` and a machine-readable
spec at `/api/docs-json`, generated from NestJS decorators, kept in sync
with this document by Backend AI as endpoints are implemented.
