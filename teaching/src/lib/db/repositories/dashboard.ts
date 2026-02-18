import { getSupabaseOrNull } from '../supabase';
import { isTeachingApiConfigured } from '../../api/client';
import type {
  School,
  Session,
  StudentClass,
  Student,
  FeePayment,
  Staff,
  SalaryPayment,
  Expense,
  Stock,
  StockTransaction,
  FixedMonthlyCost,
  Organization,
} from '../../../types';
import type { StudentPersonalDetails } from '../../../types';
import type { PlanId } from '../../../types';

export interface DashboardData {
  schools: School[];
  sessions: Session[];
  classes: StudentClass[];
  students: Student[];
  staff: Staff[];
  expenses: Expense[];
  stocks: Stock[];
  fixedCosts: FixedMonthlyCost[];
  organizations: Organization[];
}

function mapPayment(row: Record<string, unknown>): FeePayment {
  return {
    id: row.id as string,
    date: row.date as string,
    amount: Number(row.amount) || 0,
    method: row.method as FeePayment['method'],
    receiptNumber: (row.receipt_number as string) || '',
    feeCategory: row.fee_category as FeePayment['feeCategory'],
    month: row.month as string | undefined,
    receiptPhotoUrl: row.receipt_photo_url as string | undefined,
  };
}

function mapStudent(row: Record<string, unknown>): Student {
  const paymentsRaw = (row.payments as Record<string, unknown>[] | null) || [];
  const payments = paymentsRaw.map(mapPayment);
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    classId: row.class_id as string | undefined,
    name: row.name as string,
    studentId: row.student_id as string,
    feeType: (row.fee_type as Student['feeType']) || 'Regular',
    personalDetails: {
      fatherName: row.father_name as string | undefined,
      motherName: row.mother_name as string | undefined,
      guardianPhone: row.guardian_phone as string | undefined,
      currentAddress: row.current_address as string | undefined,
      permanentAddress: row.permanent_address as string | undefined,
      bloodGroup: row.blood_group as StudentPersonalDetails['bloodGroup'],
      healthIssues: row.health_issues as string | undefined,
    },
    registrationFees: row.registration_fees != null ? Number(row.registration_fees) : undefined,
    admissionFees: row.admission_fees != null ? Number(row.admission_fees) : undefined,
    annualFund: row.annual_fund != null ? Number(row.annual_fund) : undefined,
    monthlyFees: row.monthly_fees != null ? Number(row.monthly_fees) : undefined,
    transportFees: row.transport_fees != null ? Number(row.transport_fees) : undefined,
    registrationPaid: row.registration_paid as boolean | undefined,
    admissionPaid: row.admission_paid as boolean | undefined,
    annualFundPaid: row.annual_fund_paid as boolean | undefined,
    dueDayOfMonth: row.due_day_of_month as number | undefined,
    lateFeeAmount: row.late_fee_amount != null ? Number(row.late_fee_amount) : undefined,
    lateFeeFrequency: row.late_fee_frequency as Student['lateFeeFrequency'] | undefined,
    payments,
    targetAmount: row.target_amount != null ? Number(row.target_amount) : undefined,
    finePerDay: row.fine_per_day != null ? Number(row.fine_per_day) : undefined,
    dueFrequency: row.due_frequency as Student['dueFrequency'] | undefined,
    photoUrl: row.photo_url as string | undefined,
    siblingId: row.sibling_id as string | undefined,
  };
}

function mapSalaryPayment(row: Record<string, unknown>): SalaryPayment {
  return {
    id: row.id as string,
    month: row.month as string,
    amount: Number(row.paid_amount) || 0,
    status: (row.status as SalaryPayment['status']) || 'Pending',
    paymentDate: row.payment_date as string | undefined,
    method: row.method as SalaryPayment['method'] | undefined,
    dueDate: row.due_date as string | undefined,
  };
}

function mapStaff(row: Record<string, unknown>): Staff {
  const salaryPaymentsRaw = (row.salary_payments as Record<string, unknown>[] | null) || [];
  const salaryPayments = salaryPaymentsRaw.map(mapSalaryPayment);
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    name: row.name as string,
    employeeId: row.employee_id as string,
    role: row.role as Staff['role'],
    monthlySalary: Number(row.monthly_salary) || 0,
    subjectOrGrade: row.subject_or_grade as string | undefined,
    salaryPayments,
  };
}

