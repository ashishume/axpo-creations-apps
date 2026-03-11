"use client";

/**
 * Async Store Layer - Supabase Only
 *
 * This module provides async database operations using Supabase.
 * All data is stored in the Supabase database.
 * After mutations we invalidate the data cache so list/detail views refetch.
 */

import {
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
} from "./db/types";

import {
  companyRepository,
  productRepository,
  customerRepository,
  supplierRepository,
  invoiceRepository,
  purchaseInvoiceRepository,
  paymentRepository,
  stockMovementRepository,
  expenseRepository,
} from "./db";

import { getStoreDataViaRpc } from "./db/supabase/store-rpc";
import { isBillingApiConfigured } from "./api/client";
import { invalidateCache } from "@/lib/data-cache";

// ============================================================
// COMPANY
// ============================================================

export async function getCompanyAsync(): Promise<Company | null> {
  return companyRepository.get();
}

export async function setCompanyAsync(company: Company): Promise<void> {
  await companyRepository.set(company);
  invalidateCache("company");
}

// ============================================================
// PRODUCTS
// ============================================================

export async function getProductsAsync(): Promise<Product[]> {
  return productRepository.getAll();
}

export async function getProductAsync(id: string): Promise<Product | null> {
  return productRepository.getById(id);
}

export async function addProductAsync(p: Omit<Product, "id" | "createdAt">): Promise<Product> {
  const created = await productRepository.create(p);
  invalidateCache("products");
  return created;
}

export async function updateProductAsync(id: string, updates: Partial<Product>): Promise<void> {
  await productRepository.update(id, updates);
  invalidateCache("products");
  invalidateCache(`product-${id}`);
}

export async function deleteProductAsync(id: string): Promise<{ ok: boolean; error?: string }> {
  const result = await productRepository.delete(id);
  if (result.ok) {
    invalidateCache("products");
    invalidateCache(`product-${id}`);
  }
  return result;
}

// ============================================================
// CUSTOMERS
// ============================================================

export async function getCustomersAsync(): Promise<Customer[]> {
  return customerRepository.getAll();
}

export async function getCustomerAsync(id: string): Promise<Customer | null> {
  return customerRepository.getById(id);
}

export async function addCustomerAsync(c: Omit<Customer, "id" | "createdAt">): Promise<Customer> {
  const created = await customerRepository.create(c);
  invalidateCache("customers");
  return created;
}

export async function updateCustomerAsync(id: string, updates: Partial<Customer>): Promise<void> {
  await customerRepository.update(id, updates);
  invalidateCache("customers");
  invalidateCache(`customer-${id}`);
}

export async function deleteCustomerAsync(id: string): Promise<{ ok: boolean; error?: string }> {
  const result = await customerRepository.delete(id);
  if (result.ok) {
    invalidateCache("customers");
    invalidateCache(`customer-${id}`);
  }
  return result;
}

// ============================================================
// SUPPLIERS
// ============================================================

export async function getSuppliersAsync(): Promise<Supplier[]> {
  return supplierRepository.getAll();
}

export async function getSupplierAsync(id: string): Promise<Supplier | null> {
  return supplierRepository.getById(id);
}

export async function addSupplierAsync(s: Omit<Supplier, "id" | "createdAt">): Promise<Supplier> {
  const created = await supplierRepository.create(s);
  invalidateCache("suppliers");
  return created;
}

export async function updateSupplierAsync(id: string, updates: Partial<Supplier>): Promise<void> {
  await supplierRepository.update(id, updates);
  invalidateCache("suppliers");
  invalidateCache(`supplier-${id}`);
}

export async function deleteSupplierAsync(id: string): Promise<{ ok: boolean; error?: string }> {
  const result = await supplierRepository.delete(id);
  if (result.ok) {
    invalidateCache("suppliers");
    invalidateCache(`supplier-${id}`);
  }
  return result;
}

// ============================================================
// INVOICES
// ============================================================

export async function getInvoicesAsync(): Promise<Invoice[]> {
  return invoiceRepository.getAll();
}

export async function getInvoiceAsync(id: string): Promise<Invoice | null> {
  return invoiceRepository.getById(id);
}

export async function getInvoiceItemsAsync(invoiceId?: string): Promise<InvoiceItem[]> {
  if (invoiceId) {
    return invoiceRepository.getItems(invoiceId);
  }
  return invoiceRepository.getAllItems();
}

export async function addInvoiceAsync(
  inv: Omit<Invoice, "id" | "createdAt">,
  items: Omit<InvoiceItem, "id" | "invoiceId">[]
): Promise<Invoice> {
  const created = await invoiceRepository.create(inv, items);
  invalidateCache("invoices");
  invalidateCache("invoiceItems");
  return created;
}

export async function updateInvoiceAsync(id: string, updates: Partial<Invoice>): Promise<void> {
  await invoiceRepository.update(id, updates);
  invalidateCache("invoices");
  invalidateCache(`invoice-${id}`);
  invalidateCache("invoiceItems");
  invalidateCache(`invoiceItems-${id}`);
}

export async function getNextInvoiceSeqAsync(fyStart: number): Promise<number> {
  return invoiceRepository.getNextSeq(fyStart);
}

// ============================================================
// PURCHASE INVOICES
// ============================================================

export async function getPurchaseInvoicesAsync(): Promise<PurchaseInvoice[]> {
  return purchaseInvoiceRepository.getAll();
}

export async function getPurchaseInvoiceAsync(id: string): Promise<PurchaseInvoice | null> {
  return purchaseInvoiceRepository.getById(id);
}

