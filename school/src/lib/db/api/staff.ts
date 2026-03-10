import type { Staff, StaffRole, SalaryPayment, ClassSubject, LeaveSummary } from '../../../types';
import type { ExtendedSalaryPayment } from '../repositories/staff';
import type { PaginatedResult } from '../repositories/schools';
import { teachingFetch, teachingFetchJson } from '../../api/client';

function mapSalaryPayment(p: Record<string, unknown>): ExtendedSalaryPayment {
  return {
    id: String(p.id),
    month: String(p.month ?? ''),
    amount: Number(p.paid_amount ?? p.amount ?? 0),
    status: (p.status as SalaryPayment['status']) ?? 'Paid',
    paymentDate: p.payment_date != null ? String(p.payment_date) : undefined,
    method: (p.method as SalaryPayment['method']) ?? undefined,
    dueDate: p.due_date != null ? String(p.due_date) : undefined,
    expectedAmount: p.expected_amount != null ? Number(p.expected_amount) : undefined,
    lateDays: p.late_days != null ? Number(p.late_days) : undefined,
    // Leave tracking fields
    daysWorked: Number(p.days_worked ?? 30),
    leavesTaken: Number(p.leaves_taken ?? 0),
    allowedLeaves: Number(p.allowed_leaves ?? 2),
    excessLeaves: Number(p.excess_leaves ?? 0),
    leaveDeduction: Number(p.leave_deduction ?? 0),
    // Extra allowance/deduction
    extraAllowance: Number(p.extra_allowance ?? 0),
    allowanceNote: p.allowance_note != null ? String(p.allowance_note) : undefined,
    extraDeduction: Number(p.extra_deduction ?? 0),
    deductionNote: p.deduction_note != null ? String(p.deduction_note) : undefined,
    // Calculated salary
    calculatedSalary: Number(p.calculated_salary ?? p.paid_amount ?? 0),
  };
}

function mapClassesSubjects(raw: unknown): ClassSubject[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((item: Record<string, unknown>) => ({
    className: String(item.class_name ?? item.className ?? ''),
    subjects: Array.isArray(item.subjects) ? item.subjects.map(String) : [],
  }));
}

function mapStaff(r: Record<string, unknown>): Staff {
  const paymentsRaw = r.salary_payments;
  const salaryPayments: SalaryPayment[] = Array.isArray(paymentsRaw)
    ? (paymentsRaw as Record<string, unknown>[]).map((p) => mapSalaryPayment(p))
    : [];
  return {
    id: String(r.id),
    sessionId: String(r.session_id ?? ''),
    name: String(r.name ?? ''),
    employeeId: String(r.employee_id ?? ''),
    role: (r.role as StaffRole) ?? 'Teacher',
    monthlySalary: Number(r.monthly_salary ?? 0),
    subjectOrGrade: r.subject_or_grade != null ? String(r.subject_or_grade) : undefined,
    // Leave & salary deduction configuration
    allowedLeavesPerMonth: Number(r.allowed_leaves_per_month ?? 2),
    perDaySalary: r.per_day_salary != null ? Number(r.per_day_salary) : undefined,
    // Classes & subjects
    classesSubjects: mapClassesSubjects(r.classes_subjects),
    salaryPayments,
  };
}

const LARGE_PAGE_SIZE = 10000;

