import type { SessionStudent, StudentClass } from "../types";
import { differenceInDays, differenceInWeeks, isAfter } from "date-fns";

type StudentLike = SessionStudent;

const SIBLING_DISCOUNT_RATE = 0.2;

export function hasSiblingDiscountEligibility(student: StudentLike): boolean {
  return student.hasSiblingDiscount === true || 
    (student.siblingId != null && student.hasSiblingDiscount !== false);
}

export function getSiblingDiscount(student: StudentLike, studentClass?: StudentClass): number {
  if (!hasSiblingDiscountEligibility(student)) return 0;

  const monthlyFee = student.monthlyFees ?? studentClass?.monthlyFees ?? 0;
  return monthlyFee * 12 * SIBLING_DISCOUNT_RATE;
}

export function getDiscountedMonthlyFees(student: StudentLike, studentClass?: StudentClass): number {
  const monthlyFee = student.monthlyFees ?? studentClass?.monthlyFees ?? 0;
  if (!hasSiblingDiscountEligibility(student)) return monthlyFee;
  return monthlyFee * (1 - SIBLING_DISCOUNT_RATE);
}

export function getTotalAnnualFees(student: StudentLike, studentClass?: StudentClass): number {
  const registration = student.registrationFees ?? studentClass?.registrationFees ?? 0;
  const annualFund = student.annualFund ?? studentClass?.annualFund ?? 0;
  const monthlyFee = student.monthlyFees ?? studentClass?.monthlyFees ?? 0;
  const transportFee = student.transportFees ?? 0;

  // Apply 20% sibling discount if student has discount eligibility
  const siblingDiscount = hasSiblingDiscountEligibility(student) ? SIBLING_DISCOUNT_RATE : 0;
  const discountedMonthlyFee = monthlyFee * (1 - siblingDiscount);

  // Annual total: one-time fees + 12 months of discounted monthly + transport
  return registration + annualFund + (discountedMonthlyFee * 12) + (transportFee * 12);
}

// Get target amount (for backward compatibility or calculated)
export function getTargetAmount(student: StudentLike, studentClass?: StudentClass): number {
  // Frozen students have 0 target (excluded from calculations)
  if (student.isFrozen) return 0;
  
  // Use legacy targetAmount if set, otherwise calculate
  if (student.targetAmount && student.targetAmount > 0) {
    return student.targetAmount;
  }
  return getTotalAnnualFees(student, studentClass);
}

// Check if student is frozen (left mid-session)
export function isStudentFrozen(student: StudentLike): boolean {
  return student.isFrozen === true;
}

export function getTotalPaid(student: StudentLike): number {
  return student.payments.reduce((sum, p) => sum + p.amount, 0);
}

export function getRemaining(student: StudentLike, studentClass?: StudentClass): number {
  const target = getTargetAmount(student, studentClass);
  return Math.max(0, target - getTotalPaid(student));
}

export type PaymentStatus = "Fully Paid" | "Partially Paid" | "Not Paid";

export function getPaymentStatus(student: StudentLike, studentClass?: StudentClass): PaymentStatus {
  const paid = getTotalPaid(student);
  const target = getTargetAmount(student, studentClass);
  if (paid >= target) return "Fully Paid";
  if (paid > 0) return "Partially Paid";
  return "Not Paid";
}

/** Calculate late fee for a given month based on frequency (daily or weekly) */
export function getFineForMonth(
  student: StudentLike,
  studentClass: StudentClass | undefined,
  year: number,
  month: number,
  asOfDate: Date
): number {
  const dueDay = student.dueDayOfMonth ?? studentClass?.dueDayOfMonth;
  const lateFeeAmount = student.lateFeeAmount ?? studentClass?.lateFeeAmount ?? student.finePerDay ?? 0;
  const lateFeeFrequency = student.lateFeeFrequency ?? studentClass?.lateFeeFrequency ?? "daily";

  if (!lateFeeAmount || !dueDay) return 0;

  const dueDate = new Date(year, month - 1, Math.min(dueDay, 28));
  if (!isAfter(asOfDate, dueDate)) return 0;

  if (lateFeeFrequency === "weekly") {
    const weeks = differenceInWeeks(asOfDate, dueDate);
    return weeks * lateFeeAmount;
  } else {
    const days = differenceInDays(asOfDate, dueDate);
    return days * lateFeeAmount;
  }
}

