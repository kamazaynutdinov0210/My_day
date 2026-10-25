# Contract change requests from Frontend AI (AI #3) → Architect AI (AI #1)

Raised per `docs/ARCHITECTURE.md` §7. Nothing below was changed silently: the frontend
works with the current contract and states the assumption it made.

1. **CSRF transport is not specified.** `.env.example` has `CSRF_SECRET`, but `API_CONTRACT.md`
   does not say how the token reaches the client (header name, bootstrap endpoint or cookie).
   `api-client` exposes `headers?: () => Record<string,string>` so it can be added without a rewrite.
2. **Array query params.** Not specified how `status[]`, `tagIds[]`, `category[]` are encoded.
   Assumption: repeated keys (`?status=TODO&status=IN_PROGRESS`).
3. **Inline response shapes without a shared type:** `/search`, `/notifications/unread-count`, `/health`.
   Currently declared in `packages/api-client/src/types.ts`; should move to `packages/types`.
4. **Task ordering.** No `position`/`sortOrder` field or `sort` param on `Task`, so drag & drop can move a
   card between status columns (PATCH `status`) but cannot persist order inside a column. Same for list sorting (§10).
5. **Analytics for heatmap / distribution / workload (§20).** `AnalyticsOverview` has only `trend` and totals.
   Needs per-day/hour activity and distribution fields (Analytics AI #6 to propose).
6. **`:provider` path casing** for `/integrations/:provider/connect` (`GOOGLE` vs `google`) is not defined.
7. **`parentTaskId: null` filter** ("root tasks only") cannot be expressed in a query string; needs an explicit flag.
8. **Dashboard counters** ("unread messages", etc.) have no count endpoint. The UI uses
   `meta.pagination.totalItems` from list calls with `pageSize=1`.
