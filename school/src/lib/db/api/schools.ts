import type { School, PlanId } from '../../../types';
import { teachingFetch, teachingFetchJson } from '../../api/client';

const DEFAULT_PLAN: PlanId = 'starter';

function mapSchool(r: Record<string, unknown>): School {
  return {
    id: String(r.id),
    organizationId: r.organization_id != null ? String(r.organization_id) : undefined,
    name: String(r.name ?? ''),
    address: String(r.address ?? ''),
    contact: String(r.contact ?? ''),
    isLocked: Boolean(r.is_locked),
    planId: (r.plan_id as PlanId) || DEFAULT_PLAN,
  };
}

export const schoolsRepositoryApi = {
  async getAll(): Promise<School[]> {
    const list = await teachingFetchJson<Record<string, unknown>[]>('/schools');
    return Array.isArray(list) ? list.map(mapSchool) : [];
  },

  async getPaginated(page = 1, pageSize = 10): Promise<{ data: School[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const list = await this.getAll();
    const total = list.length;
    const start = (page - 1) * pageSize;
    const data = list.slice(start, start + pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
  },

  async getById(id: string): Promise<School | null> {
    try {
      const r = await teachingFetchJson<Record<string, unknown>>(`/schools/${id}`);
      return mapSchool(r);
    } catch {
      return null;
    }
  },

  async create(school: Omit<School, 'id'>): Promise<School> {
    const body: Record<string, unknown> = {
      name: school.name,
      address: school.address,
      contact: school.contact,
      is_locked: school.isLocked ?? false,
      plan_id: school.planId ?? DEFAULT_PLAN,
    };
    if (school.organizationId) body.organization_id = school.organizationId;
    const r = await teachingFetchJson<Record<string, unknown>>('/schools', { method: 'POST', body: JSON.stringify(body) });
    return mapSchool(r);
  },

  async update(id: string, updates: Partial<Omit<School, 'id'>>): Promise<School> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.address !== undefined) body.address = updates.address;
    if (updates.contact !== undefined) body.contact = updates.contact;
    if (updates.isLocked !== undefined) body.is_locked = updates.isLocked;
    if (updates.planId !== undefined) body.plan_id = updates.planId;
    if (updates.organizationId !== undefined) body.organization_id = updates.organizationId;
    const r = await teachingFetchJson<Record<string, unknown>>(`/schools/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    return mapSchool(r);
  },

  async delete(id: string): Promise<void> {
    await teachingFetch(`/schools/${id}`, { method: 'DELETE' });
  },
};
