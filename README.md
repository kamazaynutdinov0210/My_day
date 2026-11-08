# My Day — Personal Productivity OS

My Day is a full-stack personal productivity operating system with task management, projects, calendar, notes, reminders, notifications, analytics, integrations, AI assistant, encryption tools, password generation, and encryption history.

## Tech Stack

- Frontend: Next.js 15, React 19, Tailwind CSS
- Backend: NestJS 11, Prisma
- Database: PostgreSQL
- Shared types: `@my-day/types`
- API client: `@my-day/api-client`
- UI components: `@my-day/ui`

## Repository Structure

```text
apps/
  api/        NestJS backend
  web/        Next.js frontend
packages/
  types/      Shared TypeScript types
  api-client/ Typed REST client
  ui/         Shared UI components
  config/     Shared configuration
workers/
  reminders/
  notifications/
  analytics/
  synchronization/
prisma/
  schema.prisma
  migrations/
docs/
  deployment/
```

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm 9
- PostgreSQL
- Redis (optional, for workers)

### Install

```bash
pnpm install
```

### Environment

Copy `.env.example` to `.env` and fill values.

### Database

```bash
pnpm db:migrate
pnpm db:generate
```

### Run

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/api/docs

## Scripts

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Deployment

See `docs/deployment/` for hosting comparison, architecture, guide, mobile/PWA, security checklist, free-tier limits, and troubleshooting.

## Security

- HTTP-only sessions
- CSRF protection
- Argon2 password hashing
- Secure password recovery tokens
- User-scoped data access
- Encryption history sanitization

## License

Private project.