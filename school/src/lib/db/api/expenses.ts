import type { Expense, ExpenseCategory } from '../../../types';
import type { PaginatedResult } from '../repositories/schools';
import { teachingFetch, teachingFetchJson } from '../../api/client';

function mapExpense(r: Record<string, unknown>): Expense {
  return {
    id: String(r.id),
    sessionId: String(r.session_id ?? ''),
    date: String(r.date ?? ''),
    amount: Number(r.amount ?? 0),
    category: (r.category as ExpenseCategory) ?? 'Miscellaneous',
    description: String(r.description ?? ''),
    vendorPayee: String(r.vendor_payee ?? ''),
    paymentMethod: (r.payment_method as Expense['paymentMethod']) ?? 'Cash',
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : undefined,
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

export const expensesRepositoryApi = {
  async getAll(): Promise<Expense[]> {
    const res = await teachingFetchJson<PaginatedApiResponse>(`/expenses?limit=${LARGE_PAGE_SIZE}&offset=0`);
    const list = res?.items ?? [];
    return Array.isArray(list) ? list.map(mapExpense) : [];
  },

  async getBySession(sessionId: string): Promise<Expense[]> {
    const res = await teachingFetchJson<PaginatedApiResponse>(
      `/expenses?session_id=${sessionId}&limit=${LARGE_PAGE_SIZE}&offset=0`
    );
    const list = res?.items ?? [];
    return Array.isArray(list) ? list.map(mapExpense) : [];
  },

  async getById(id: string): Promise<Expense | null> {
    try {
      const r = await teachingFetchJson<Record<string, unknown>>(`/expenses/${id}`);
      return mapExpense(r);
    } catch {
      return null;
    }
  },

  async create(data: Omit<Expense, 'id'>): Promise<Expense> {
    const body = {
      session_id: data.sessionId,
      date: data.date,
      amount: data.amount,
      category: data.category,
      description: data.description ?? null,
      vendor_payee: data.vendorPayee ?? null,
      payment_method: data.paymentMethod ?? null,
      tags: data.tags ?? null,
    };
    const r = await teachingFetchJson<Record<string, unknown>>('/expenses', { method: 'POST', body: JSON.stringify(body) });
    return mapExpense(r);
  },

  async update(id: string, updates: Partial<Expense>): Promise<Expense> {
    const body: Record<string, unknown> = {};
    if (updates.date !== undefined) body.date = updates.date;
    if (updates.amount !== undefined) body.amount = updates.amount;
    if (updates.category !== undefined) body.category = updates.category;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.vendorPayee !== undefined) body.vendor_payee = updates.vendorPayee;
    if (updates.paymentMethod !== undefined) body.payment_method = updates.paymentMethod;
    if (updates.tags !== undefined) body.tags = updates.tags;
    const r = await teachingFetchJson<Record<string, unknown>>(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    return mapExpense(r);
  },

  async delete(id: string): Promise<void> {
    await teachingFetch(`/expenses/${id}`, { method: 'DELETE' });
  },

  async createMany(expenses: Omit<Expense, 'id'>[]): Promise<Expense[]> {
    if (expenses.length === 0) return [];
    const body = expenses.map((data) => ({
      session_id: data.sessionId,
      date: data.date,
      amount: data.amount,
      category: data.category,
      description: data.description ?? null,
      vendor_payee: data.vendorPayee ?? null,
      payment_method: data.paymentMethod ?? null,
      tags: data.tags ?? null,
    }));
    const list = await teachingFetchJson<Record<string, unknown>[]>('/expenses/bulk', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return Array.isArray(list) ? list.map(mapExpense) : [];
  },

  async getPaginated(
    page: number = 1,
    pageSize: number = 50,
    filters?: { sessionId?: string; category?: string; search?: string; startDate?: string; endDate?: string }
  ): Promise<PaginatedResult<Expense>> {
    const sessionId = filters?.sessionId ?? '';
    const offset = (page - 1) * pageSize;
    const params = new URLSearchParams();
    if (sessionId) params.set('session_id', sessionId);
    params.set('limit', String(pageSize));
    params.set('offset', String(offset));
    const res = await teachingFetchJson<PaginatedApiResponse>(`/expenses?${params.toString()}`);
    const items = res?.items ?? [];
    const total = res?.total ?? 0;
    return {
      data: Array.isArray(items) ? items.map(mapExpense) : [],
      total,
      page,
      pageSize,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    };
  },
};
