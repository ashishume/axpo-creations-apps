// Data types for Axpo Billing MVP (local state)

/** Business type for separating Shop and Factory data */
export type BusinessType = "shop" | "factory";

/** Product category; free-form (e.g. Ceramic Tiles, Vitrified Tiles). */
export type ProductType = string;

export interface Company {
  id: string;
  name: string;
  address: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  logoPath: string;
  financialYearStart: number; // e.g. 2024 for FY 2024-25
  stateCode: string; // for GST intrastate check
  businessType: BusinessType;
}

export interface Product {
  id: string;
  name: string;
  productType: ProductType;
  hsn: string;
  gstRate: number; // 5, 6, 8, 9, 10, 12, 16, 18, or 1 for CESS
  unit: string;
  sellingPrice: number;
  costPrice: number; // per piece, for margin/profit (optional in UI, default 0)
  currentStock: number;
  businessType: BusinessType;
  createdAt: string;
}

export type CustomerType = "Dealer" | "Contractor" | "Retail" | "Builder" | "Customer";

/** Standard customer types used throughout the app */
export const CUSTOMER_TYPES: CustomerType[] = ["Dealer", "Contractor", "Retail", "Builder", "Customer"];

export interface Customer {
  id: string;
  name: string;
  customerType: CustomerType;
  phone: string;
  gstin: string;
  billingAddress: string;
  shippingAddress: string;
  openingBalance: number;
  creditDays: number; // 0, 7, 15, 30, 60
  creditLimit: number;
  stateCode: string; // for GST
  businessType: BusinessType;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  gstin: string;
  address: string;
  stateCode: string;
  openingBalance: number;
  creditDays: number;
  creditLimit: number;
  businessType: BusinessType;
  createdAt: string;
}

export type InvoiceStatus = "draft" | "final" | "cancelled";

export interface Invoice {
  id: string;
  number: string;
  date: string;
  customerId: string;
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff: number;
  total: number;
  totalInWords: string;
  status: InvoiceStatus;
  cancelReason: string;
  businessType: BusinessType;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  quantity: number;
  rate: number;
  costPrice?: number; // cost per piece at time of sale (for COGS)
  discount: number;
  lineTotal: number;
  taxableAmount: number;
  gstAmount: number;
}

export type PurchaseInvoiceStatus = "draft" | "final" | "cancelled";

export interface PurchaseInvoice {
  id: string;
  number: string;
  date: string;
  supplierId: string;
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff: number;
  total: number;
  totalInWords: string;
  status: PurchaseInvoiceStatus;
  businessType: BusinessType;
  createdAt: string;
}

export interface PurchaseInvoiceItem {
  id: string;
  purchaseInvoiceId: string;
  productId: string;
  quantity: number;
  rate: number;
  discount: number;
  lineTotal: number;
  taxableAmount: number;
  gstAmount: number;
  createdAt: string;
}

export type PaymentMode = "cash" | "cheque" | "online";

export interface Payment {
  id: string;
  receiptNo: string;
  date: string;
  customerId: string;
  amount: number;
  mode: PaymentMode;
  chequeNo: string;
  chequeDate: string;
  bankName: string;
  referenceNo: string;
  businessType: BusinessType;
  createdAt: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
}

export type StockMovementType = "opening" | "production" | "purchase" | "sale" | "adjustment";

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  quantity: number; // + in, - out
  type: StockMovementType;
  referenceId: string | null; // invoice id for sale
  remarks: string;
  businessType: BusinessType;
  createdAt: string;
}

export type ExpenseCategory =
  | "Labour"
  | "Raw material"
  | "Fuel"
  | "Electricity"
  | "Maintenance"
  | "Rent"
  | "Other";

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  businessType: BusinessType;
  createdAt: string;
}

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
  nextInvoiceSeq: number; // per financial year
  nextReceiptSeq: number;
}
