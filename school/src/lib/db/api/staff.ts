import type { Staff, StaffRole, SalaryPayment } from '../../../types';
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
  };
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
    }));
    const list = await teachingFetchJson<Record<string, unknown>[]>('/staff/bulk', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return Array.isArray(list) ? list.map(mapStaff) : [];
  },

  async addSalaryPayment(staffId: string, payment: Omit<ExtendedSalaryPayment, 'id' | 'lateDays'>): Promise<ExtendedSalaryPayment> {
    const body = {
      month: payment.month,
      amount: payment.amount,
      status: payment.status ?? 'Paid',
      payment_date: payment.paymentDate ?? null,
      method: payment.method ?? null,
      due_date: payment.dueDate ?? null,
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
