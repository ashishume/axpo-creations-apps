/**
 * Repository interfaces for database abstraction.
 * Allows switching between different database backends (Supabase, PostgreSQL, etc.)
 */

import type {
  Company,
  Product,
  Customer,
  Supplier,
  Invoice,
  InvoiceItem,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  Payment,
  PaymentAllocation,
  StockMovement,
  Expense,
  BusinessType,
} from "./types";

// Generic repository interface
export interface Repository<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Omit<T, "id" | "createdAt">): Promise<T>;
  update(id: string, data: Partial<T>): Promise<void>;
  delete(id: string): Promise<{ ok: boolean; error?: string }>;
}

// Company repository (one per business type)
export interface CompanyRepository {
  get(businessType: BusinessType): Promise<Company | null>;
  set(data: Omit<Company, "id">): Promise<Company>;
}

// Product repository with stock operations
export interface ProductRepository {
  getAll(businessType: BusinessType): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  create(data: Omit<Product, "id" | "createdAt">): Promise<Product>;
  update(id: string, data: Partial<Product>): Promise<void>;
  delete(id: string): Promise<{ ok: boolean; error?: string }>;
  updateStock(id: string, quantity: number): Promise<void>;
}

// Customer repository
export interface CustomerRepository {
  getAll(businessType: BusinessType): Promise<Customer[]>;
  getById(id: string): Promise<Customer | null>;
  getByPhone(phone: string, businessType: BusinessType): Promise<Customer | null>;
  create(data: Omit<Customer, "id" | "createdAt">): Promise<Customer>;
  update(id: string, data: Partial<Customer>): Promise<void>;
  delete(id: string): Promise<{ ok: boolean; error?: string }>;
}

// Supplier repository
export interface SupplierRepository {
  getAll(businessType: BusinessType): Promise<Supplier[]>;
  getById(id: string): Promise<Supplier | null>;
  create(data: Omit<Supplier, "id" | "createdAt">): Promise<Supplier>;
  update(id: string, data: Partial<Supplier>): Promise<void>;
  delete(id: string): Promise<{ ok: boolean; error?: string }>;
}

// Invoice repository with line items
export interface InvoiceRepository {
  getAll(businessType: BusinessType): Promise<Invoice[]>;
  getById(id: string): Promise<Invoice | null>;
  create(
    invoice: Omit<Invoice, "id" | "createdAt">,
    items: Omit<InvoiceItem, "id" | "invoiceId">[]
  ): Promise<Invoice>;
  update(id: string, data: Partial<Invoice>): Promise<void>;
  getItems(invoiceId: string): Promise<InvoiceItem[]>;
  getAllItems(businessType: BusinessType): Promise<InvoiceItem[]>;
  getNextSeq(fyStart: number, businessType: BusinessType): Promise<number>;
}

// Purchase invoice repository
export interface PurchaseInvoiceRepository {
  getAll(businessType: BusinessType): Promise<PurchaseInvoice[]>;
  getById(id: string): Promise<PurchaseInvoice | null>;
  create(
    purchaseInvoice: Omit<PurchaseInvoice, "id" | "createdAt">,
    items: Omit<PurchaseInvoiceItem, "id" | "purchaseInvoiceId" | "createdAt">[]
  ): Promise<PurchaseInvoice>;
  update(id: string, data: Partial<PurchaseInvoice>): Promise<void>;
  getItems(purchaseInvoiceId: string): Promise<PurchaseInvoiceItem[]>;
  getAllItems(businessType: BusinessType): Promise<PurchaseInvoiceItem[]>;
}

// Payment repository with allocations
export interface PaymentRepository {
  getAll(businessType: BusinessType): Promise<Payment[]>;
  getById(id: string): Promise<Payment | null>;
  create(
    payment: Omit<Payment, "id" | "createdAt">,
    allocations: Omit<PaymentAllocation, "id" | "paymentId">[]
  ): Promise<Payment>;
  getAllocations(paymentId?: string): Promise<PaymentAllocation[]>;
  getNextSeq(fyStart: number, businessType: BusinessType): Promise<number>;
}

// Stock movement repository
export interface StockMovementRepository {
  getAll(businessType: BusinessType, productId?: string): Promise<StockMovement[]>;
  create(data: Omit<StockMovement, "id" | "createdAt">): Promise<StockMovement>;
}

// Expense repository
export interface ExpenseRepository {
  getAll(businessType: BusinessType): Promise<Expense[]>;
  getById(id: string): Promise<Expense | null>;
  create(data: Omit<Expense, "id" | "createdAt">): Promise<Expense>;
  update(id: string, data: Partial<Expense>): Promise<void>;
  delete(id: string): Promise<{ ok: boolean; error?: string }>;
  getByCategory?(category: string, businessType: BusinessType): Promise<Expense[]>;
}

// User and subscription types for auth
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  subscriptionId?: string;
  createdAt: string;
}

export type BillingInterval = "monthly" | "quarterly";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  /** Billing interval for paid plans; free has no interval. */
  billingInterval?: BillingInterval;
  features: string[];
  limits: {
    invoicesPerMonth?: number;
    productsLimit?: number;
    customersLimit?: number;
  };
  createdAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: "active" | "cancelled" | "expired";
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

// Auth repository
export interface AuthRepository {
  signIn(email: string, password: string): Promise<User | null>;
  signUp(email: string, password: string, name: string): Promise<User | null>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}

// Subscription repository
export interface SubscriptionRepository {
  getPlans(): Promise<SubscriptionPlan[]>;
  getUserSubscription(userId: string): Promise<UserSubscription | null>;
  subscribe(userId: string, planId: string): Promise<UserSubscription>;
  cancel(subscriptionId: string): Promise<void>;
}

// Combined database interface
export interface Database {
  company: CompanyRepository;
  products: ProductRepository;
  customers: CustomerRepository;
  suppliers: SupplierRepository;
  invoices: InvoiceRepository;
  purchaseInvoices: PurchaseInvoiceRepository;
  payments: PaymentRepository;
  stockMovements: StockMovementRepository;
  expenses: ExpenseRepository;
  auth: AuthRepository;
  subscriptions: SubscriptionRepository;
}
