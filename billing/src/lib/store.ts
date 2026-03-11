"use client";

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
  StoreData,
} from "./db/types";

const STORAGE_KEY = "billing-mvp-data";

const defaultData: StoreData = {
  company: null,
  products: [],
  customers: [],
  suppliers: [],
  invoices: [],
  invoiceItems: [],
  purchaseInvoices: [],
  purchaseInvoiceItems: [],
  payments: [],
  paymentAllocations: [],
  stockMovements: [],
  expenses: [],
  nextInvoiceSeq: 1,
  nextReceiptSeq: 1,
};

function load(): StoreData {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const data = JSON.parse(raw) as StoreData;
    if (!data.expenses) data.expenses = [];
    if (!data.suppliers) data.suppliers = [];
    if (!data.purchaseInvoices) data.purchaseInvoices = [];
    if (!data.purchaseInvoiceItems) data.purchaseInvoiceItems = [];
    data.products = (data.products || []).map((p) => ({ ...p, costPrice: p.costPrice ?? 0 }));
    return data;
  } catch {
    return defaultData;
  }
}

function save(data: StoreData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getStore(): StoreData {
  return load();
}

export function setCompany(company: Company): void {
  const data = load();
  data.company = company;
  save(data);
}

export function getCompany(): Company | null {
  return load().company;
}

// Products
export function getProducts(): Product[] {
  return load().products;
}

export function addProduct(p: Omit<Product, "id" | "createdAt">): Product {
  const data = load();
  const product: Product = {
    ...p,
    id: "p-" + Date.now(),
    createdAt: new Date().toISOString(),
  };
  data.products.push(product);
  save(data);
  return product;
}

export function updateProduct(id: string, updates: Partial<Product>): void {
  const data = load();
  const i = data.products.findIndex((x) => x.id === id);
  if (i >= 0) {
    data.products[i] = { ...data.products[i], ...updates };
    save(data);
  }
}

export function deleteProduct(id: string): { ok: boolean; error?: string } {
  const data = load();
  const hasInvoice = data.invoiceItems.some((x) => x.productId === id);
  const hasStock = data.stockMovements.some((x) => x.productId === id);
  if (hasInvoice || hasStock) {
    return { ok: false, error: "Product has transactions and cannot be deleted." };
  }
  data.products = data.products.filter((x) => x.id !== id);
  save(data);
  return { ok: true };
}

export function getProduct(id: string): Product | undefined {
  return load().products.find((x) => x.id === id);
}

// Customers
export function getCustomers(): Customer[] {
  return load().customers;
}

export function addCustomer(c: Omit<Customer, "id" | "createdAt">): Customer {
  const data = load();
  const customer: Customer = {
    ...c,
    id: "c-" + Date.now(),
    createdAt: new Date().toISOString(),
  };
  data.customers.push(customer);
  save(data);
  return customer;
}

export function updateCustomer(id: string, updates: Partial<Customer>): void {
  const data = load();
  const i = data.customers.findIndex((x) => x.id === id);
  if (i >= 0) {
    data.customers[i] = { ...data.customers[i], ...updates };
    save(data);
  }
}

export function deleteCustomer(id: string): { ok: boolean; error?: string } {
  const data = load();
  const hasInvoice = data.invoices.some((x) => x.customerId === id);
  const hasPayment = data.payments.some((x) => x.customerId === id);
  if (hasInvoice || hasPayment) {
    return { ok: false, error: "Customer has transactions and cannot be deleted." };
  }
  data.customers = data.customers.filter((x) => x.id !== id);
  save(data);
  return { ok: true };
}

export function getCustomer(id: string): Customer | undefined {
  return load().customers.find((x) => x.id === id);
}

// Invoices
export function getInvoices(): Invoice[] {
  return load().invoices;
}

export function getInvoiceItems(invoiceId?: string): InvoiceItem[] {
  const items = load().invoiceItems;
  return invoiceId ? items.filter((x) => x.invoiceId === invoiceId) : items;
}

export function addInvoice(
  inv: Omit<Invoice, "id" | "createdAt">,
  items: Omit<InvoiceItem, "id" | "invoiceId">[]
): Invoice {
  const data = load();
  const invoice: Invoice = {
    ...inv,
    id: "inv-" + Date.now(),
    createdAt: new Date().toISOString(),
  };
  data.invoices.push(invoice);
  items.forEach((it) => {
    data.invoiceItems.push({
      ...it,
      id: "ii-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      invoiceId: invoice.id,
    });
  });
  save(data);
  return invoice;
}

export function updateInvoice(id: string, updates: Partial<Invoice>): void {
  const data = load();
  const i = data.invoices.findIndex((x) => x.id === id);
  if (i >= 0) {
    data.invoices[i] = { ...data.invoices[i], ...updates };
    save(data);
  }
}

export function getInvoice(id: string): Invoice | undefined {
  return load().invoices.find((x) => x.id === id);
}

export function getNextInvoiceSeq(fyStart: number): number {
  const data = load();
  const suffix = `${fyStart}-${(fyStart + 1) % 100}`;
  const max = data.invoices.reduce((acc, inv) => {
    if (inv.number.includes(`/${suffix}/`)) {
      const num = parseInt(inv.number.split("/").pop() || "0", 10);
      return Math.max(acc, num);
    }
    return acc;
  }, 0);
  return max + 1;
}

export function getNextReceiptSeq(fyStart: number): number {
  const data = load();
  const suffix = `${fyStart}-${(fyStart + 1) % 100}`;
  const max = data.payments.reduce((acc, p) => {
    if (p.receiptNo.includes(`/${suffix}/`)) {
      const num = parseInt(p.receiptNo.split("/").pop() || "0", 10);
      return Math.max(acc, num);
    }
    return acc;
  }, 0);
  return max + 1;
}

// Payments
export function getPayments(): Payment[] {
  return load().payments;
}

export function getPaymentAllocations(paymentId?: string): PaymentAllocation[] {
  const list = load().paymentAllocations;
  return paymentId ? list.filter((x) => x.paymentId === paymentId) : list;
}

export function addPayment(
  p: Omit<Payment, "id" | "createdAt">,
  allocations: Omit<PaymentAllocation, "id" | "paymentId">[]
): Payment {
  const data = load();
  const payment: Payment = {
    ...p,
    id: "pay-" + Date.now(),
    createdAt: new Date().toISOString(),
  };
  data.payments.push(payment);
  allocations.forEach((a) => {
    data.paymentAllocations.push({
      ...a,
      id: "pa-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      paymentId: payment.id,
    });
  });
  save(data);
  return payment;
}

export function getPayment(id: string): Payment | undefined {
  return load().payments.find((x) => x.id === id);
}

// Stock movements
export function getStockMovements(productId?: string): StockMovement[] {
  const list = load().stockMovements;
  return productId ? list.filter((x) => x.productId === productId) : list;
}

export function addStockMovement(
  m: Omit<StockMovement, "id" | "createdAt">
): StockMovement {
  const data = load();
  const movement: StockMovement = {
    ...m,
    id: "sm-" + Date.now(),
    createdAt: new Date().toISOString(),
  };
  data.stockMovements.push(movement);
  const product = data.products.find((p) => p.id === m.productId);
  if (product) {
    product.currentStock += m.quantity;
  }
  save(data);
  return movement;
}

// Expenses
export function getExpenses(): Expense[] {
  return load().expenses;
}

export function addExpense(e: Omit<Expense, "id" | "createdAt">): Expense {
  const data = load();
  const expense: Expense = {
    ...e,
    id: "exp-" + Date.now(),
    createdAt: new Date().toISOString(),
  };
  data.expenses.push(expense);
  save(data);
  return expense;
}

export function updateExpense(id: string, updates: Partial<Expense>): void {
  const data = load();
  const i = data.expenses.findIndex((x) => x.id === id);
  if (i >= 0) {
    data.expenses[i] = { ...data.expenses[i], ...updates };
    save(data);
  }
}

export function deleteExpense(id: string): void {
  const data = load();
  data.expenses = data.expenses.filter((x) => x.id !== id);
  save(data);
}

export function getExpense(id: string): Expense | undefined {
  return load().expenses.find((x) => x.id === id);
}

export function resetStore(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
