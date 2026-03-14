/**
 * Pagination helper for Teaching API.
 * Backend caps page size at MAX_PAGE_SIZE (100), so "get all" must fetch multiple pages.
 */
import { teachingFetchJson } from './client';

const BACKEND_PAGE_SIZE = 100;

export interface PaginatedApiResponse<T = Record<string, unknown>> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Fetches all pages from a paginated list endpoint and returns concatenated items.
 * Use for getAll() / getBySession() so export and full-list flows get complete data.
 */
export async function fetchAllPages<T, R>(
  path: string,
  mapItem: (raw: T) => R
): Promise<R[]> {
  const out: R[] = [];
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${path}${sep}limit=${BACKEND_PAGE_SIZE}&offset=${offset}`;
    const res = await teachingFetchJson<PaginatedApiResponse<T>>(url);
    const items = res?.items ?? [];
    out.push(...items.map(mapItem));
    hasMore = res?.has_more ?? false;
    offset += res?.limit ?? BACKEND_PAGE_SIZE;
    if (items.length === 0) break;
  }
  return out;
}
