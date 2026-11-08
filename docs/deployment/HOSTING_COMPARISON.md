# Hosting Comparison

Date checked: 2026-11-08.

## Project requirements

- Frontend: Next.js 15 (Node.js, React 19)
- Backend: NestJS 11 (Node.js)
- Database: PostgreSQL (Prisma)
- Optional: Redis, background workers
- Auth: cookie sessions, CSRF
- File storage: not used for user uploads in current implementation

## Platform comparison

| Platform | Free backend | Free frontend | Free PostgreSQL | Sleep | Notes |
|---|---|---|---|---|---|
| Render | Yes, 1 web service, 512 MB, 750 h/month | Static sites free | Yes, 1 GB, expires in 30 days | 15 min idle | Good for API, DB expires |
| Koyeb | Yes, 1 service, 512 MB, 0.1 vCPU | Yes | Yes, 5 h/month active, 1 GB | 1 h idle | New accounts require card hold |
| Fly.io | No free tier for new accounts | No | No | N/A | Trial only |
| Vercel | Serverless functions only | Yes, excellent | No | N/A | Best for Next.js frontend |
| Netlify | Functions limited | Yes | No | N/A | Good static/Next.js hosting |
| Cloudflare Pages | Workers separate | Yes | D1/R2 separate | N/A | Good CDN, more setup |
| Supabase | No backend hosting | No | Yes, 500 MB | N/A | Good managed Postgres |
| Neon | No backend hosting | No | Yes, 0.5 GB | N/A | Serverless Postgres |

## Recommended free architecture

- Frontend: Vercel or Cloudflare Pages
- Backend: Render free web service
- Database: Neon or Supabase free PostgreSQL
- Redis/workers: run inside backend process or disable workers on free tier
- Files: no persistent file storage needed currently

## Why not one platform for everything

Render free allows only one continuously running web service per 750 monthly hours. Running both Next.js and NestJS as separate services would exceed free limits. Vercel/Cloudflare provide free frontend hosting, so the backend can use the single free Render service.