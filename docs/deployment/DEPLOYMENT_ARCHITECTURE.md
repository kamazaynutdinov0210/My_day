# Deployment Architecture

## Recommended free/low-cost architecture

```text
User Browser / Mobile Browser / PWA
        |
        v
Vercel or Cloudflare Pages (Next.js frontend)
        |
        v
Render Free Web Service (NestJS API)
        |
        v
Neon or Supabase Free PostgreSQL
```

## Components

- Frontend: Next.js app from `apps/web`
- Backend: NestJS app from `apps/api`
- Database: PostgreSQL via Prisma
- Optional Redis/workers: not required for core functionality; can run inside backend process if needed

## Data flow

1. User opens frontend URL.
2. Frontend calls `/api/*`.
3. Next.js rewrites `/api/*` to backend API URL.
4. Backend validates session/CSRF and accesses PostgreSQL.
5. Response returns to frontend.

## Notes

- HTTPS is provided by hosting platforms.
- No user file uploads are used, so no object storage is required.
- Free Render web service sleeps after 15 minutes of inactivity.
- Free Render Postgres expires after 30 days; use Neon/Supabase for longer retention.