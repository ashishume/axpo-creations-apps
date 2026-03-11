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
  BusinessType,
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

export async function getCompanyAsync(businessType: BusinessType): Promise<Company | null> {
  return companyRepository.get(businessType);
}

export async function setCompanyAsync(company: Omit<Company, "id">): Promise<void> {
  await companyRepository.set(company);
  invalidateCache(`company-${company.businessType}`);
}

// ============================================================
// PRODUCTS
// ============================================================

export async function getProductsAsync(businessType: BusinessType): Promise<Product[]> {
  return productRepository.getAll(businessType);
}

export async function getProductAsync(id: string): Promise<Product | null> {
  return productRepository.getById(id);
}

export async function addProductAsync(p: Omit<Product, "id" | "createdAt">): Promise<Product> {
  const created = await productRepository.create(p);
  invalidateCache(`products-${p.businessType}`);
  return created;
}

export async function updateProductAsync(id: string, updates: Partial<Product>): Promise<void> {
  await productRepository.update(id, updates);
  invalidateCache("products-shop");
  invalidateCache("products-factory");
  invalidateCache(`product-${id}`);
}

export async function deleteProductAsync(id: string): Promise<{ ok: boolean; error?: string }> {
  const result = await productRepository.delete(id);
  if (result.ok) {
    invalidateCache("products-shop");
    invalidateCache("products-factory");
    invalidateCache(`product-${id}`);
  }
  return result;
}

// ============================================================
// CUSTOMERS
// ============================================================

export async function getCustomersAsync(businessType: BusinessType): Promise<Customer[]> {
  return customerRepository.getAll(businessType);
}

export async function getCustomerAsync(id: string): Promise<Customer | null> {
  return customerRepository.getById(id);
}

export async function addCustomerAsync(c: Omit<Customer, "id" | "createdAt">): Promise<Customer> {
  const created = await customerRepository.create(c);
  invalidateCache(`customers-${c.businessType}`);
  return created;
}

export async function updateCustomerAsync(id: string, updates: Partial<Customer>): Promise<void> {
  await customerRepository.update(id, updates);
  invalidateCache("customers-shop");
  invalidateCache("customers-factory");
  invalidateCache(`customer-${id}`);
}

export async function deleteCustomerAsync(id: string): Promise<{ ok: boolean; error?: string }> {
  const result = await customerRepository.delete(id);
  if (result.ok) {
    invalidateCache("customers-shop");
    invalidateCache("customers-factory");
    invalidateCache(`customer-${id}`);
  }
  return result;
}

// ============================================================
// SUPPLIERS
// ============================================================

export async function getSuppliersAsync(businessType: BusinessType): Promise<Supplier[]> {
  return supplierRepository.getAll(businessType);
}

export async function getSupplierAsync(id: string): Promise<Supplier | null> {
  return supplierRepository.getById(id);
}

export async function addSupplierAsync(s: Omit<Supplier, "id" | "createdAt">): Promise<Supplier> {
  const created = await supplierRepository.create(s);
  invalidateCache(`suppliers-${s.businessType}`);
  return created;
}

export async function updateSupplierAsync(id: string, updates: Partial<Supplier>): Promise<void> {
  await supplierRepository.update(id, updates);
  invalidateCache("suppliers-shop");
  invalidateCache("suppliers-factory");
  invalidateCache(`supplier-${id}`);
}

export async function deleteSupplierAsync(id: string): Promise<{ ok: boolean; error?: string }> {
  const result = await supplierRepository.delete(id);
  if (result.ok) {
    invalidateCache("suppliers-shop");
    invalidateCache("suppliers-factory");
    invalidateCache(`supplier-${id}`);
  }
  return result;
}

// ============================================================
// INVOICES
// ============================================================

export async function getInvoicesAsync(businessType: BusinessType): Promise<Invoice[]> {
  return invoiceRepository.getAll(businessType);
}

export async function getInvoiceAsync(id: string): Promise<Invoice | null> {
  return invoiceRepository.getById(id);
}

export async function getInvoiceItemsAsync(businessType: BusinessType, invoiceId?: string): Promise<InvoiceItem[]> {
  if (invoiceId) {
    return invoiceRepository.getItems(invoiceId);
  }
  return invoiceRepository.getAllItems(businessType);
}

export async function addInvoiceAsync(
  inv: Omit<Invoice, "id" | "createdAt">,
  items: Omit<InvoiceItem, "id" | "invoiceId">[]
): Promise<Invoice> {
  const created = await invoiceRepository.create(inv, items);
  invalidateCache(`invoices-${inv.businessType}`);
  invalidateCache(`invoiceItems-${inv.businessType}`);
  return created;
}

export async function updateInvoiceAsync(id: string, updates: Partial<Invoice>): Promise<void> {
  await invoiceRepository.update(id, updates);
  invalidateCache("invoices-shop");
  invalidateCache("invoices-factory");
  invalidateCache(`invoice-${id}`);
  invalidateCache("invoiceItems-shop");
  invalidateCache("invoiceItems-factory");
  invalidateCache(`invoiceItems-${id}`);
}

