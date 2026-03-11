"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getCompanyAsync,
  getProductsAsync,
  getProductAsync,
  getCustomersAsync,
  getCustomerAsync,
  getSuppliersAsync,
  getSupplierAsync,
  getInvoicesAsync,
  getInvoiceAsync,
  getInvoiceItemsAsync,
  getPurchaseInvoicesAsync,
  getPurchaseInvoiceAsync,
  getPurchaseInvoiceItemsAsync,
  getPaymentsAsync,
  getPaymentAsync,
  getPaymentAllocationsAsync,
  getStockMovementsAsync,
  getExpensesAsync,
  getExpenseAsync,
  getStoreAsync,
  type StoreData,
} from "@/lib/store-async";
import { getCached, setCached, invalidateCache } from "@/lib/data-cache";

import type {
  Company,
  Customer,
  Expense,
  Invoice,
  InvoiceItem,
  Payment,
  PaymentAllocation,
  Product,
  StockMovement,
  Supplier,
  PurchaseInvoice,
  PurchaseInvoiceItem,
} from "@/lib/db/types";

export type UseAsyncDataOptions = {
  /** Cache key for deduplication and stale-while-revalidate. Omit to disable cache. */
  cacheKey?: string;
  /** When false, skip initial fetch (lazy). Call refetch() to load. Default true. */
  enabled?: boolean;
};

