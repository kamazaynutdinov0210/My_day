import { createApiClient } from "@my-day/api-client";

// The only API entry point for apps/web. No direct fetch() calls elsewhere.
export const api = createApiClient({ baseUrl: "/api" });
