# apps/api — Owned by AI #2 (Backend Core)

Not implemented in Phase 1 (Architecture). This directory is reserved per
`docs/ARCHITECTURE.md` and the fixed monorepo layout.

Stack: NestJS, TypeScript, Prisma, PostgreSQL.
Integration provider adapters live under `apps/api/src/modules/integrations/<provider>/`
per the generic `IntegrationProvider` contract in `docs/INTEGRATIONS.md`.
