/**
 * Common API response envelope shapes.
 * Every REST endpoint in docs/API_CONTRACT.md returns one of these.
 * Do not invent a per-module response shape — see §32 "API response convention".
 */

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    /** Field-level validation errors, when code === "VALIDATION_ERROR" */
    details?: ApiValidationIssue[];
  };
}

export interface ApiValidationIssue {
  field: string;
  message: string;
}

export interface ApiMeta {
  pagination?: PaginationMeta;
  requestId?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

/** Every persisted entity's identifier is a cuid string. */
export type EntityId = string;

/** ISO-8601 timestamp string, always UTC on the wire. */
export type IsoDateTime = string;

export interface Timestamped {
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** Standard sort direction used by any list endpoint that accepts `sort`. */
export type SortDirection = "asc" | "desc";
