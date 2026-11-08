# Troubleshooting

## Backend fails to start

- Check `DATABASE_URL`.
- Run `npx prisma migrate deploy`.
- Check environment variables.

## Frontend cannot reach API

- Check `NEXT_PUBLIC_API_URL`.
- Check `WEB_ORIGIN` and CORS.
- Verify API is running.

## Database connection errors

- Verify database URL.
- Check firewall/network access.
- Ensure migrations applied.

## Cold start delays

- Free services sleep after inactivity.
- Upgrade compute plan for production.

## Auth/session issues

- Verify `CSRF_SECRET` and `SESSION_SECRET`.
- Ensure frontend and backend share correct origins.
- Check cookies are sent with credentials.