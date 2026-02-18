import type { Stock, StockTransaction } from '../../../types';
import { teachingFetch, teachingFetchJson } from '../../api/client';

function mapStock(r: Record<string, unknown>): Stock {
  return {
    id: String(r.id),
    sessionId: String(r.session_id ?? ''),
    publisherName: String(r.publisher_name ?? ''),
    description: String(r.description ?? ''),
    purchaseDate: String(r.purchase_date ?? ''),
    totalCreditAmount: Number(r.total_credit_amount ?? 0),
    transactions: [],
    status: (r.status as 'open' | 'cleared') ?? 'open',
    settledDate: r.settled_date != null ? String(r.settled_date) : undefined,
    settledAmount: r.settled_amount != null ? Number(r.settled_amount) : undefined,
    notes: r.notes != null ? String(r.notes) : undefined,
  };
}

export const stocksRepositoryApi = {
  async getAll(): Promise<Stock[]> {
    const list = await teachingFetchJson<Record<string, unknown>[]>('/stocks');
    return Array.isArray(list) ? list.map(mapStock) : [];
  },

  async getBySession(sessionId: string): Promise<Stock[]> {
    const list = await teachingFetchJson<Record<string, unknown>[]>(`/stocks?session_id=${sessionId}`);
    return Array.isArray(list) ? list.map(mapStock) : [];
  },

  async getById(id: string): Promise<Stock | null> {
    try {
      const r = await teachingFetchJson<Record<string, unknown>>(`/stocks/${id}`);
      return mapStock(r);
    } catch {
      return null;
    }
  },

  async create(data: Omit<Stock, 'id' | 'transactions'>): Promise<Stock> {
    const body = {
      session_id: data.sessionId,
      publisher_name: data.publisherName,
      description: data.description ?? null,
      purchase_date: data.purchaseDate,
      total_credit_amount: data.totalCreditAmount,
      status: data.status ?? 'open',
      settled_date: data.settledDate ?? null,
      settled_amount: data.settledAmount ?? null,
      notes: data.notes ?? null,
    };
    const r = await teachingFetchJson<Record<string, unknown>>('/stocks', { method: 'POST', body: JSON.stringify(body) });
    return mapStock(r);
  },

  async update(id: string, updates: Partial<Stock>): Promise<Stock> {
    const body: Record<string, unknown> = {};
    if (updates.publisherName !== undefined) body.publisher_name = updates.publisherName;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.purchaseDate !== undefined) body.purchase_date = updates.purchaseDate;
    if (updates.totalCreditAmount !== undefined) body.total_credit_amount = updates.totalCreditAmount;
    if (updates.status !== undefined) body.status = updates.status;
    if (updates.settledDate !== undefined) body.settled_date = updates.settledDate;
    if (updates.settledAmount !== undefined) body.settled_amount = updates.settledAmount;
    if (updates.notes !== undefined) body.notes = updates.notes;
    const r = await teachingFetchJson<Record<string, unknown>>(`/stocks/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    return mapStock(r);
  },

  async delete(id: string): Promise<void> {
    await teachingFetch(`/stocks/${id}`, { method: 'DELETE' });
  },

  async addTransaction(_stockId: string, _transaction: Omit<StockTransaction, 'id'>): Promise<void> {
    throw new Error('Stock transactions not available via API yet');
  },

  async settle(_stockId: string, _settledAmount: number): Promise<void> {
    throw new Error('Settle stock not available via API yet');
  },

  async createMany(stocks: Omit<Stock, 'id' | 'transactions'>[]): Promise<Stock[]> {
    if (stocks.length === 0) return [];
    const body = stocks.map((data) => ({
      session_id: data.sessionId,
      publisher_name: data.publisherName,
      description: data.description ?? null,
      purchase_date: data.purchaseDate,
      total_credit_amount: data.totalCreditAmount,
      status: data.status ?? 'open',
      settled_date: data.settledDate ?? null,
      settled_amount: data.settledAmount ?? null,
      notes: data.notes ?? null,
    }));
    const list = await teachingFetchJson<Record<string, unknown>[]>('/stocks/bulk', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return Array.isArray(list) ? list.map(mapStock) : [];
  },
};