/** Total fine for a student up to today */
export function getTotalFine(student: StudentLike, studentClass?: StudentClass): number {
  const dueDay = student.dueDayOfMonth ?? studentClass?.dueDayOfMonth;
  const lateFeeAmount = student.lateFeeAmount ?? studentClass?.lateFeeAmount ?? student.finePerDay ?? 0;

  if (!lateFeeAmount || !dueDay) return 0;

  const today = new Date();
  let total = 0;
  const freq = student.dueFrequency;
  const step = freq === "quarterly" ? 3 : 1;
  const start = freq === "quarterly" ? 3 : 1;

  for (let m = start; m <= today.getMonth() + 1; m += step) {
    total += getFineForMonth(student, studentClass, today.getFullYear(), m, today);
  }
  return total;
}

export function getRunningBalances(student: StudentLike, studentClass?: StudentClass): { afterPayment: number; payment: typeof student.payments[0] }[] {
  const target = getTargetAmount(student, studentClass);
  let balance = target;
  return student.payments
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((payment) => {
      balance -= payment.amount;
      return { afterPayment: Math.max(0, balance), payment };
    });
}

// Get payments by category
export function getPaymentsByCategory(student: StudentLike) {
  const categories = {
    registration: 0,
    admission: 0,
    annualFund: 0,
    monthly: 0,
    transport: 0,
    other: 0,
  };

  for (const p of student.payments) {
    const cat = p.feeCategory ?? "other";
    categories[cat] = (categories[cat] || 0) + p.amount;
  }

  return categories;
}

/** Set of months (YYYY-MM) already paid for a given category (e.g. "monthly" or "transport") */
export function getPaidMonthsByCategory(
  student: StudentLike,
  category: "monthly" | "transport"
): Set<string> {
  const set = new Set<string>();
  for (const p of student.payments) {
    if (p.feeCategory === category && p.month) set.add(p.month);
  }
  return set;
}

/** Next unpaid month (YYYY-MM) for a category; if current month not paid, return it, else next month not in paid set */
export function getNextUnpaidMonth(
  student: StudentLike,
  category: "monthly" | "transport" = "monthly"
): string {
  const paid = getPaidMonthsByCategory(student, category);
  const now = new Date();
  let y = now.getFullYear();
  let m = now.getMonth() + 1; // 1–12
  for (let i = 0; i < 24; i++) {
    const yyyyMm = `${y}-${String(m).padStart(2, "0")}`;
    if (!paid.has(yyyyMm)) return yyyyMm;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

/** Build months to show in fee history: from session start to end date. Sorted oldest first (session start at top). */
export function getFeeHistoryMonths(sessionStartDate: string, sessionEndDate: string): string[] {
  const months: string[] = [];
  const start = new Date(sessionStartDate);
  const end = new Date(sessionEndDate);

  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= endMonth) {
    months.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`);
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

export type MonthlyFeeStatus = "Paid" | "Partially Paid" | "Not Paid";

/** Get payment status for a specific month and category */
export function getMonthlyPaymentStatus(
  student: StudentLike,
  month: string,
  category: "monthly" | "transport",
  expectedAmount: number
): { status: MonthlyFeeStatus; paidAmount: number; payments: typeof student.payments } {
  const payments = student.payments.filter(
    (p) => p.month === month && p.feeCategory === category
  );
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  let status: MonthlyFeeStatus;
  if (paidAmount >= expectedAmount) {
    status = "Paid";
  } else if (paidAmount > 0) {
    status = "Partially Paid";
  } else {
    status = "Not Paid";
  }

  return { status, paidAmount, payments };
}

/** Get all payments for a specific month (all categories) */
export function getPaymentsForMonth(student: StudentLike, month: string) {
  return student.payments.filter((p) => p.month === month);
}

/** Get one-time fee payments (registration, annualFund) */
export function getOneTimeFeePayments(student: StudentLike) {
  return {
    registration: student.payments.filter(
      (p) => p.feeCategory === "registration" || p.feeCategory === "admission"
    ),
    annualFund: student.payments.filter((p) => p.feeCategory === "annualFund"),
  };
}

/** Get "other" category payments */
export function getOtherPayments(student: StudentLike) {
  return student.payments.filter((p) => p.feeCategory === "other");
}
