"use client";

/**
 * Client-side cache for API responses to avoid duplicate fetches.
 * Cache is keyed by string; entries expire after STALE_MS.
 */

const STALE_MS = 60 * 1000; // 1 minute - avoid refetching same data on navigation

const cache = new Map<string, { data: unknown; ts: number }>();

// Keys that are part of the combined "store" fetch - invalidate store when these change
const STORE_CONSTITUENT_KEYS = new Set([
  "company",
  "products",
  "customers",
  "suppliers",
  "invoices",
  "invoiceItems",
  "purchaseInvoices",
  "purchaseInvoiceItems",
  "payments",
  "paymentAllocations",
  "stockMovements",
  "expenses",
]);

export function getCached<T>(key: string): { data: T; fresh: boolean } | null {
  const entry = cache.get(key);
  if (!entry) return null;
  const fresh = Date.now() - entry.ts < STALE_MS;
  return { data: entry.data as T, fresh };
}

export function setCached(key: string, data: unknown): void {
  cache.set(key, { data, ts: Date.now() });
}

export function invalidateCache(key: string): void {
  cache.delete(key);
  // Check if key starts with any constituent key (handles mode suffixes like "stockMovements-shop")
  const baseKey = key.split("-")[0];
  if (STORE_CONSTITUENT_KEYS.has(key) || STORE_CONSTITUENT_KEYS.has(baseKey)) {
    // Invalidate all store variants (store-shop, store-factory, etc.)
    for (const k of cache.keys()) {
      if (k.startsWith("store")) cache.delete(k);
    }
  }
}

export function invalidateAll(): void {
  cache.clear();
}
