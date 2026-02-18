import type { Student, StudentClass } from "../types";
import { differenceInDays, differenceInWeeks, isAfter } from "date-fns";

// Calculate sibling discount (30% on monthly fees when siblingId is set)
export function getSiblingDiscount(student: Student, studentClass?: StudentClass): number {
  if (!student.siblingId) return 0;
  
  const monthlyFee = student.monthlyFees ?? studentClass?.monthlyFees ?? 0;
  // 30% discount on monthly fees for 12 months
  return monthlyFee * 12 * 0.3;
}

// Get monthly fees after sibling discount
export function getDiscountedMonthlyFees(student: Student, studentClass?: StudentClass): number {
  const monthlyFee = student.monthlyFees ?? studentClass?.monthlyFees ?? 0;
  if (!student.siblingId) return monthlyFee;
  // 30% discount
  return monthlyFee * 0.7;
}

// Calculate total annual fees for a student
export function getTotalAnnualFees(student: Student, studentClass?: StudentClass): number {
  const registration = student.registrationFees ?? studentClass?.registrationFees ?? 0;
  const admission = student.admissionFees ?? studentClass?.admissionFees ?? 0;
  const annualFund = student.annualFund ?? studentClass?.annualFund ?? 0;
  const monthlyFee = student.monthlyFees ?? studentClass?.monthlyFees ?? 0;
  const transportFee = student.transportFees ?? 0;
  
  // Apply sibling discount (30% off monthly fees if sibling exists)
  const siblingDiscount = student.siblingId ? 0.3 : 0;
  const discountedMonthlyFee = monthlyFee * (1 - siblingDiscount);
  
  // Annual total: one-time fees + 12 months of discounted monthly + transport
  return registration + admission + annualFund + (discountedMonthlyFee * 12) + (transportFee * 12);
}

// Get target amount (for backward compatibility or calculated)
export function getTargetAmount(student: Student, studentClass?: StudentClass): number {
  // Use legacy targetAmount if set, otherwise calculate
  if (student.targetAmount && student.targetAmount > 0) {
    return student.targetAmount;
  }
  return getTotalAnnualFees(student, studentClass);
}

export function getTotalPaid(student: Student): number {
  return student.payments.reduce((sum, p) => sum + p.amount, 0);
}

export function getRemaining(student: Student, studentClass?: StudentClass): number {
  const target = getTargetAmount(student, studentClass);
  return Math.max(0, target - getTotalPaid(student));
}

export type PaymentStatus = "Fully Paid" | "Partially Paid" | "Not Paid";

export function getPaymentStatus(student: Student, studentClass?: StudentClass): PaymentStatus {
  const paid = getTotalPaid(student);
  const target = getTargetAmount(student, studentClass);
  if (paid >= target) return "Fully Paid";
  if (paid > 0) return "Partially Paid";
  return "Not Paid";
}

/** Calculate late fee for a given month based on frequency (daily or weekly) */
export function getFineForMonth(
  student: Student,
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
export function getTotalFine(student: Student, studentClass?: StudentClass): number {
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

export function getRunningBalances(student: Student, studentClass?: StudentClass): { afterPayment: number; payment: typeof student.payments[0] }[] {
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
export function getPaymentsByCategory(student: Student) {
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
