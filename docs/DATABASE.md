# Database

Status: **Phase 1 baseline**. The executable source of truth is
`prisma/schema.prisma`; this document explains and indexes it. If the two
ever disagree, `prisma/schema.prisma` wins and this doc is out of date —
fix the doc, don't silently trust it.

## 1. Engine

PostgreSQL, accessed exclusively through Prisma. No module queries the
database through a second ORM or raw driver except narrow, reviewed
exceptions inside `apps/api` (e.g. full-text search) that still go through
Prisma's `$queryRaw` with parameterized input.

## 2. Entity map

```
User
 ├── Session[]
 ├── Task[] ───────────────┐
 ├── Project[] (owner) ────┤
 ├── ProjectMember[]       │
 ├── CalendarEvent[]       │
 ├── Note[]                │
 ├── Reminder[]            │
 ├── Notification[]        │
 ├── Tag[]                 │
 ├── ActivityLog[]         │
 ├── IntegrationAccount[]  │
 ├── Message[]             │
 ├── EmailMessage[]        │
 ├── DailyBriefing[]       │
 ├── TimeEntry[]           │
 └── AnalyticsSnapshot[]   │
                           │
Project ◄───────────────────┘
 ├── Task[]
 ├── CalendarEvent[]
 ├── Note[]
 ├── ProjectMember[]
 └── ProjectTag[] ─ Tag

Task
 ├── Project? (belongs to)
 ├── ParentTask? / Subtasks[] (self-relation)
 ├── TaskTag[] ─ Tag
 ├── TaskComment[]
 ├── Reminder[]
 └── TimeEntry[]

CalendarEvent
 ├── Project? (belongs to)
 └── Reminder[]

Integration (catalog, one row per provider)
 └── IntegrationAccount[] (per-user connection)
```

## 3. Entities (§9 of the brief)

`User`, `Session`, `Task`, `TaskComment`, `Project`, `ProjectMember`,
`CalendarEvent`, `Reminder`, `Notification`, `Note`, `Tag`, `TaskTag`,
`ProjectTag`, `ActivityLog`, `Integration`, `IntegrationAccount`,
`Message`, `EmailMessage`, `DailyBriefing`, `TimeEntry`,
`AnalyticsSnapshot` — all defined in `prisma/schema.prisma`. 21 models
total; see that file for exact fields, types, and indexes.

## 4. Notable design decisions

- **IDs**: `cuid()` everywhere, not auto-increment integers, so IDs are
  safely generated client- or server-side and don't leak row counts.
- **Soft vs. hard delete**: MVP uses hard delete with `onDelete: Cascade`
  on ownership edges (e.g. deleting a `User` cascades their data) and
  `onDelete: SetNull` where a relation is optional context (e.g. deleting
  a `Project` nulls out `Task.projectId` rather than deleting the task).
  A soft-delete (`deletedAt`) column can be added later per
  `docs/ARCHITECTURE.md` §"Changing the contract" if undo/audit needs
  grow — not introduced speculatively in Phase 1.
- **Project progress**: `Project` has no `progress` column. It is always
  derived from `COUNT(Task WHERE projectId = ... AND status = COMPLETED) /
  COUNT(Task WHERE projectId = ...)` at query time in the backend service
  layer, per §11 and §37 of the brief ("not hardcoded, no fake data").
- **Recurrence**: `recurrenceFreq` enum covers common cases; `recurrenceRule`
  stores an RFC 5545 `RRULE` string for `CUSTOM` or anything the enum can't
  express, avoiding a second recurrence table in the MVP.
- **Reminders are server-side**: `Reminder.jobId` links a row to its BullMQ
  job so the reminder survives process restarts (queue is Redis-backed);
  see `docs/EVENTS.md`. No `setTimeout`/`setInterval` reminder path exists
  in this schema or is permitted anywhere in the app (§14 of the brief).