interface PaginatedApiResponse {
  items: Record<string, unknown>[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export const staffRepositoryApi = {
  async getAll(): Promise<Staff[]> {
    const res = await teachingFetchJson<PaginatedApiResponse>(`/staff?limit=${LARGE_PAGE_SIZE}&offset=0`);
    const list = res?.items ?? [];
    return Array.isArray(list) ? list.map(mapStaff) : [];
  },

  async getBySession(sessionId: string): Promise<Staff[]> {
    const res = await teachingFetchJson<PaginatedApiResponse>(
      `/staff?session_id=${sessionId}&limit=${LARGE_PAGE_SIZE}&offset=0`
    );
    const list = res?.items ?? [];
    return Array.isArray(list) ? list.map(mapStaff) : [];
  },

  async getById(id: string): Promise<Staff | null> {
    try {
      const r = await teachingFetchJson<Record<string, unknown>>(`/staff/${id}`);
      return mapStaff(r);
    } catch {
      return null;
    }
  },

  async create(data: Omit<Staff, 'id' | 'salaryPayments'>): Promise<Staff> {
    const body = {
      session_id: data.sessionId,
      name: data.name,
      employee_id: data.employeeId,
      role: data.role,
      monthly_salary: data.monthlySalary,
      subject_or_grade: data.subjectOrGrade ?? null,
      phone: null,
      email: null,
      address: null,
      salary_due_day: 5,
      // Leave & salary deduction configuration
      allowed_leaves_per_month: data.allowedLeavesPerMonth ?? 2,
      per_day_salary: data.perDaySalary ?? null,
      // Classes & subjects
      classes_subjects: data.classesSubjects?.map(cs => ({
        class_name: cs.className,
        subjects: cs.subjects,
      })) ?? null,
    };
    const r = await teachingFetchJson<Record<string, unknown>>('/staff', { method: 'POST', body: JSON.stringify(body) });
    return mapStaff(r);
  },

  async update(id: string, updates: Partial<Staff>): Promise<Staff> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.employeeId !== undefined) body.employee_id = updates.employeeId;
    if (updates.role !== undefined) body.role = updates.role;
    if (updates.monthlySalary !== undefined) body.monthly_salary = updates.monthlySalary;
    if (updates.subjectOrGrade !== undefined) body.subject_or_grade = updates.subjectOrGrade;
    if (updates.allowedLeavesPerMonth !== undefined) body.allowed_leaves_per_month = updates.allowedLeavesPerMonth;
    if (updates.perDaySalary !== undefined) body.per_day_salary = updates.perDaySalary;
    if (updates.classesSubjects !== undefined) {
      body.classes_subjects = updates.classesSubjects?.map(cs => ({
        class_name: cs.className,
        subjects: cs.subjects,
      })) ?? null;
    }
    const r = await teachingFetchJson<Record<string, unknown>>(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    return mapStaff(r);
  },

  async delete(id: string): Promise<void> {
    await teachingFetch(`/staff/${id}`, { method: 'DELETE' });
  },

  async createMany(staffMembers: Omit<Staff, 'id' | 'salaryPayments'>[]): Promise<Staff[]> {
    if (staffMembers.length === 0) return [];
    const body = staffMembers.map((data) => ({
      session_id: data.sessionId,
      name: data.name,
      employee_id: data.employeeId,
      role: data.role,
      monthly_salary: data.monthlySalary,
      subject_or_grade: data.subjectOrGrade ?? null,
      phone: null,
      email: null,
      address: null,
      salary_due_day: 5,
      allowed_leaves_per_month: data.allowedLeavesPerMonth ?? 2,
      per_day_salary: data.perDaySalary ?? null,
      classes_subjects: data.classesSubjects?.map(cs => ({
        class_name: cs.className,
        subjects: cs.subjects,
      })) ?? null,
    }));
    const list = await teachingFetchJson<Record<string, unknown>[]>('/staff/bulk', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return Array.isArray(list) ? list.map(mapStaff) : [];
  },

  async getLeaveSummary(staffId: string, month: string): Promise<LeaveSummary> {
    const r = await teachingFetchJson<Record<string, unknown>>(`/staff/${staffId}/leave-summary/${month}`);
    return {
      staffId: String(r.staff_id),
      month: String(r.month),
      leavesTaken: Number(r.leaves_taken ?? 0),
      daysInMonth: Number(r.days_in_month ?? 30),
      daysWorked: Number(r.days_worked ?? 30),
      allowedLeaves: Number(r.allowed_leaves ?? 2),
      excessLeaves: Number(r.excess_leaves ?? 0),
      perDaySalary: Number(r.per_day_salary ?? 0),
      leaveDeduction: Number(r.leave_deduction ?? 0),
    };
  },

  async addSalaryPayment(staffId: string, payment: Omit<ExtendedSalaryPayment, 'id' | 'lateDays'>): Promise<ExtendedSalaryPayment> {
    const body = {
      month: payment.month,
      amount: payment.amount,
      status: payment.status ?? 'Paid',
      payment_date: payment.paymentDate ?? null,
      method: payment.method ?? null,
      due_date: payment.dueDate ?? null,
      // Leave tracking fields
      days_worked: payment.daysWorked ?? 30,
      leaves_taken: payment.leavesTaken ?? 0,
      // Extra allowance/deduction
      extra_allowance: payment.extraAllowance ?? 0,
      allowance_note: payment.allowanceNote ?? null,
      extra_deduction: payment.extraDeduction ?? 0,
      deduction_note: payment.deductionNote ?? null,
    };
    const r = await teachingFetchJson<Record<string, unknown>>(`/staff/${staffId}/payments`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapSalaryPayment(r);
  },

  async addSalaryPaymentsBatch(payments: { staffId: string; payment: Omit<ExtendedSalaryPayment, 'id' | 'lateDays'> }[]): Promise<void> {
    if (payments.length === 0) return;
    const body = payments.map(({ staffId, payment }) => ({
      staff_id: staffId,
      month: payment.month,
      amount: payment.amount,
      status: payment.status ?? 'Paid',
      payment_date: payment.paymentDate ?? null,
      method: payment.method ?? null,
      due_date: payment.dueDate ?? null,
      days_worked: payment.daysWorked ?? 30,
      leaves_taken: payment.leavesTaken ?? 0,
      extra_allowance: payment.extraAllowance ?? 0,
      allowance_note: payment.allowanceNote ?? null,
      extra_deduction: payment.extraDeduction ?? 0,
      deduction_note: payment.deductionNote ?? null,
    }));
    await teachingFetchJson<Record<string, unknown>[]>('/staff/salary-payments/bulk', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updateSalaryPayment(staffId: string, paymentId: string, updates: Partial<ExtendedSalaryPayment>): Promise<ExtendedSalaryPayment> {
    const body: Record<string, unknown> = {};
    if (updates.amount !== undefined) body.paid_amount = updates.amount;
    if (updates.status !== undefined) body.status = updates.status;
    if (updates.paymentDate !== undefined) body.payment_date = updates.paymentDate;
    if (updates.method !== undefined) body.method = updates.method;
    if (updates.daysWorked !== undefined) body.days_worked = updates.daysWorked;
    if (updates.leavesTaken !== undefined) body.leaves_taken = updates.leavesTaken;
    if (updates.extraAllowance !== undefined) body.extra_allowance = updates.extraAllowance;
    if (updates.allowanceNote !== undefined) body.allowance_note = updates.allowanceNote;
    if (updates.extraDeduction !== undefined) body.extra_deduction = updates.extraDeduction;
    if (updates.deductionNote !== undefined) body.deduction_note = updates.deductionNote;
    const r = await teachingFetchJson<Record<string, unknown>>(`/staff/${staffId}/payments/${paymentId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return mapSalaryPayment(r);
  },

  async getPaginated(
    page: number = 1,
    pageSize: number = 10,
    filters?: { sessionId?: string; role?: string; search?: string }
  ): Promise<PaginatedResult<Staff>> {
    const hasFilters = !!(filters?.role ?? filters?.search);
    const sessionId = filters?.sessionId ?? '';
    const offset = (page - 1) * pageSize;
    const params = new URLSearchParams();
    if (sessionId) params.set('session_id', sessionId);
    params.set('limit', String(pageSize));
    params.set('offset', String(offset));
    params.set('has_filters', String(hasFilters));
    const res = await teachingFetchJson<PaginatedApiResponse>(`/staff?${params.toString()}`);
    const items = res?.items ?? [];
    const total = res?.total ?? 0;
    return {
      data: Array.isArray(items) ? items.map(mapStaff) : [],
      total,
      page,
      pageSize,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    };
  },

  async deleteSalaryPayment(staffId: string, paymentId: string): Promise<void> {
    await teachingFetch(`/staff/${staffId}/payments/${paymentId}`, { method: 'DELETE' });
  },

  async getLastPaidDate(staffId: string): Promise<string | null> {
    const staff = await this.getById(staffId);
    if (!staff?.salaryPayments?.length) return null;
    const withDate = staff.salaryPayments
      .filter((p) => p.paymentDate)
      .sort((a, b) => (b.paymentDate ?? '').localeCompare(a.paymentDate ?? ''));
    return withDate[0]?.paymentDate ?? null;
  },

  async getSalaryStatus(staffId: string, month: string): Promise<ExtendedSalaryPayment | null> {
    const staff = await this.getById(staffId);
    const found = staff?.salaryPayments?.find((p) => p.month === month);
    return found ? (found as ExtendedSalaryPayment) : null;
  },
};
