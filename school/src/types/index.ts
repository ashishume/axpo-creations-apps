// Subscription plan IDs: Starter (base), Premium (Axpo Assistant)
export type PlanId = "starter" | "premium" | "ai_assistant";

export type BillingInterval = "monthly" | "quarterly" | "annual";

export interface SubscriptionPlanInfo {
  id: PlanId;
  name: string;
  price: number;
  /** Price per billing interval (monthly, quarterly, annual). */
  pricing?: { monthly: number; quarterly: number; annual?: number };
  features: string[];
}

// Organization (tenant boundary; one org has many schools, pay per school)
export interface Organization {
  id: string;
  name: string;
  slug?: string;
  billingEmail?: string;
}

// School & Session
export interface School {
  id: string;
  /** Organization this school belongs to (tenant isolation). */
  organizationId?: string;
  name: string;
  address: string;
  contact: string;
  /** When true, app is locked for all users of this school except Super Admin */
  isLocked?: boolean;
  /** Subscription plan for this school. Default 'starter'. */
  planId?: PlanId;
}

export interface Session {
  id: string;
  schoolId: string;
  year: string; // e.g. "2023-2024"
  startDate: string; // ISO
  endDate: string;
  /** Day of month (1-28) when salary is due for this session. Used for late payment calculation. */
  salaryDueDay?: number;
}

// Student class: fixed fees and late fees per class
export interface StudentClass {
  id: string;
  sessionId: string;
  name: string; // e.g. "Class 1", "Nursery"
  // One-time fees per session
  registrationFees: number;  // Registration/Admission fees (one-time)
  annualFund: number;
  // Monthly tuition fee
  monthlyFees: number;
  // Late fee configuration
  lateFeeAmount: number; // Amount to add as fine
  lateFeeFrequency: "daily" | "weekly"; // How often late fee is applied after due date
  dueDayOfMonth: number; // 1-28, day of month when monthly fee is due
}

// Fee types
export type FeeType =
  | "Regular"
  | "Boarding"
  | "Day Scholar + Meals"
  | "Boarding + Meals";

export type PaymentMethod = "Cash" | "Cheque" | "Online" | "Bank Transfer";

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  receiptNumber: string;
}

// Student personal details
export interface StudentPersonalDetails {
  fatherName?: string;
  motherName?: string;
  guardianPhone?: string;
  currentAddress?: string;
  permanentAddress?: string;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "";
  healthIssues?: string; // Optional health-related notes
}

// Fee payment tracking for different fee types
export interface FeePayment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  receiptNumber: string;
  feeCategory: "registration" | "admission" | "annualFund" | "monthly" | "transport" | "other";  // "admission" kept for historical payments
  month?: string; // For monthly fees, e.g. "2024-04"
  receiptPhotoUrl?: string; // Photo of receipt (max 2MB)
}

// Student - with all fee types and personal details
export interface Student {
  id: string;
  sessionId: string;
  classId?: string; // Link to StudentClass
  
  // Basic info
  name: string;
  studentId: string; // display ID
  feeType: FeeType;
  
  // Personal details
  personalDetails?: StudentPersonalDetails;
  
  // Fee structure (per student, can override class defaults)
  registrationFees?: number; // Registration/Admission fees (one-time per session)
  annualFund?: number; // One-time per session
  monthlyFees?: number; // Monthly tuition (overrides class if set)
  transportFees?: number; // Optional, per month (varies by distance)
  
  // Fee payment status flags
  registrationPaid?: boolean;
  annualFundPaid?: boolean;
  
  // Due date config (can override class)
  dueDayOfMonth?: number; // 1-28
  lateFeeAmount?: number;
  lateFeeFrequency?: "daily" | "weekly";
  
  // All payments
  payments: FeePayment[];
  
  // Profile photo
  photoUrl?: string;
  
  // Sibling concession - link to sibling student for 30% monthly fee discount
  siblingId?: string;
  
  // Legacy fields for backward compatibility
  targetAmount?: number;
  finePerDay?: number;
  dueFrequency?: "monthly" | "quarterly";
}