- **Integration credentials**: `IntegrationAccount.accessTokenEnc` /
  `refreshTokenEnc` are stored encrypted at rest (encryption key from env,
  never the token itself) and are never selected into any API response —
  see `docs/INTEGRATIONS.md` §Security.
- **Idempotent sync**: `Message` and `EmailMessage` carry
  `@@unique([source, externalId])` / `@@unique([provider, externalId])` so
  repeated sync jobs upsert instead of duplicating rows.
- **Analytics**: `AnalyticsSnapshot` holds worker-precomputed aggregates
  for historical periods (`docs/EVENTS.md` analytics-aggregate job).
  "Today" figures in `/api/analytics/overview` are always computed live
  from `Task`/`CalendarEvent`/`TimeEntry`, never read from a stale
  snapshot, so the dashboard never shows a decorative or lagging number
  for the current day.
- **Timezones**: `User.timezone` defaults to `Asia/Tashkent` (§12 of the
  brief) and is user-editable. `CalendarEvent.timezone` is stored
  per-event so events created while traveling render correctly regardless
  of the viewer's current timezone.

## 5. Indexing strategy

Every foreign key used in a list/filter query has a matching `@@index`
(see `prisma/schema.prisma`, e.g. `Task@@index([userId, status])`,
`CalendarEvent@@index([userId, startAt])`,
`Notification@@index([userId, read])`). Composite indexes are ordered
`userId` first since every query is scoped to the authenticated user.

## 6. Migrations

`prisma/migrations/` is the append-only migration history, generated via
`pnpm db:migrate` (`prisma migrate dev`) in development and
`prisma migrate deploy` in CI/production. No agent hand-edits a committed
migration file; schema changes always go through a new migration.

## 7. Seeding

`prisma/seed.ts` seeds only the static `Integration` provider catalog. It
explicitly refuses to run when `NODE_ENV=production` and never creates
fake `User`/`Task`/`Project`/`AnalyticsSnapshot` rows, per §37 of the
brief ("No fake data"). Per-user demo data, if ever added, must be an
explicit opt-in flag documented separately.

## 8. Persistence guarantee

Because all state lives in PostgreSQL (entities) and Redis (BullMQ job
queue, itself backed by its own persistence/AOF configuration in
`docker-compose.yml`), a browser reload, an `apps/api` restart, or a
`workers/*` restart never loses task/project/event/reminder data or
in-flight background jobs — the central requirement in §1 of the brief.

## 9. Full-text search (Notes)

Notes use PostgreSQL full-text search through a GIN index on an expression,
created in raw SQL (`prisma/sql/notes_fts.sql`) and appended to the init
migration. The resulting index is `notes_fts_idx`.

There is deliberately **no** `tsvector` column and nothing in
`schema.prisma`. Prisma cannot model generated columns or Gin indexes on
`Unsupported` fields, and declaring them makes `prisma migrate dev` report
permanent drift (and propose dropping the index). Prisma ignores expression
indexes, so this setup stays drift-free.

Creating the init migration on a fresh database:

1. `pnpm exec prisma migrate dev --create-only --name init --schema prisma/schema.prisma`
2. Append the contents of `prisma/sql/notes_fts.sql` to the new
   `migration.sql`.
3. `pnpm exec prisma migrate dev --schema prisma/schema.prisma` to apply it,
   then run the same command again and confirm it reports no pending
   changes.

**Query rule:** the `WHERE` clause must repeat the index expression exactly,
or Postgres will not use the index.

~~~sql
SELECT id FROM notes
WHERE "userId" = $1
  AND (
    setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("content", '')), 'B')
  ) @@ websearch_to_tsquery('simple', $2);
~~~

Run it through `$queryRaw` with parameters, never string concatenation.
The `simple` configuration is used because notes mix Russian, English and
Uzbek. Global search over other entities (tasks, projects, events, messages,
emails) starts with indexed `ILIKE` and can move to the same pattern later.
