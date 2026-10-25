import type { ApiMeta, ApiResponse, ApiValidationIssue, PaginationMeta } from "@my-day/types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: ApiValidationIssue[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
  get isUnauthorized(): boolean {
    return this.status === 401 || this.code === "UNAUTHORIZED";
  }
  /** Field-level message from a VALIDATION_ERROR, if any. */
  fieldError(field: string): string | undefined {
    return this.details.find((d) => d.field === field)?.message;
  }
}

export interface HttpOptions {
  /** Same-origin by default: Next.js rewrites /api to the backend, so the HTTP-only cookie just works. */
  baseUrl?: string;
  fetch?: typeof fetch;
  /** Extra headers per request (e.g. a CSRF token, once the contract defines one). */
  headers?: () => Record<string, string>;
  onUnauthorized?: (error: ApiError) => void;
}

export interface Page<T> {
  items: T[];
  pagination: PaginationMeta;
}

/** Arrays are sent as repeated keys (?status=A&status=B); null/undefined are skipped. */
export function toSearchParams(query?: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries((query ?? {}) as Record<string, unknown>)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
    else params.append(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function createHttp(opts: HttpOptions = {}) {
  const baseUrl = (opts.baseUrl ?? "/api").replace(/\/$/, "");
  const doFetch: typeof fetch = opts.fetch ?? ((...args) => fetch(...args));

  async function request<T>(
    method: string,
    path: string,
    init: { query?: object; body?: unknown } = {},
  ): Promise<{ data: T; meta: ApiMeta | undefined }> {
    let res: Response;
    try {
      res = await doFetch(`${baseUrl}${path}${toSearchParams(init.query)}`, {
        method,
        credentials: "include",
        headers: {
          Accept: "application/json",
          ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...opts.headers?.(),
        },
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      });
    } catch {
      throw new ApiError(0, "NETWORK_ERROR", "Не удалось связаться с сервером");
    }

    let json: ApiResponse<T> | undefined;
    try {
      json = (await res.json()) as ApiResponse<T>;
    } catch {
      json = undefined;
    }

    if (json?.success === true) return { data: json.data, meta: json.meta };

    const err = json?.success === false ? json.error : undefined;
    const error = new ApiError(
      res.status,
      err?.code ?? (res.status === 401 ? "UNAUTHORIZED" : "INTERNAL_ERROR"),
      err?.message ?? `HTTP ${res.status}`,
      err?.details ?? [],
    );
    if (error.isUnauthorized) opts.onUnauthorized?.(error);
    throw error;
  }

  return { request };
}
