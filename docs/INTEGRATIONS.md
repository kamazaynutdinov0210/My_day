# Integrations

Status: **Phase 1 baseline** (architecture only — adapters are AI #5's
implementation work, post-MVP per §47 of the brief except where noted).

## 1. Principle

External services are never wired directly into the dashboard or core
business logic. Everything goes through the adapter architecture below, so
`apps/web`/`apps/api` core modules depend only on
`IntegrationProvider` (from `packages/types`), never on a vendor SDK
(§25, §26 of the brief).

```
interface IntegrationProvider {
  connect(userId, authCode): Promise<void>;
  disconnect(userId): Promise<void>;
  getStatus(userId): Promise<IntegrationAccount>;
}
```
Specialized interfaces extend it: `CalendarSyncProvider` (adds
`syncEvents`), `MessagingProvider` (adds `sendMessage`). Both are defined
in `packages/types/src/integration.ts`.

## 2. Supported providers (catalog)

Google Calendar, Gmail, Microsoft Outlook, Telegram, Slack, Discord,
GitHub, Notion, Google Drive — enumerated in
`IntegrationProviderType` (`packages/types/src/enums.ts`) and seeded into
the `Integration` catalog table (`prisma/seed.ts`).

## 3. Directory layout

```
apps/api/src/modules/integrations/
├── google/
├── microsoft/
├── telegram/
├── slack/
├── discord/
├── github/
├── notion/
├── drive/
└── ai/           # AI provider adapters live alongside, see AI_CONTRACT.md
```
Each provider directory implements `IntegrationProvider` (and any
applicable specialized interface) as its own NestJS provider, registered
behind the generic interface so the rest of the app never imports a
provider-specific class directly.

## 4. OAuth

Providers that require it (Google, Microsoft, Slack, Discord, GitHub,
Notion) use OAuth 2.0 authorization-code flow. Client id/secret and
redirect URI are backend-only env vars (`.env.example`). The frontend only
ever sees:

1. A "connect" link/button that opens the provider's consent screen.
2. A redirect back to `apps/api`, which exchanges the code and stores
   encrypted tokens — never returning them to the client.
3. `IntegrationAccount.status` polled/read via `/api/integrations/accounts`.

Telegram uses bot-token + webhook registration instead of user-facing
OAuth; the bot token lives only in `TELEGRAM_BOT_TOKEN`.

## 5. Security

- `IntegrationAccount.accessTokenEnc` / `refreshTokenEnc` are encrypted at
  rest using a backend-only encryption key (not the raw OAuth token) and
  are excluded from every Prisma `select` used in API responses.
- Webhook endpoints (`POST /api/integrations/:provider/webhook`) verify a
  provider-specific signature/secret (e.g. `TELEGRAM_WEBHOOK_SECRET`,
  Slack signing secret) before enqueuing `integrations.webhook`
  (`docs/EVENTS.md`); unverified payloads are rejected with `401`, not
  processed.
- Sync and webhook processing never grant the provider write access to
  more of the user's account than the requested OAuth `scope`.

## 6. Sync model

Two paths populate local data from a provider:

1. **Poll**: `integrations.sync` BullMQ job runs on a schedule per
   `IntegrationAccount`, calling the adapter's `syncEvents`/equivalent
   method and upserting rows (`Message`, `EmailMessage`,
   `CalendarEvent`) using the provider's `externalId` for idempotency.
2. **Webhook**: where the provider supports push (Slack, GitHub, Telegram,
   Notion), `integrations.webhook` processes the payload immediately
   instead of waiting for the next poll.

`IntegrationAccount.lastSyncedAt` / `lastError` are updated after every
attempt so `/api/integrations/accounts` reflects real, current status —
never a hardcoded "connected."

## 7. MVP scope note

Per §47 of the brief, the MVP ships Authentication, Dashboard, Tasks,
Projects, Calendar, Notes, Reminders, Notifications, Analytics, and a
Basic AI Assistant without third-party integrations wired up end-to-end.
This document and the `IntegrationProvider` contract exist in Phase 1 so
Backend AI builds the `IntegrationAccount`/`Integration` data model and
generic module shape correctly from the start; individual provider
adapters (Gmail, Google Calendar, Outlook, Telegram, Slack, GitHub,
Notion) are implemented post-MVP by Integrations AI against this same
contract, without schema or API changes.
