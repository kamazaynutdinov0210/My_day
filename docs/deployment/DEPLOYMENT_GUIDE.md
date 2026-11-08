# Deployment Guide

## 1. Prepare environment

- Copy `.env.example` to `.env` locally for reference only.
- Do not commit real secrets.
- Set production values in hosting dashboard.

Required production variables:

```env
NODE_ENV=production
APP_URL=https://your-frontend-domain
API_URL=https://your-backend-domain
DATABASE_URL=postgresql://...
CSRF_SECRET=long-random-secret
SESSION_SECRET=long-random-secret
WEB_ORIGIN=https://your-frontend-domain
```

Optional:

```env
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM=noreply@...
OPENAI_API_KEY=...
```

## 2. Deploy database

Use Neon or Supabase free PostgreSQL.

1. Create a PostgreSQL database.
2. Copy `DATABASE_URL`.
3. Run migrations:

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
```

## 3. Deploy backend to Render

1. Create Render account.
2. Connect GitHub repository.
3. Create Web Service.
4. Root directory: `apps/api` is not enough because workspace root is repo root. Use repo root and set commands.
5. Build command:

```bash
pnpm install && pnpm --filter @my-day/api build
```

6. Start command:

```bash
node apps/api/dist/main.js
```

7. Add environment variables.
8. Deploy.

## 4. Deploy frontend to Vercel

1. Import GitHub repository into Vercel.
2. Framework preset: Next.js.
3. Root directory: `apps/web`.
4. Add environment variable:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain/api
```

5. Deploy.

## 5. Configure CORS

Set `WEB_ORIGIN=https://your-frontend-domain` in backend.

## 6. Verify

- Open frontend URL.
- Register/login.
- Check `/api/health`.
- Create task/project/note.
- Test encryption and history.
- Open on mobile browser.