// Staff
export type StaffRole =
  | "Teacher"
  | "Administrative"
  | "Bus Driver"
  | "Support Staff";

// Class and subjects mapping for a teacher
export interface ClassSubject {
  className: string;
  subjects: string[];
}

export interface SalaryPayment {
  id: string;
  month: string; // YYYY-MM
  amount: number;
  status: "Paid" | "Pending" | "Partially Paid";
  paymentDate?: string;
  method?: PaymentMethod;
  /** Due date (YYYY-MM-DD) for this month; used for late payment calculation. Set from session salaryDueDay. */
  dueDate?: string;
  // Leave tracking fields
  daysWorked: number;
  leavesTaken: number;
  allowedLeaves: number;
  excessLeaves: number;
  leaveDeduction: number;
  // Extra allowance/deduction
  extraAllowance: number;
  allowanceNote?: string;
  extraDeduction: number;
  deductionNote?: string;
  // Calculated salary
  calculatedSalary: number;
}

// Leave summary for a month (from API)
export interface LeaveSummary {
  staffId: string;
  month: string;
  leavesTaken: number;
  daysInMonth: number;
  daysWorked: number;
  allowedLeaves: number;
  excessLeaves: number;
  perDaySalary: number;
  leaveDeduction: number;
}

export interface Staff {
  id: string;
  sessionId: string;
  name: string;
  employeeId: string;
  role: StaffRole;
  monthlySalary: number;
  subjectOrGrade?: string; // for teachers (legacy, use classesSubjects for detailed)
  // Leave & salary deduction configuration
  allowedLeavesPerMonth: number;
  perDaySalary?: number; // If not set, use monthlySalary/30
  // Classes & subjects (dynamic array)
  classesSubjects?: ClassSubject[];
  salaryPayments: SalaryPayment[];
}

// Expenses
export type ExpenseCategory =
  | "Transportation"
  | "Events"
  | "Utilities"
  | "Supplies"
  | "Infrastructure"
  | "Miscellaneous"
  | "Stock Purchase"
  | "Salary"
  | "Fixed Cost";

export interface Expense {
  id: string;
  sessionId: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  vendorPayee: string;
  paymentMethod: PaymentMethod;
  tags?: string[];
}

// Stock Management - for books/supplies bought on credit from publishers
export type StockTransactionType = "purchase" | "sale" | "return";

export interface StockTransaction {
  id: string;
  date: string;
  type: StockTransactionType;
  amount: number; // Value in Rs
  quantity?: number; // Optional, for item count
  description: string;
  receiptNumber?: string;
}

export interface Stock {
  id: string;
  sessionId: string;
  publisherName: string;
  description: string; // e.g. "Books for 2024-25 session"
  purchaseDate: string;
  totalCreditAmount: number; // Total amount bought on credit
  transactions: StockTransaction[]; // Sales, returns
  status: "open" | "cleared"; // Open = ongoing, Cleared = fully settled
  settledDate?: string; // When the stock was fully cleared
  settledAmount?: number; // Final amount paid (after returns)
  notes?: string;
}

// Fixed Monthly Costs (e.g., rent)
export interface FixedMonthlyCost {
  id: string;
  sessionId: string;
  name: string; // e.g. "Rent", "Internet"
  amount: number;
  category: ExpenseCategory;
  isActive: boolean;
}

// Leave Management
export type LeaveApplicantType = "staff" | "student";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveType {
  id: string;
  sessionId: string;
  name: string;
  code: string;
  applicableTo: "staff" | "student" | "both";
  maxDaysPerYear?: number;
  requiresDocument: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveBalance {
  id: string;
  staffId: string;
  leaveTypeId: string;
  leaveType?: LeaveType;
  year: string;
  totalDays: number;
  usedDays: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveRequest {
  id: string;
  sessionId: string;
  leaveTypeId?: string;
  leaveType?: LeaveType;
  applicantType: LeaveApplicantType;
  staffId?: string;
  staff?: Staff;
  studentId?: string;
  student?: Student;
  fromDate: string;
  toDate: string;
  daysCount: number;
  reason: string;
  documentUrl?: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerRemarks?: string;
  createdAt?: string;
  updatedAt?: string;
}
