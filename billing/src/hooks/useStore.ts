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
import { useBusinessMode } from "@/contexts/BusinessModeContext";

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
  BusinessType,
} from "@/lib/db/types";

export type UseAsyncDataOptions = {
  /** Cache key for deduplication and stale-while-revalidate. Omit to disable cache. */
  cacheKey?: string;
  /** When false, skip initial fetch (lazy). Call refetch() to load. Default true. */
  enabled?: boolean;
};

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
  const { mode } = useBusinessMode();
  return useAsyncData<Company | null>(
    () => getCompanyAsync(mode),
    [mode],
    { cacheKey: `company-${mode}`, ...options }
  );
}

// ============================================================
// PRODUCTS
// ============================================================

export function useProducts(options?: UseAsyncDataOptions) {
  const { mode } = useBusinessMode();
  return useAsyncData<Product[]>(
    () => getProductsAsync(mode),
    [mode],
    { cacheKey: `products-${mode}`, ...options }
  );
}

export function useProduct(id: string, options?: UseAsyncDataOptions) {
  return useAsyncData<Product | null>(
    () => getProductAsync(id),
    [id],
    { cacheKey: id ? `product-${id}` : undefined, ...options }
  );
}

// ============================================================
// CUSTOMERS
// ============================================================

export function useCustomers(options?: UseAsyncDataOptions) {
  const { mode } = useBusinessMode();
  return useAsyncData<Customer[]>(
    () => getCustomersAsync(mode),
    [mode],
    { cacheKey: `customers-${mode}`, ...options }
  );
}

export function useCustomer(id: string, options?: UseAsyncDataOptions) {
  return useAsyncData<Customer | null>(
    () => getCustomerAsync(id),
    [id],
    { cacheKey: id ? `customer-${id}` : undefined, ...options }
  );
}

// ============================================================
// SUPPLIERS
// ============================================================

export function useSuppliers(options?: UseAsyncDataOptions) {
  const { mode } = useBusinessMode();
  return useAsyncData<Supplier[]>(
    () => getSuppliersAsync(mode),
    [mode],
    { cacheKey: `suppliers-${mode}`, ...options }
  );
}

export function useSupplier(id: string, options?: UseAsyncDataOptions) {
  return useAsyncData<Supplier | null>(
    () => getSupplierAsync(id),
    [id],
    { cacheKey: id ? `supplier-${id}` : undefined, ...options }
  );
}

// ============================================================
// INVOICES
// ============================================================

export function useInvoices(options?: UseAsyncDataOptions) {
  const { mode } = useBusinessMode();
  return useAsyncData<Invoice[]>(
    () => getInvoicesAsync(mode),
    [mode],
    { cacheKey: `invoices-${mode}`, ...options }
  );
}

export function useInvoice(id: string, options?: UseAsyncDataOptions) {
  return useAsyncData<Invoice | null>(
    () => getInvoiceAsync(id),
    [id],
    { cacheKey: id ? `invoice-${id}` : undefined, ...options }
  );
}

export function useInvoiceItems(invoiceId?: string, options?: UseAsyncDataOptions) {
  const { mode } = useBusinessMode();
  return useAsyncData<InvoiceItem[]>(
    () => getInvoiceItemsAsync(mode, invoiceId),
    [mode, invoiceId],
    { cacheKey: invoiceId ? `invoiceItems-${invoiceId}` : `invoiceItems-${mode}`, ...options }
  );
}

// ============================================================
// PURCHASE INVOICES
// ============================================================

export function usePurchaseInvoices(options?: UseAsyncDataOptions) {
  const { mode } = useBusinessMode();
  return useAsyncData<PurchaseInvoice[]>(
    () => getPurchaseInvoicesAsync(mode),
    [mode],
    { cacheKey: `purchaseInvoices-${mode}`, ...options }
  );
}