export async function getPurchaseInvoiceItemsAsync(purchaseInvoiceId?: string): Promise<PurchaseInvoiceItem[]> {
  if (purchaseInvoiceId) {
    return purchaseInvoiceRepository.getItems(purchaseInvoiceId);
  }
  return purchaseInvoiceRepository.getAllItems();
}

export async function addPurchaseInvoiceAsync(
  pi: Omit<PurchaseInvoice, "id" | "createdAt">,
  items: Omit<PurchaseInvoiceItem, "id" | "purchaseInvoiceId" | "createdAt">[]
): Promise<PurchaseInvoice> {
  const created = await purchaseInvoiceRepository.create(pi, items);
  invalidateCache("purchaseInvoices");
  invalidateCache("purchaseInvoiceItems");
  invalidateCache("products");
  invalidateCache("stockMovements");
  return created;
}

export async function getNextPurchaseInvoiceSeqAsync(fyStart: number): Promise<number> {
  const list = await getPurchaseInvoicesAsync();
  const fyEnd = fyStart + 1;
  const start = `${fyStart}-04-01`;
  const end = `${fyEnd}-03-31`;
  const count = list.filter((i) => i.date >= start && i.date <= end).length;
  return count + 1;
}

// ============================================================
// PAYMENTS
// ============================================================

export async function getPaymentsAsync(): Promise<Payment[]> {
  return paymentRepository.getAll();
}

export async function getPaymentAsync(id: string): Promise<Payment | null> {
  return paymentRepository.getById(id);
}

export async function getPaymentAllocationsAsync(paymentId?: string): Promise<PaymentAllocation[]> {
  return paymentRepository.getAllocations(paymentId);
}

export async function addPaymentAsync(
  p: Omit<Payment, "id" | "createdAt">,
  allocations: Omit<PaymentAllocation, "id" | "paymentId">[]
): Promise<Payment> {
  const created = await paymentRepository.create(p, allocations);
  invalidateCache("payments");
  invalidateCache("paymentAllocations");
  return created;
}

export async function getNextReceiptSeqAsync(fyStart: number): Promise<number> {
  return paymentRepository.getNextSeq(fyStart);
}

// ============================================================
// STOCK MOVEMENTS
// ============================================================

export async function getStockMovementsAsync(productId?: string): Promise<StockMovement[]> {
  return stockMovementRepository.getAll(productId);
}

export async function addStockMovementAsync(
  m: Omit<StockMovement, "id" | "createdAt">
): Promise<StockMovement> {
  const created = await stockMovementRepository.create(m);
  invalidateCache("stockMovements");
  if (m.productId) {
    invalidateCache(`stockMovements-${m.productId}`);
    invalidateCache(`product-${m.productId}`);
  }
  invalidateCache("products");
  return created;
}

// ============================================================
// EXPENSES
// ============================================================

export async function getExpensesAsync(): Promise<Expense[]> {
  return expenseRepository.getAll();
}

export async function getExpenseAsync(id: string): Promise<Expense | null> {
  return expenseRepository.getById(id);
}

export async function addExpenseAsync(e: Omit<Expense, "id" | "createdAt">): Promise<Expense> {
  const created = await expenseRepository.create(e);
  invalidateCache("expenses");
  return created;
}

export async function updateExpenseAsync(id: string, updates: Partial<Expense>): Promise<void> {
  await expenseRepository.update(id, updates);
  invalidateCache("expenses");
  invalidateCache(`expense-${id}`);
}

export async function deleteExpenseAsync(id: string): Promise<{ ok: boolean; error?: string }> {
  const result = await expenseRepository.delete(id);
  if (result.ok) {
    invalidateCache("expenses");
    invalidateCache(`expense-${id}`);
  }
  return result;
}

// ============================================================
// COMBINED DATA FETCHING (for dashboard, reports)
// ============================================================

export interface StoreData {
  company: Company | null;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  purchaseInvoices: PurchaseInvoice[];
  purchaseInvoiceItems: PurchaseInvoiceItem[];
  payments: Payment[];
  paymentAllocations: PaymentAllocation[];
  stockMovements: StockMovement[];
  expenses: Expense[];
}

export async function getStoreAsync(): Promise<StoreData> {
  if (!isBillingApiConfigured()) {
    const rpcData = await getStoreDataViaRpc();
    if (rpcData) {
      const [suppliers, purchaseInvoices, purchaseInvoiceItems] = await Promise.all([
        getSuppliersAsync(),
        getPurchaseInvoicesAsync(),
        getPurchaseInvoiceItemsAsync(),
      ]);
      return {
        ...rpcData,
        suppliers,
        purchaseInvoices,
        purchaseInvoiceItems,
      };
    }
  }

  const [
    company,
    products,
    customers,
    suppliers,
    invoices,
    invoiceItems,
    purchaseInvoices,
    purchaseInvoiceItems,
    payments,
    paymentAllocations,
    stockMovements,
    expenses,
  ] = await Promise.all([
    getCompanyAsync(),
    getProductsAsync(),
    getCustomersAsync(),
    getSuppliersAsync(),
    getInvoicesAsync(),
    getInvoiceItemsAsync(),
    getPurchaseInvoicesAsync(),
    getPurchaseInvoiceItemsAsync(),
    getPaymentsAsync(),
    getPaymentAllocationsAsync(),
    getStockMovementsAsync(),
    getExpensesAsync(),
  ]);

  return {
    company,
    products,
    customers,
    suppliers,
    invoices,
    invoiceItems,
    purchaseInvoices,
    purchaseInvoiceItems,
    payments,
    paymentAllocations,
    stockMovements,
    expenses,
  };
}