// Generic hook for async data fetching with optional cache and lazy loading
function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: UseAsyncDataOptions = {}
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
  const { cacheKey, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (cacheKey) {
      const cached = getCached<T>(cacheKey);
      if (cached?.fresh) {
        setData(cached.data);
        setLoading(false);
        setError(null);
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      if (cacheKey) setCached(cacheKey, result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(() => {
    if (cacheKey) invalidateCache(cacheKey);
    fetch();
  }, [cacheKey, fetch]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetch();
  }, [enabled, fetch]);

  return { data, loading, error, refetch };
}

// ============================================================
// COMPANY
// ============================================================

export function useCompany(options?: UseAsyncDataOptions) {
  return useAsyncData<Company | null>(getCompanyAsync, [], { cacheKey: "company", ...options });
}

// ============================================================
// PRODUCTS
// ============================================================

export function useProducts(options?: UseAsyncDataOptions) {
  return useAsyncData<Product[]>(getProductsAsync, [], { cacheKey: "products", ...options });
}

export function useProduct(id: string, options?: UseAsyncDataOptions) {
  return useAsyncData<Product | null>(() => getProductAsync(id), [id], { cacheKey: id ? `product-${id}` : undefined, ...options });
}

// ============================================================
// CUSTOMERS
// ============================================================

export function useCustomers(options?: UseAsyncDataOptions) {
  return useAsyncData<Customer[]>(getCustomersAsync, [], { cacheKey: "customers", ...options });
}

export function useCustomer(id: string, options?: UseAsyncDataOptions) {
  return useAsyncData<Customer | null>(() => getCustomerAsync(id), [id], { cacheKey: id ? `customer-${id}` : undefined, ...options });
}

// ============================================================
// SUPPLIERS
// ============================================================

export function useSuppliers(options?: UseAsyncDataOptions) {
  return useAsyncData<Supplier[]>(getSuppliersAsync, [], { cacheKey: "suppliers", ...options });
}

export function useSupplier(id: string, options?: UseAsyncDataOptions) {
  return useAsyncData<Supplier | null>(() => getSupplierAsync(id), [id], { cacheKey: id ? `supplier-${id}` : undefined, ...options });
}

// ============================================================
// INVOICES
// ============================================================

export function useInvoices(options?: UseAsyncDataOptions) {
  return useAsyncData<Invoice[]>(getInvoicesAsync, [], { cacheKey: "invoices", ...options });
}

export function useInvoice(id: string, options?: UseAsyncDataOptions) {
  return useAsyncData<Invoice | null>(() => getInvoiceAsync(id), [id], { cacheKey: id ? `invoice-${id}` : undefined, ...options });
}

export function useInvoiceItems(invoiceId?: string, options?: UseAsyncDataOptions) {
  return useAsyncData<InvoiceItem[]>(() => getInvoiceItemsAsync(invoiceId), [invoiceId], { cacheKey: invoiceId ? `invoiceItems-${invoiceId}` : "invoiceItems", ...options });
}

// ============================================================
// PURCHASE INVOICES
// ============================================================

export function usePurchaseInvoices(options?: UseAsyncDataOptions) {
  return useAsyncData<PurchaseInvoice[]>(getPurchaseInvoicesAsync, [], { cacheKey: "purchaseInvoices", ...options });
}

export function usePurchaseInvoice(id: string, options?: UseAsyncDataOptions) {
  return useAsyncData<PurchaseInvoice | null>(() => getPurchaseInvoiceAsync(id), [id], { cacheKey: id ? `purchaseInvoice-${id}` : undefined, ...options });
}

export function usePurchaseInvoiceItems(purchaseInvoiceId?: string, options?: UseAsyncDataOptions) {
  return useAsyncData<PurchaseInvoiceItem[]>(() => getPurchaseInvoiceItemsAsync(purchaseInvoiceId), [purchaseInvoiceId], { cacheKey: purchaseInvoiceId ? `purchaseInvoiceItems-${purchaseInvoiceId}` : "purchaseInvoiceItems", ...options });
}

// ============================================================
// PAYMENTS
// ============================================================

export function usePayments(options?: UseAsyncDataOptions) {
  return useAsyncData<Payment[]>(getPaymentsAsync, [], { cacheKey: "payments", ...options });
}

export function usePayment(id: string, options?: UseAsyncDataOptions) {
  return useAsyncData<Payment | null>(() => getPaymentAsync(id), [id], { cacheKey: id ? `payment-${id}` : undefined, ...options });
}

export function usePaymentAllocations(paymentId?: string, options?: UseAsyncDataOptions) {
  return useAsyncData<PaymentAllocation[]>(() => getPaymentAllocationsAsync(paymentId), [paymentId], { cacheKey: paymentId ? `paymentAllocations-${paymentId}` : "paymentAllocations", ...options });
}

// ============================================================
// STOCK MOVEMENTS
// ============================================================

export function useStockMovements(productId?: string, options?: UseAsyncDataOptions) {
  return useAsyncData<StockMovement[]>(() => getStockMovementsAsync(productId), [productId], { cacheKey: productId ? `stockMovements-${productId}` : "stockMovements", ...options });
}

// ============================================================
// EXPENSES
// ============================================================

export function useExpenses(options?: UseAsyncDataOptions) {
  return useAsyncData<Expense[]>(getExpensesAsync, [], { cacheKey: "expenses", ...options });
}

export function useExpense(id: string, options?: UseAsyncDataOptions) {
  return useAsyncData<Expense | null>(() => getExpenseAsync(id), [id], { cacheKey: id ? `expense-${id}` : undefined, ...options });
}

// ============================================================
// COMBINED STORE DATA
// ============================================================

async function getStoreAndPopulateCache(): Promise<StoreData> {
  const data = await getStoreAsync();
  setCached("company", data.company);
  setCached("products", data.products);
  setCached("customers", data.customers);
  setCached("suppliers", data.suppliers);
  setCached("invoices", data.invoices);
  setCached("invoiceItems", data.invoiceItems);
  setCached("purchaseInvoices", data.purchaseInvoices);
  setCached("purchaseInvoiceItems", data.purchaseInvoiceItems);
  setCached("payments", data.payments);
  setCached("paymentAllocations", data.paymentAllocations);
  setCached("stockMovements", data.stockMovements);
  setCached("expenses", data.expenses);
  return data;
}

export function useStore(options?: UseAsyncDataOptions) {
  return useAsyncData<StoreData>(getStoreAndPopulateCache, [], { cacheKey: "store", ...options });
}
