# My Day — Architecture

Status: **Phase 1 (Architecture) — approved baseline**
Owner: AI #1 (Architect / Tech Lead)

This document, together with `docs/API_CONTRACT.md`, `docs/DATABASE.md`,
`docs/EVENTS.md`, `docs/INTEGRATIONS.md`, `docs/AI_CONTRACT.md` and
`packages/types/`, is the **single source of truth** for the system. No AI
agent may introduce a competing model of `Task`, `Project`, `Event`, `User`,
`Notification`, an API response shape, an enum, or an integration interface.
If reality needs to diverge from this document, follow "Changing the
contract" below — a silent, incompatible change is treated as a defect.

## 1. Goal

My Day is a single-user-per-account, multi-agent-built personal productivity
operating system. It persists tasks, projects, calendar events, notes,
reminders, messages, integrations, activity history, and analytics in
PostgreSQL, and remains fully consistent across browser reloads, backend
restarts, and re-logins. It is a real application with a full request
lifecycle (frontend → API → backend → database → background processing →
integrations/AI → analytics → visualization → notification/action), not a
static mockup.

## 2. Fixed technology stack

This stack is fixed. No agent substitutes an alternative without going
through "Changing the contract."

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Frontend data fetching | TanStack Query |
| Frontend state | Zustand |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Cache / Queue | Redis, BullMQ |
| API style | REST, documented via OpenAPI/Swagger |
| Charts | Recharts |
| Auth | HTTP-only secure session cookies (no client-side session storage) |
| Infra | Docker, Docker Compose |
| Testing | Vitest (unit/integration), Playwright (E2E) |
| Package manager | pnpm |
| Monorepo | Turborepo |

Explicitly disallowed substitutions: MongoDB/Mongoose for
PostgreSQL/Prisma, Express for NestJS, Redux for Zustand, any other
data-fetching library for TanStack Query, npm/yarn for pnpm, any other
monorepo tool for Turborepo, ECharts for Recharts, any other queue library
for BullMQ. Additional libraries may be added only when they solve a
concrete technical need and do not conflict with this architecture.

## 3. Multi-agent model

The system is built by multiple independent AI agents, each with a fixed
role, working area, and explicit dependencies (§5 below and
`docs/DEVELOPMENT.md`). No individual agent decides the stack, the
architecture, the API shape, the database structure, or module boundaries —
those are defined centrally here. Agents work in separate git branches
(`docs/DEVELOPMENT.md` §Git strategy) and coordinate only through the
committed contracts (this doc, the API contract, the database schema, and
`packages/types`).

## 4. Monorepo structure

```
my-day/
├── apps/
│   ├── web/                        # AI #3 — Next.js frontend
│   └── api/                        # AI #2 — NestJS backend
│       └── src/modules/integrations/<provider>/   # AI #5
├── packages/
│   ├── ui/                         # AI #3 — shared shadcn/ui components
│   ├── types/                      # AI #1 — shared TypeScript contracts
│   ├── api-client/                 # AI #3 (contract by AI #1) — typed REST client
│   ├── config/                     # AI #1 — shared eslint/tsconfig/tailwind config
│   └── shared/                     # AI #1 + all — pure framework-agnostic utilities
├── workers/
│   ├── notifications/              # AI #4
│   ├── reminders/                  # AI #4
│   ├── synchronization/            # AI #4 (calls into AI #5 provider adapters)
│   └── analytics/                  # AI #4 (calls into AI #6 aggregation logic)
├── prisma/
│   ├── schema.prisma                # AI #1 — source of truth for persistence
│   ├── migrations/
│   └── seed.ts                      # local dev only, never production data
├── docs/                            # AI #1 (this directory)
├── docker/                          # AI #8
├── tests/                           # AI #8 (cross-cutting) + per-module tests colocated
├── .env.example
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```

No agent creates an alternative top-level structure inside its own task.

## 5. Agent roles and boundaries

| # | Role | Works in | Owns |
|---|---|---|---|
| 1 | Architect / Tech Lead | `docs/`, `packages/types/`, `prisma/schema.prisma`, `turbo.json`, workspace config | Architecture, contracts, module boundaries, conventions |
| 2 | Backend Core | `apps/api/` | Auth, Users, Tasks, Projects, Calendar, Notes, Notifications (API), REST API, business logic, Prisma services, validation |
| 3 | Frontend | `apps/web/`, `packages/ui/` | Dashboard, layout, navigation, all entity UIs, command bar, forms, modals, responsive/accessible design |
| 4 | Workers / Background | `workers/` | Reminders, notification dispatch, recurring jobs, morning briefing scheduling, sync jobs, retries |
| 5 | Integrations | `apps/api/src/modules/integrations/<provider>/` | Google, Microsoft, Telegram, Slack, Discord, GitHub, Notion, Drive adapters; OAuth; webhooks |
| 6 | Analytics / Visualization | `apps/api` analytics module + `apps/web` analytics UI | Aggregation, statistics, KPIs, Recharts visualizations, all figures computed from real data |
| 7 | AI Assistant | `apps/api` AI module | Provider abstraction, NL commands, AI chat, summarization, briefing generation, permissioned tools |
| 8 | QA / Security / DevOps | `docker/`, `tests/`, CI config | Tests at all levels, security audit, Docker, health checks, logging, deployment validation, cross-module integration verification |

Module ownership detail is in the table in the project brief (§39) and is
authoritative alongside this list. An agent avoids editing files owned by
another agent's area; cross-cutting changes go through the contract-change
process below.

## 6. Contract-first development

Key interfaces (`Task`, `Project`, `CalendarEvent`, `User`, `Notification`,
API response envelopes, enums, `IntegrationProvider`, `AIProvider`) are
defined once, in `packages/types/` (and mirrored in `prisma/schema.prisma`
for persisted entities), and consumed everywhere. Frontend, backend,
analytics, workers, and AI modules do not declare incompatible local models
of the same entity.

## 7. Changing the contract

If an agent determines that the API, a shared type, or the database model
must change:

1. Identify the need for the change.
2. Describe the change (what, why, blast radius).
3. Update the relevant contract doc(s) (`API_CONTRACT.md`, `DATABASE.md`,
   `EVENTS.md`, `INTEGRATIONS.md`, or `AI_CONTRACT.md`).
4. Update `packages/types/` to match.
5. Update dependent modules.
6. Update tests.
7. Run typecheck.
8. Run build.

A breaking change shipped without updating the contract is a defect, not a
judgment call.

## 8. Data lifecycle

Every feature is expected to carry data through the full lifecycle:

```
User input → Frontend → API → Backend → Database
    → Background processing → Integrations / AI
    → Analytics → Visualization → Notification / Action
```

A feature is not "done" per a single layer implementing it — see
`docs/DEVELOPMENT.md` §Definition of Done.

## 9. Non-negotiable restrictions

No agent introduces a second backend, a second database, a second API, a
duplicate `Task`/`Project`/`User` model, duplicate authentication,
browser-only (non-persisted) reminders, primary data storage in
`localStorage`, API keys in frontend bundles, fabricated/hardcoded
analytics or counters, or a direct embed of an external provider SDK into
an unrelated module. No agent silently changes the API contract or the
database schema.

## 10. Extensibility

The architecture is intentionally additive: Finance, Habits, Time
Tracking, Pomodoro, Contacts/CRM, Files, Documents, Bookmarks, a personal
knowledge base, automation, and further AI agents should be addable later
without rewriting the core system — new Prisma models, new
`packages/types` modules, new NestJS modules, new BullMQ queues, and new
Next.js routes, following the same contract-first process.
