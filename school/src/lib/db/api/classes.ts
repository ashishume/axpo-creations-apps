import type { StudentClass } from '../../../types';
import type { PaginatedResult } from '../repositories/schools';
import { teachingFetch, teachingFetchJson } from '../../api/client';

function mapClass(r: Record<string, unknown>): StudentClass {
  return {
    id: String(r.id),
    sessionId: String(r.session_id ?? ''),
    name: String(r.name ?? ''),
    registrationFees: Number(r.registration_fees ?? 0),
    annualFund: Number(r.annual_fund ?? 0),
    monthlyFees: Number(r.monthly_fees ?? 0),
    lateFeeAmount: Number(r.late_fee_amount ?? 0),
    lateFeeFrequency: (r.late_fee_frequency as 'daily' | 'weekly') ?? 'weekly',
    dueDayOfMonth: Number(r.due_day_of_month ?? 10),
  };
}

export const classesRepositoryApi = {
  async getAll(): Promise<StudentClass[]> {
    const list = await teachingFetchJson<Record<string, unknown>[]>('/classes');
    return Array.isArray(list) ? list.map(mapClass) : [];
  },

  async getBySession(sessionId: string): Promise<StudentClass[]> {
    const list = await teachingFetchJson<Record<string, unknown>[]>(`/classes?session_id=${sessionId}`);
    return Array.isArray(list) ? list.map(mapClass) : [];
  },

  async getById(id: string): Promise<StudentClass | null> {
    try {
      const r = await teachingFetchJson<Record<string, unknown>>(`/classes/${id}`);
      return mapClass(r);
    } catch {
      return null;
    }
  },

  async create(data: Omit<StudentClass, 'id'>): Promise<StudentClass> {
    const body = {
      session_id: data.sessionId,
      name: data.name,
      registration_fees: data.registrationFees,
      annual_fund: data.annualFund,
      monthly_fees: data.monthlyFees,
      late_fee_amount: data.lateFeeAmount,
      late_fee_frequency: data.lateFeeFrequency,
      due_day_of_month: data.dueDayOfMonth,
    };
    const r = await teachingFetchJson<Record<string, unknown>>('/classes', { method: 'POST', body: JSON.stringify(body) });
    return mapClass(r);
  },

  async update(id: string, updates: Partial<Omit<StudentClass, 'id'>>): Promise<StudentClass> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.registrationFees !== undefined) body.registration_fees = updates.registrationFees;
    if (updates.annualFund !== undefined) body.annual_fund = updates.annualFund;
    if (updates.monthlyFees !== undefined) body.monthly_fees = updates.monthlyFees;
    if (updates.lateFeeAmount !== undefined) body.late_fee_amount = updates.lateFeeAmount;
    if (updates.lateFeeFrequency !== undefined) body.late_fee_frequency = updates.lateFeeFrequency;
    if (updates.dueDayOfMonth !== undefined) body.due_day_of_month = updates.dueDayOfMonth;
    const r = await teachingFetchJson<Record<string, unknown>>(`/classes/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    return mapClass(r);
  },

  async delete(id: string): Promise<void> {
    await teachingFetch(`/classes/${id}`, { method: 'DELETE' });
  },

  async createMany(classes: Omit<StudentClass, 'id'>[]): Promise<StudentClass[]> {
    if (classes.length === 0) return [];
    const body = classes.map((data) => ({
      session_id: data.sessionId,
      name: data.name,
      registration_fees: data.registrationFees,
      annual_fund: data.annualFund,
      monthly_fees: data.monthlyFees,
      late_fee_amount: data.lateFeeAmount,
      late_fee_frequency: data.lateFeeFrequency,
      due_day_of_month: data.dueDayOfMonth,
    }));
    const list = await teachingFetchJson<Record<string, unknown>[]>('/classes/bulk', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return Array.isArray(list) ? list.map(mapClass) : [];
  },

  async getPaginated(page: number = 1, pageSize: number = 10, sessionId?: string): Promise<PaginatedResult<StudentClass>> {
    const all = sessionId ? await this.getBySession(sessionId) : await this.getAll();
    const total = all.length;
    const start = (page - 1) * pageSize;
    const data = all.slice(start, start + pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },
};
