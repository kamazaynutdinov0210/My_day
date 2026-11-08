# Security Checklist

- [ ] `NODE_ENV=production`
- [ ] Strong `CSRF_SECRET` and `SESSION_SECRET`
- [ ] HTTPS enabled by hosting platform
- [ ] `WEB_ORIGIN` restricted to frontend domain
- [ ] No secrets committed to Git
- [ ] Prisma migrations applied
- [ ] Admin/debug endpoints disabled
- [ ] Rate limiting active on auth endpoints
- [ ] Recovery tokens not logged
- [ ] Encryption history stores no plaintext/keys
- [ ] User-scoped authorization verified
- [ ] CORS configured for frontend only
- [ ] Secure cookies enabled in production
- [ ] Database backups enabled if available