export function usePurchaseInvoice(id: string, options?: UseAsyncDataOptions) {
  return useAsyncData<PurchaseInvoice | null>(
    () => getPurchaseInvoiceAsync(id),
    [id],
    { cacheKey: id ? `purchaseInvoice-${id}` : undefined, ...options }
  );
}

export function usePurchaseInvoiceItems(purchaseInvoiceId?: string, options?: UseAsyncDataOptions) {
  const { mode } = useBusinessMode();
  return useAsyncData<PurchaseInvoiceItem[]>(
    () => getPurchaseInvoiceItemsAsync(mode, purchaseInvoiceId),
    [mode, purchaseInvoiceId],
    { cacheKey: purchaseInvoiceId ? `purchaseInvoiceItems-${purchaseInvoiceId}` : `purchaseInvoiceItems-${mode}`, ...options }
  );
}

// ============================================================
// PAYMENTS
// ============================================================

export function usePayments(options?: UseAsyncDataOptions) {
  const { mode } = useBusinessMode();
  return useAsyncData<Payment[]>(
    () => getPaymentsAsync(mode),
    [mode],
    { cacheKey: `payments-${mode}`, ...options }
  );
}

export function usePayment(id: string, options?: UseAsyncDataOptions) {
  return useAsyncData<Payment | null>(
    () => getPaymentAsync(id),
    [id],
    { cacheKey: id ? `payment-${id}` : undefined, ...options }
  );
}

export function usePaymentAllocations(paymentId?: string, options?: UseAsyncDataOptions) {
  return useAsyncData<PaymentAllocation[]>(
    () => getPaymentAllocationsAsync(paymentId),
    [paymentId],
    { cacheKey: paymentId ? `paymentAllocations-${paymentId}` : "paymentAllocations", ...options }
  );
}

// ============================================================
// STOCK MOVEMENTS
// ============================================================

export function useStockMovements(productId?: string, options?: UseAsyncDataOptions) {
  const { mode } = useBusinessMode();
  return useAsyncData<StockMovement[]>(
    () => getStockMovementsAsync(mode, productId),
    [mode, productId],
    { cacheKey: productId ? `stockMovements-${productId}` : `stockMovements-${mode}`, ...options }
  );
}

// ============================================================
// EXPENSES
// ============================================================

export function useExpenses(options?: UseAsyncDataOptions) {
  const { mode } = useBusinessMode();
  return useAsyncData<Expense[]>(
    () => getExpensesAsync(mode),
    [mode],
    { cacheKey: `expenses-${mode}`, ...options }
  );
}

export function useExpense(id: string, options?: UseAsyncDataOptions) {
  return useAsyncData<Expense | null>(
    () => getExpenseAsync(id),
    [id],
    { cacheKey: id ? `expense-${id}` : undefined, ...options }
  );
}

// ============================================================
// COMBINED STORE DATA
// ============================================================

export function useStore(options?: UseAsyncDataOptions) {
  const { mode } = useBusinessMode();

  const getStoreAndPopulateCache = async (): Promise<StoreData> => {
    const data = await getStoreAsync(mode);
    setCached(`company-${mode}`, data.company);
    setCached(`products-${mode}`, data.products);
    setCached(`customers-${mode}`, data.customers);
    setCached(`suppliers-${mode}`, data.suppliers);
    setCached(`invoices-${mode}`, data.invoices);
    setCached(`invoiceItems-${mode}`, data.invoiceItems);
    setCached(`purchaseInvoices-${mode}`, data.purchaseInvoices);
    setCached(`purchaseInvoiceItems-${mode}`, data.purchaseInvoiceItems);
    setCached(`payments-${mode}`, data.payments);
    setCached("paymentAllocations", data.paymentAllocations);
    setCached(`stockMovements-${mode}`, data.stockMovements);
    setCached(`expenses-${mode}`, data.expenses);
    return data;
  };

  return useAsyncData<StoreData>(
    getStoreAndPopulateCache,
    [mode],
    { cacheKey: `store-${mode}`, ...options }
  );
}

// Re-export BusinessType for convenience
export type { BusinessType };
