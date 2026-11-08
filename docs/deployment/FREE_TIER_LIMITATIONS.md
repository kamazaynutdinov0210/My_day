# Free Tier Limitations

## Render free web service

- 512 MB RAM
- Spins down after 15 minutes idle
- 750 instance hours/month
- No persistent disk
- Restart possible at any time

## Render free Postgres

- 1 GB storage
- Expires after 30 days
- Not recommended for long-term production

## Koyeb free

- 1 free web service
- 512 MB RAM, 0.1 vCPU
- 5 hours/month active Postgres
- Scales to zero after 1 hour
- No workers on free tier
- Card hold required for new accounts

## Recommended free database

- Neon or Supabase free PostgreSQL for longer retention

## Consequences

- Cold starts after idle
- No background workers on fully free tier
- Free database limits may require upgrade for production use