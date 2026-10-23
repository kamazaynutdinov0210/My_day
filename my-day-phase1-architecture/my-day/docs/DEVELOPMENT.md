# Development Workflow

## 1. Prerequisites

Node.js ≥ 20, pnpm, Docker + Docker Compose. Copy `.env.example` to `.env`
and fill in local values before running anything (`docker compose up`
brings up Postgres/Redis with matching defaults for local dev).

## 2. Common commands

```
pnpm install
pnpm db:generate     # prisma generate
pnpm db:migrate       # prisma migrate dev
pnpm db:seed          # prisma/seed.ts — local dev catalog only
pnpm dev              # turbo run dev (web + api + workers, per turbo.json)
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm docker:up / pnpm docker:down
```

## 3. Git strategy (§41 of the brief)

Each agent works in its own branch:

```
feature/architecture
feature/backend-core
feature/frontend
feature/workers
feature/integrations
feature/analytics
feature/ai
feature/qa-devops
```

No two agents work simultaneously in one shared, uncommitted working
tree. Branches merge only after "Validation before merge" passes.

## 4. Validation before merge (§42 of the brief)

Every agent runs, and must pass, before merging:

```
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Plus any integration/E2E tests relevant to the changed module.

## 5. Definition of done (§43 of the brief)

A feature is done only when all of the following are true:

- Frontend implemented
- Backend implemented
- Database persistence works
- API works
- Validation exists
- Error handling exists
- Loading state exists
- Empty state exists
- Tests exist
- Build passes
- Types are compatible (frontend/backend share `packages/types`)
- Documentation is updated (the relevant `docs/*.md`)
- Secrets are not exposed (no key/token in a frontend bundle or committed file)

## 6. Reporting standard (§44 of the brief)

After finishing a task, each agent reports in this exact shape:

```
ROLE:
TASK:

IMPLEMENTED:

FILES CREATED:

FILES MODIFIED:

API CHANGES:

DATABASE CHANGES:

SHARED TYPE CHANGES:

EVENT CHANGES:

DEPENDENCIES ADDED:

ENVIRONMENT VARIABLES:

TESTS ADDED:

VALIDATION RESULTS:

INTEGRATION NOTES:

KNOWN ISSUES:
```

## 7. Development phases (§46 of the brief)

1. **Architecture** — this phase. Architect AI produces `docs/`,
   `prisma/schema.prisma`, `packages/types/`, workspace config.
2. **Foundation** — monorepo apps scaffolded (Next.js app, NestJS app),
   Postgres/Redis/BullMQ wired, Docker images built for real, auth
   foundation, `packages/api-client`, `packages/ui` base.
3. **Parallel features** — Backend, Frontend, Workers, Integrations,
   Analytics, AI Assistant AIs work concurrently against the stable
   contracts from phases 1–2.
4. **Integration** — modules combined; contracts re-verified against
   actual usage.
5. **QA** — unit, integration, E2E, security, build, Docker, and
   migration verification by QA/DevOps AI.

## 8. Restrictions (§45 of the brief, restated for reference)

No agent creates an alternative tech stack, a second backend/database/API,
a duplicate `Task`/`Project` model, duplicate authentication,
browser-only persistent reminders, primary storage in `localStorage`,
frontend-exposed API keys, fake analytics, an external SDK embedded
outside its owning module, or a silent change to API/database contracts.

## 9. Known issue — Phase 1 environment

`prisma validate`/`prisma generate` could not be executed in the sandbox
used to produce this Phase 1 baseline: the Prisma CLI needs to download
query-engine binaries from `binaries.prisma.sh`, which is not on that
sandbox's network allowlist. `prisma/schema.prisma` was instead checked
with a static script for duplicate model/enum names and for every
`@relation(fields: [...])` referencing a field actually declared on the
same model (all clean — see the Architect AI's Phase 1 report). Run
`pnpm db:generate` / `npx prisma validate` in a normal dev environment
before Phase 2 work begins, as a first sanity check.