function mapStockTransaction(row: Record<string, unknown>): StockTransaction {
  return {
    id: row.id as string,
    date: row.date as string,
    type: row.type as StockTransaction['type'],
    amount: Number(row.amount) || 0,
    quantity: row.quantity as number | undefined,
    description: (row.description as string) || '',
    receiptNumber: row.receipt_number as string | undefined,
  };
}

function mapStock(row: Record<string, unknown>): Stock {
  const transactionsRaw = (row.transactions as Record<string, unknown>[] | null) || [];
  const transactions = transactionsRaw.map(mapStockTransaction);
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    publisherName: row.publisher_name as string,
    description: (row.description as string) || '',
    purchaseDate: row.purchase_date as string,
    totalCreditAmount: Number(row.total_credit_amount) || 0,
    transactions,
    status: (row.status as Stock['status']) || 'open',
    settledDate: row.settled_date as string | undefined,
    settledAmount: row.settled_amount != null ? Number(row.settled_amount) : undefined,
    notes: row.notes as string | undefined,
  };
}

/**
 * Fetches all dashboard data in a single API call via Supabase RPC.
 * Data is always live from the database; any change to payments, expenses,
 * salaries, etc. will be reflected on the next call.
 * Returns null if Supabase is not configured or RPC is not available.
 */
export async function getAggregatedDashboard(): Promise<DashboardData | null> {
  if (isTeachingApiConfigured()) return null;
  const supabase = getSupabaseOrNull();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('get_dashboard_data');
  if (error || data == null) return null;

  const raw = data as {
    schools?: Record<string, unknown>[];
    sessions?: Record<string, unknown>[];
    classes?: Record<string, unknown>[];
    students?: Record<string, unknown>[];
    staff?: Record<string, unknown>[];
    expenses?: Record<string, unknown>[];
    stocks?: Record<string, unknown>[];
    fixedCosts?: Record<string, unknown>[];
    organizations?: Record<string, unknown>[];
  };

  const defaultPlan: PlanId = 'starter';
  return {
    schools: (raw.schools || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      address: (row.address as string) || '',
      contact: (row.contact as string) || '',
      isLocked: (row.is_locked as boolean) ?? false,
      planId: ((row.plan_id as PlanId) || defaultPlan) as PlanId,
    })),
    sessions: (raw.sessions || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      schoolId: row.school_id as string,
      year: row.year as string,
      startDate: row.start_date as string,
      endDate: row.end_date as string,
      salaryDueDay: row.salary_due_day as number | undefined,
    })),
    classes: (raw.classes || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      sessionId: row.session_id as string,
      name: row.name as string,
      registrationFees: Number(row.registration_fees) || 0,
      admissionFees: Number(row.admission_fees) || 0,
      annualFund: Number(row.annual_fund) || 0,
      monthlyFees: Number(row.monthly_fees) || 0,
      lateFeeAmount: Number(row.late_fee_amount) || 0,
      lateFeeFrequency: ((row.late_fee_frequency as string) || 'weekly') as StudentClass['lateFeeFrequency'],
      dueDayOfMonth: Number(row.due_day_of_month) || 10,
    })),
    students: (raw.students || []).map((row: Record<string, unknown>) => mapStudent(row)),
    staff: (raw.staff || []).map((row: Record<string, unknown>) => mapStaff(row)),
    expenses: (raw.expenses || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      sessionId: row.session_id as string,
      date: row.date as string,
      amount: Number(row.amount) || 0,
      category: row.category as Expense['category'],
      description: (row.description as string) || '',
      vendorPayee: (row.vendor_payee as string) || '',
      paymentMethod: row.payment_method as Expense['paymentMethod'],
      tags: row.tags as string[] | undefined,
    })),
    stocks: (raw.stocks || []).map((row: Record<string, unknown>) => mapStock(row)),
    fixedCosts: (raw.fixedCosts || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      sessionId: row.session_id as string,
      name: row.name as string,
      amount: Number(row.amount) || 0,
      category: row.category as FixedMonthlyCost['category'],
      isActive: (row.is_active as boolean) ?? true,
    })),
    organizations: (raw.organizations || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      slug: (row.slug as string) || undefined,
      billingEmail: (row.billing_email as string) || undefined,
    })),
  };
}
