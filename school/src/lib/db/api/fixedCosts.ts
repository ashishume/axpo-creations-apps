import type { FixedMonthlyCost } from '../../../types';
import { teachingFetch, teachingFetchJson } from '../../api/client';

function mapCost(r: Record<string, unknown>): FixedMonthlyCost {
  return {
    id: String(r.id),
    sessionId: String(r.session_id ?? ''),
    name: String(r.name ?? ''),
    amount: Number(r.amount ?? 0),
    category: (r.category as FixedMonthlyCost['category']) ?? 'Miscellaneous',
    isActive: Boolean(r.is_active ?? true),
  };
}

export const fixedCostsRepositoryApi = {
  async getAll(): Promise<FixedMonthlyCost[]> {
    const list = await teachingFetchJson<Record<string, unknown>[]>('/fixed-costs');
    return Array.isArray(list) ? list.map(mapCost) : [];
  },

  async getBySession(sessionId: string): Promise<FixedMonthlyCost[]> {
    const list = await teachingFetchJson<Record<string, unknown>[]>(
      `/fixed-costs?session_id=${sessionId}`
    );
    return Array.isArray(list) ? list.map(mapCost) : [];
  },

  async getById(id: string): Promise<FixedMonthlyCost | null> {
    try {
      const r = await teachingFetchJson<Record<string, unknown>>(`/fixed-costs/${id}`);
      return mapCost(r);
    } catch {
      return null;
    }
  },

  async create(cost: Omit<FixedMonthlyCost, 'id'>): Promise<FixedMonthlyCost> {
    const body = {
      session_id: cost.sessionId,
      name: cost.name,
      amount: cost.amount,
      category: cost.category,
      is_active: cost.isActive ?? true,
    };
    const r = await teachingFetchJson<Record<string, unknown>>('/fixed-costs', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapCost(r);
  },

  async createMany(costs: Omit<FixedMonthlyCost, 'id'>[]): Promise<FixedMonthlyCost[]> {
    if (costs.length === 0) return [];
    const body = costs.map((data) => ({
      session_id: data.sessionId,
      name: data.name,
      amount: data.amount,
      category: data.category,
      is_active: data.isActive ?? true,
    }));
    const list = await teachingFetchJson<Record<string, unknown>[]>('/fixed-costs/bulk', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return Array.isArray(list) ? list.map(mapCost) : [];
  },

  async update(id: string, updates: Partial<Omit<FixedMonthlyCost, 'id'>>): Promise<FixedMonthlyCost> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.amount !== undefined) body.amount = updates.amount;
    if (updates.category !== undefined) body.category = updates.category;
    if (updates.isActive !== undefined) body.is_active = updates.isActive;
    const r = await teachingFetchJson<Record<string, unknown>>(`/fixed-costs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return mapCost(r);
  },

  async delete(id: string): Promise<void> {
    await teachingFetch(`/fixed-costs/${id}`, { method: 'DELETE' });
  },
};
