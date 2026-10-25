export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/** Parses ?page and ?pageSize per docs/API_CONTRACT.md section 2 (defaults 1 and 20, max 100). */
export function parsePaging(page?: string | number, pageSize?: string | number) {
  const p = Number(page);
  const s = Number(pageSize);
  return {
    page: Number.isInteger(p) && p >= 1 ? p : 1,
    pageSize: Number.isInteger(s) && s >= 1 ? Math.min(s, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE,
  };
}

/** List envelope: data is the array, pagination lives in meta (API_CONTRACT.md section 1). */
export function paginated<T>(items: T[], page: number, pageSize: number, totalItems: number) {
  const pagination: PaginationMeta = {
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
  return { success: true as const, data: items, meta: { pagination } };
}