export async function getNextInvoiceSeqAsync(fyStart: number, businessType: BusinessType): Promise<number> {
  return invoiceRepository.getNextSeq(fyStart, businessType);
}

// ============================================================
// PURCHASE INVOICES
// ============================================================

export async function getPurchaseInvoicesAsync(businessType: BusinessType): Promise<PurchaseInvoice[]> {
  return purchaseInvoiceRepository.getAll(businessType);
}

export async function getPurchaseInvoiceAsync(id: string): Promise<PurchaseInvoice | null> {
  return purchaseInvoiceRepository.getById(id);
}

export async function getPurchaseInvoiceItemsAsync(businessType: BusinessType, purchaseInvoiceId?: string): Promise<PurchaseInvoiceItem[]> {
  if (purchaseInvoiceId) {
    return purchaseInvoiceRepository.getItems(purchaseInvoiceId);
  }
  return purchaseInvoiceRepository.getAllItems(businessType);
}

export async function addPurchaseInvoiceAsync(
  pi: Omit<PurchaseInvoice, "id" | "createdAt">,
  items: Omit<PurchaseInvoiceItem, "id" | "purchaseInvoiceId" | "createdAt">[]
): Promise<PurchaseInvoice> {
  const created = await purchaseInvoiceRepository.create(pi, items);
  invalidateCache(`purchaseInvoices-${pi.businessType}`);
  invalidateCache(`purchaseInvoiceItems-${pi.businessType}`);
  invalidateCache(`products-${pi.businessType}`);
  invalidateCache(`stockMovements-${pi.businessType}`);
  return created;
}

export async function getNextPurchaseInvoiceSeqAsync(fyStart: number, businessType: BusinessType): Promise<number> {
  const list = await getPurchaseInvoicesAsync(businessType);
  const fyEnd = fyStart + 1;
  const start = `${fyStart}-04-01`;
  const end = `${fyEnd}-03-31`;
  const count = list.filter((i) => i.date >= start && i.date <= end).length;
  return count + 1;
}

// ============================================================
// PAYMENTS
// ============================================================

export async function getPaymentsAsync(businessType: BusinessType): Promise<Payment[]> {
  return paymentRepository.getAll(businessType);
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
  invalidateCache(`payments-${p.businessType}`);
  invalidateCache("paymentAllocations");
  return created;
}

export async function getNextReceiptSeqAsync(fyStart: number, businessType: BusinessType): Promise<number> {
  return paymentRepository.getNextSeq(fyStart, businessType);
}

// ============================================================
// STOCK MOVEMENTS
// ============================================================

export async function getStockMovementsAsync(businessType: BusinessType, productId?: string): Promise<StockMovement[]> {
  return stockMovementRepository.getAll(businessType, productId);
}

export async function addStockMovementAsync(
  m: Omit<StockMovement, "id" | "createdAt">
): Promise<StockMovement> {
  const created = await stockMovementRepository.create(m);
  invalidateCache(`stockMovements-${m.businessType}`);
  if (m.productId) {
    invalidateCache(`stockMovements-${m.productId}`);
    invalidateCache(`product-${m.productId}`);
  }
  invalidateCache(`products-${m.businessType}`);
  return created;
}

// ============================================================
// EXPENSES
// ============================================================

export async function getExpensesAsync(businessType: BusinessType): Promise<Expense[]> {
  return expenseRepository.getAll(businessType);
}

export async function getExpenseAsync(id: string): Promise<Expense | null> {
  return expenseRepository.getById(id);
}

export async function addExpenseAsync(e: Omit<Expense, "id" | "createdAt">): Promise<Expense> {
  const created = await expenseRepository.create(e);
  invalidateCache(`expenses-${e.businessType}`);
  return created;
}

export async function updateExpenseAsync(id: string, updates: Partial<Expense>): Promise<void> {
  await expenseRepository.update(id, updates);
  invalidateCache("expenses-shop");
  invalidateCache("expenses-factory");
  invalidateCache(`expense-${id}`);
}

export async function deleteExpenseAsync(id: string): Promise<{ ok: boolean; error?: string }> {
  const result = await expenseRepository.delete(id);
  if (result.ok) {
    invalidateCache("expenses-shop");
    invalidateCache("expenses-factory");
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

export async function getStoreAsync(businessType: BusinessType): Promise<StoreData> {
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
    getCompanyAsync(businessType),
    getProductsAsync(businessType),
    getCustomersAsync(businessType),
    getSuppliersAsync(businessType),
    getInvoicesAsync(businessType),
    getInvoiceItemsAsync(businessType),
    getPurchaseInvoicesAsync(businessType),
    getPurchaseInvoiceItemsAsync(businessType),
    getPaymentsAsync(businessType),
    getPaymentAllocationsAsync(),
    getStockMovementsAsync(businessType),
    getExpensesAsync(businessType),
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
