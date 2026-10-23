# My Day — Backend Core (AI #2)

This package implements the NestJS backend core owned by AI #2.

## Scope

Authentication and secure HTTP-only sessions, authorization by resource ownership/project membership, users, tasks, projects, calendar events, notes, notifications, REST controllers, DTO validation, Prisma access, and activity logging.

## Security baseline

- Session token is stored only in an HTTP-only `my_day_session` cookie.
- Only a SHA-256 hash of the session token is stored in PostgreSQL.
- Session expiry is enforced server-side.
- State-changing authenticated requests require a CSRF header validated against the current server-side session.
- Passwords use Argon2id via `argon2`.
- Global throttling is enabled through NestJS Throttler.
- DTOs use class-validator with global whitelist + forbidNonWhitelisted validation.
- Credentials are expected through environment variables, never bundled into the client.

## Provisional backend contract expectations

The source assumes the Architect phase provides Prisma models named:

`User`, `Session`, `Task`, `Project`, `ProjectMember`, `CalendarEvent`, `Note`, `Notification`, `ActivityLog`.

The implementation also assumes the following ownership fields exist where needed: `Task.userId`, `CalendarEvent.userId`, `Note.userId`, `Notification.userId`, and a `Project.members` relation to `ProjectMember` with `ProjectMember.userId` and `role`.

These are integration assumptions only; the Architect-owned schema remains the source of truth and must replace any mismatch before merge.

## Validation status in this environment

`pnpm install` could not be executed because the environment could not resolve `registry.npmjs.org`. Consequently, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` could not be completed here. They must run in the target repository after dependencies and the Architect-owned Prisma/shared contracts are present.
