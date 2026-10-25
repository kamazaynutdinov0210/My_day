# apps/web — Owned by AI #3 (Frontend)

Next.js (App Router) + Tailwind + TanStack Query + Zustand. Data only through `@my-day/api-client`;
types only from `@my-day/types`; shared primitives in `@my-day/ui`.

`/api/*` is rewritten to `API_URL` (see `next.config.mjs`), so the session cookie stays same-origin and HTTP-only.

Implemented: login/register, app shell (responsive nav, theme from user preference, logout),
«Мой день» (day ribbon, tasks + complete, overdue count, unread notifications).
Next: tasks, projects, calendar, notes, notifications, analytics screens; Ctrl+K command bar.
Open contract questions: `CONTRACT_REQUESTS.md`.
