import type { Staff, StaffRole } from '../../../types';
import type { ExtendedSalaryPayment } from '../repositories/staff';
import { teachingFetch, teachingFetchJson } from '../../api/client';

function mapStaff(r: Record<string, unknown>): Staff {
  return {
    id: String(r.id),
    sessionId: String(r.session_id ?? ''),
    name: String(r.name ?? ''),
    employeeId: String(r.employee_id ?? ''),
    role: (r.role as StaffRole) ?? 'Teacher',
    monthlySalary: Number(r.monthly_salary ?? 0),
    subjectOrGrade: r.subject_or_grade != null ? String(r.subject_or_grade) : undefined,
    salaryPayments: [],
  };
}

export const staffRepositoryApi = {
  async getAll(): Promise<Staff[]> {
    const list = await teachingFetchJson<Record<string, unknown>[]>('/staff');
    return Array.isArray(list) ? list.map(mapStaff) : [];
  },

  async getBySession(sessionId: string): Promise<Staff[]> {
    const list = await teachingFetchJson<Record<string, unknown>[]>(`/staff?session_id=${sessionId}`);
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

  async addSalaryPayment(_staffId: string, _payment: Omit<ExtendedSalaryPayment, 'id' | 'lateDays'>): Promise<ExtendedSalaryPayment> {
    throw new Error('Salary payments not available via API yet');
  },

  async addSalaryPaymentsBatch(_payments: { staffId: string; payment: Omit<ExtendedSalaryPayment, 'id' | 'lateDays'> }[]): Promise<void> {
    throw new Error('Salary payments not available via API yet');
  },

  async updateSalaryPayment(_staffId: string, _paymentId: string, _updates: Partial<ExtendedSalaryPayment>): Promise<ExtendedSalaryPayment> {
    throw new Error('Salary payments not available via API yet');
  },
};
