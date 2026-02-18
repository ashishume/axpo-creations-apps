/**
 * Repository interfaces for database abstraction.
 * Allows switching between different database backends (Supabase, PostgreSQL, etc.)
 */

import type {
  Company,
  Product,
  Customer,
  Invoice,
  InvoiceItem,
  Payment,
  PaymentAllocation,
  StockMovement,
  Expense,
} from "./types";

// Generic repository interface
export interface Repository<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Omit<T, "id" | "createdAt">): Promise<T>;
  update(id: string, data: Partial<T>): Promise<void>;
  delete(id: string): Promise<{ ok: boolean; error?: string }>;
}

// Company repository (singleton pattern - only one company)
export interface CompanyRepository {
  get(): Promise<Company | null>;
  set(data: Omit<Company, "id">): Promise<Company>;
}

// Product repository with stock operations
export interface ProductRepository extends Repository<Product> {
  updateStock(id: string, quantity: number): Promise<void>;
}

// Customer repository
export interface CustomerRepository extends Repository<Customer> {
  getByPhone(phone: string): Promise<Customer | null>;
}

// Invoice repository with line items
export interface InvoiceRepository {
  getAll(): Promise<Invoice[]>;
  getById(id: string): Promise<Invoice | null>;
  create(
    invoice: Omit<Invoice, "id" | "createdAt">,
    items: Omit<InvoiceItem, "id" | "invoiceId">[]
  ): Promise<Invoice>;
  update(id: string, data: Partial<Invoice>): Promise<void>;
  getItems(invoiceId: string): Promise<InvoiceItem[]>;
  getAllItems(): Promise<InvoiceItem[]>;
  getNextSeq(fyStart: number): Promise<number>;
}

// Payment repository with allocations
export interface PaymentRepository {
  getAll(): Promise<Payment[]>;
  getById(id: string): Promise<Payment | null>;
  create(
    payment: Omit<Payment, "id" | "createdAt">,
    allocations: Omit<PaymentAllocation, "id" | "paymentId">[]
  ): Promise<Payment>;
  getAllocations(paymentId?: string): Promise<PaymentAllocation[]>;
  getNextSeq(fyStart: number): Promise<number>;
}

// Stock movement repository
export interface StockMovementRepository {
  getAll(productId?: string): Promise<StockMovement[]>;
  create(data: Omit<StockMovement, "id" | "createdAt">): Promise<StockMovement>;
}

// Expense repository
export interface ExpenseRepository extends Repository<Expense> {
  // Add expense-specific methods here if needed
  getByCategory?(category: string): Promise<Expense[]>;
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
  invoices: InvoiceRepository;
  payments: PaymentRepository;
  stockMovements: StockMovementRepository;
  expenses: ExpenseRepository;
  auth: AuthRepository;
  subscriptions: SubscriptionRepository;
}
