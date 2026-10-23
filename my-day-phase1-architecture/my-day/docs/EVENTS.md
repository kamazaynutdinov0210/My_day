# Events / Background Jobs

Status: **Phase 1 baseline**. Owned structurally by AI #1 (Architect);
implemented by AI #4 (Workers). Payload types live in
`packages/types/src/events.ts` and are shared by producers (`apps/api`)
and consumers (`workers/*`) — no queue may use an ad hoc, undocumented
payload shape.

## 1. Why Redis + BullMQ

All scheduled and background work — reminders, notifications, recurring
task/event generation, the morning briefing, external sync, webhook
processing, and analytics aggregation — runs as BullMQ jobs backed by
Redis, per §15 of the brief. This is required specifically so jobs survive
an `apps/api` or `workers/*` restart; `setTimeout`/`setInterval` is never
an acceptable substitute anywhere in this codebase (§14, §45).

## 2. Queues

| Queue name | Worker | Payload type | Producer |
|---|---|---|---|
| `reminders.due` | `workers/reminders` | `ReminderDueJobPayload` | `apps/api` (on reminder create/update, schedules a delayed job for `remindAt`) |
| `notifications.dispatch` | `workers/notifications` | `NotificationDispatchJobPayload` | `apps/api` services (on any event that creates a `Notification` row) |
| `tasks.recurring.generate` | `workers/reminders` (shares recurrence logic) | `RecurringTaskGenerateJobPayload` | scheduled repeat job, one per recurring `Task` |
| `events.recurring.generate` | `workers/reminders` | `RecurringEventGenerateJobPayload` | scheduled repeat job, one per recurring `CalendarEvent` |
| `briefing.morning` | `workers/reminders` (briefing sub-processor) | `MorningBriefingJobPayload` | daily cron-style repeatable job per user, at the user's local morning time in their `timezone` |
| `integrations.sync` | `workers/synchronization` | `IntegrationSyncJobPayload` | scheduled poll per connected `IntegrationAccount`, plus on-demand after `connect` |
| `integrations.webhook` | `workers/synchronization` | `WebhookProcessJobPayload` | `apps/api` webhook controllers enqueue immediately, verify + process async |
| `analytics.aggregate` | `workers/analytics` | `AnalyticsAggregateJobPayload` | scheduled job per user per period (day rollup nightly, week/month rollups on schedule) |
| `ai.background` | `workers/analytics` or a future `workers/ai` split | `AIBackgroundJobPayload` | `apps/api` AI module, for non-interactive AI work (AI-generated briefing text, note summarization, productivity analysis) |

## 3. Job conventions

- **Idempotency**: any job whose effect can be double-triggered (sync,
  webhook processing, recurring generation) must be safe to run twice —
  enforced via the `@@unique` constraints in `prisma/schema.prisma`
  (`Message`, `EmailMessage`) or an explicit existence check before
  create.
- **Retries/backoff**: all queues are configured with BullMQ's exponential
  backoff and a bounded `attempts` count; jobs that exhaust retries land
  in the queue's failed set rather than being silently dropped.
- **Logging**: every processor logs job id, queue name, and outcome
  (success/failure/retry) so failures are traceable without opening Redis
  directly.
- **Cancellation**: `Reminder.jobId` and equivalent stored job references
  let `apps/api` remove/reschedule a BullMQ job when the underlying
  `Reminder`/recurring `Task`/`CalendarEvent` is edited or deleted, so
  stale jobs never fire.

## 4. Domain event → side effect map

| Trigger | Immediate DB write | Enqueued job(s) |
|---|---|---|
| `Task` created | `Task` row, `ActivityLog(TASK_CREATED)` | — |
| `Task` completed | `Task.status = COMPLETED`, `completedAt`, `ActivityLog(TASK_COMPLETED)` | `analytics.aggregate` (debounced) |
| `Reminder` created | `Reminder` row, `ActivityLog(REMINDER_CREATED)` | `reminders.due` (delayed until `remindAt`) |
| `Reminder` fires | `Reminder.status = SENT`, `sentAt` | `notifications.dispatch` |
| `CalendarEvent` created/moved | `CalendarEvent` row, `ActivityLog(EVENT_CREATED \| EVENT_MOVED)` | reschedule any linked `reminders.due` jobs |
| `IntegrationAccount` connected | `IntegrationAccount.status = CONNECTED`, `ActivityLog(INTEGRATION_CONNECTED)` | `integrations.sync` (immediate) |
| Provider webhook received | — (validated first) | `integrations.webhook` |
| Every morning per user | — | `briefing.morning` → writes `DailyBriefing` row → `notifications.dispatch` |
| Nightly | — | `analytics.aggregate` per active user for the prior day |

This table is illustrative of the contract, not exhaustive; Backend AI and
Workers AI extend it as features are implemented, updating this file in
the same change per `docs/ARCHITECTURE.md` §"Changing the contract."

## 5. Not yet in scope (documented, not built)

Real-time push (WebSocket/SSE) for notifications is not part of the MVP;
the frontend polls `/api/notifications/unread-count` via TanStack Query.
Adding push is an additive architecture change, not a Phase 1 concern.
