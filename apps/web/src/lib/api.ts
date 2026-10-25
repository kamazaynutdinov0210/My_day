import { createApiClient } from "@my-day/api-client";

const CSRF_COOKIE = "my_day_csrf";

/** The API sets a readable CSRF cookie at login/register (docs/API_CONTRACT.md section 4.3). */
function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const entry = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined;
}

// The only API entry point for apps/web. No direct fetch() calls elsewhere.
export const api = createApiClient({
  baseUrl: "/api",
  // Echoed on every request; the API only enforces it on POST/PATCH/PUT/DELETE.
  headers: (): Record<string, string> => {
    const token = readCookie(CSRF_COOKIE);
    return token ? { "X-CSRF-Token": token } : {};
  },
});
