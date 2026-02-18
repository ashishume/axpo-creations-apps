/**
 * Teaching backend API client.
 * Set VITE_TEACHING_API_URL (e.g. http://localhost:8000) to use the backend instead of Supabase.
 */

const BASE = import.meta.env.VITE_TEACHING_API_URL ?? '';
const TEACHING_PREFIX = '/teaching/api/v1';

export function getTeachingApiUrl(): string {
  return BASE ? `${BASE.replace(/\/$/, '')}${TEACHING_PREFIX}` : '';
}

export function isTeachingApiConfigured(): boolean {
  return Boolean(BASE && BASE.trim());
}

/** Fetch with credentials so HTTP-only cookies are sent. On 401, tries refresh once and retries. */
export async function teachingFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${getTeachingApiUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const doFetch = () =>
    fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  let res = await doFetch();
  if (res.status === 401 && !path.includes('/auth/refresh')) {
    const refreshRes = await fetch(`${getTeachingApiUrl()}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (refreshRes.ok) res = await doFetch();
  }
  return res;
}

export async function teachingFetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await teachingFetch(path, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? res.statusText);
  }
  return res.json();
}
