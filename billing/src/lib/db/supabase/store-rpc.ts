/**
 * Single RPC call to fetch all store data. Use when the get_store_data() function
 * is deployed in Supabase; otherwise getStoreAsync falls back to Promise.all of individual fetches.
 */

import { supabase } from "./client";
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
} from "../types";

export interface StoreDataRpc {
  company: Company | null;
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  payments: Payment[];
  paymentAllocations: PaymentAllocation[];
  stockMovements: StockMovement[];
  expenses: Expense[];
}

function mapCompany(d: Record<string, unknown> | null): Company | null {
  if (!d || typeof d !== "object") return null;
  return {
    id: d.id as string,
    name: d.name as string,
    address: d.address as string,
    gstin: d.gstin as string,
    pan: d.pan as string,
    phone: d.phone as string,
    email: d.email as string,
    bankName: (d.bank_name as string) ?? "",
    bankAccount: (d.bank_account as string) ?? "",
    bankIfsc: (d.bank_ifsc as string) ?? "",
    logoPath: (d.logo_path as string) ?? "",
    financialYearStart: (d.financial_year_start as number) ?? new Date().getFullYear(),
    stateCode: (d.state_code as string) ?? "",
  };
}

function mapProduct(d: Record<string, unknown>): Product {
  return {
    id: d.id as string,
    name: d.name as string,
    productType: d.product_type as Product["productType"],
    hsn: d.hsn as string,
    gstRate: d.gst_rate as number,
    unit: d.unit as string,
    sellingPrice: d.selling_price as number,
    costPrice: ((d.cost_price as number) ?? 0) as number,
    currentStock: d.current_stock as number,
    createdAt: d.created_at as string,
  };
}

function mapCustomer(d: Record<string, unknown>): Customer {
  return {
    id: d.id as string,
    name: d.name as string,
    customerType: d.customer_type as Customer["customerType"],
    phone: d.phone as string,
    gstin: (d.gstin as string) ?? "",
    billingAddress: (d.billing_address as string) ?? "",
    shippingAddress: (d.shipping_address as string) ?? "",
    openingBalance: ((d.opening_balance as number) ?? 0) as number,
    creditDays: ((d.credit_days as number) ?? 0) as number,
    creditLimit: ((d.credit_limit as number) ?? 0) as number,
    stateCode: (d.state_code as string) ?? "",
    createdAt: d.created_at as string,
  };
}

function mapInvoice(d: Record<string, unknown>): Invoice {
  return {
    id: d.id as string,
    number: d.number as string,
    date: d.date as string,
    customerId: d.customer_id as string,
    subtotal: d.subtotal as number,
    discount: d.discount as number,
    taxableAmount: d.taxable_amount as number,
    cgstAmount: d.cgst_amount as number,
    sgstAmount: d.sgst_amount as number,
    igstAmount: d.igst_amount as number,
    roundOff: d.round_off as number,
    total: d.total as number,
    totalInWords: d.total_in_words as string,
    status: d.status as Invoice["status"],
    cancelReason: (d.cancel_reason as string) ?? "",
    createdAt: d.created_at as string,
  };
}

function mapInvoiceItem(d: Record<string, unknown>): InvoiceItem {
  return {
    id: d.id as string,
    invoiceId: d.invoice_id as string,
    productId: d.product_id as string,
    quantity: d.quantity as number,
    rate: d.rate as number,
    costPrice: (d.cost_price as number) ?? 0,
    discount: d.discount as number,
    lineTotal: d.line_total as number,
    taxableAmount: d.taxable_amount as number,
    gstAmount: d.gst_amount as number,
  };
}

function mapPayment(d: Record<string, unknown>): Payment {
  return {
    id: d.id as string,
    receiptNo: d.receipt_no as string,
    date: d.date as string,
    customerId: d.customer_id as string,
    amount: d.amount as number,
    mode: d.mode as Payment["mode"],
    chequeNo: (d.cheque_no as string) ?? "",
    chequeDate: (d.cheque_date as string) ?? "",
    bankName: (d.bank_name as string) ?? "",
    referenceNo: (d.reference_no as string) ?? "",
    createdAt: d.created_at as string,
  };
}

function mapPaymentAllocation(d: Record<string, unknown>): PaymentAllocation {
  return {
    id: d.id as string,
    paymentId: d.payment_id as string,
    invoiceId: d.invoice_id as string,
    amount: d.amount as number,
  };
}

function mapStockMovement(d: Record<string, unknown>): StockMovement {
  return {
    id: d.id as string,
    date: d.date as string,
    productId: d.product_id as string,
    quantity: d.quantity as number,
    type: d.type as StockMovement["type"],
    referenceId: d.reference_id as string | null,
    remarks: (d.remarks as string) ?? "",
    createdAt: d.created_at as string,
  };
}

function mapExpense(d: Record<string, unknown>): Expense {
  return {
    id: d.id as string,
    date: d.date as string,
    category: d.category as Expense["category"],
    amount: d.amount as number,
    description: (d.description as string) ?? "",
    createdAt: d.created_at as string,
  };
}

function mapArray<T>(arr: unknown, mapper: (d: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => mapper(item as Record<string, unknown>));
}

export async function getStoreDataViaRpc(): Promise<StoreDataRpc | null> {
  const { data, error } = await supabase.rpc("get_store_data").single();

  if (error || data == null) return null;

  const raw = data as Record<string, unknown>;
  return {
    company: mapCompany((raw.company as Record<string, unknown>) ?? null),
    products: mapArray(raw.products, mapProduct),
    customers: mapArray(raw.customers, mapCustomer),
    invoices: mapArray(raw.invoices, mapInvoice),
    invoiceItems: mapArray(raw.invoice_items, mapInvoiceItem),
    payments: mapArray(raw.payments, mapPayment),
    paymentAllocations: mapArray(raw.payment_allocations, mapPaymentAllocation),
    stockMovements: mapArray(raw.stock_movements, mapStockMovement),
    expenses: mapArray(raw.expenses, mapExpense),
  };
}
