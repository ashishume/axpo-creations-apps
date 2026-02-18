import type { Organization } from '../../../types';
import { teachingFetch, teachingFetchJson } from '../../api/client';

function mapOrg(r: Record<string, unknown>): Organization {
  return {
    id: String(r.id),
    name: String(r.name ?? ''),
    slug: r.slug != null ? String(r.slug) : undefined,
    billingEmail: r.billing_email != null ? String(r.billing_email) : undefined,
  };
}

export const organizationsRepositoryApi = {
  async getAll(): Promise<Organization[]> {
    const list = await teachingFetchJson<Record<string, unknown>[]>('/organizations');
    return Array.isArray(list) ? list.map(mapOrg) : [];
  },

  async getById(id: string): Promise<Organization | null> {
    try {
      const r = await teachingFetchJson<Record<string, unknown>>(`/organizations/${id}`);
      return mapOrg(r);
    } catch {
      return null;
    }
  },

  async create(org: Omit<Organization, 'id'>): Promise<Organization> {
    const body = {
      name: org.name,
      slug: org.slug ?? null,
      billing_email: org.billingEmail ?? null,
    };
    const r = await teachingFetchJson<Record<string, unknown>>('/organizations', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapOrg(r);
  },

  async update(id: string, updates: Partial<Omit<Organization, 'id'>>): Promise<Organization> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.slug !== undefined) body.slug = updates.slug ?? null;
    if (updates.billingEmail !== undefined) body.billing_email = updates.billingEmail ?? null;
    const r = await teachingFetchJson<Record<string, unknown>>(`/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return mapOrg(r);
  },

  async delete(id: string): Promise<void> {
    await teachingFetch(`/organizations/${id}`, { method: 'DELETE' });
  },
};
