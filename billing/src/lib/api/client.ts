/**
 * Billing backend API client.
 * Set VITE_BILLING_API_URL (e.g. http://localhost:8000) to use the backend instead of Supabase.
 */

const BASE = import.meta.env.VITE_BILLING_API_URL ?? "";
const BILLING_PREFIX = "/billing/api/v1";

export function getBillingApiUrl(): string {
  return BASE ? `${BASE.replace(/\/$/, "")}${BILLING_PREFIX}` : "";
}

export function isBillingApiConfigured(): boolean {
  return Boolean(BASE && BASE.trim());
}

/** Fetch with credentials so HTTP-only cookies are sent. On 401, tries refresh once and retries. */
export async function billingFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${getBillingApiUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const doFetch = () =>
    fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  let res = await doFetch();
  if (res.status === 401 && !path.includes("/auth/refresh")) {
    const refreshRes = await fetch(`${getBillingApiUrl()}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (refreshRes.ok) res = await doFetch();
  }
  return res;
}

export async function billingFetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await billingFetch(path, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? res.statusText);
  }
  return res.json();
}
