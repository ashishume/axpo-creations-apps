import type { Role, Permission } from '../../../types/auth';
import { ALL_PERMISSIONS } from '../../../types/auth';
import { teachingFetch, teachingFetchJson } from '../../api/client';

function mapRole(r: Record<string, unknown>): Role {
  return {
    id: String(r.id),
    name: String(r.name ?? ''),
    description: r.description != null ? String(r.description) : undefined,
    isSystem: Boolean(r.is_system),
    permissions: Array.isArray(r.permissions) ? (r.permissions as Permission[]) : [],
    createdAt: String(r.created_at ?? ''),
    updatedAt: String(r.updated_at ?? ''),
  };
}

export const rolesRepositoryApi = {
  async getAll(): Promise<Role[]> {
    const list = await teachingFetchJson<Record<string, unknown>[]>('/roles');
    return Array.isArray(list) ? list.map(mapRole) : [];
  },

  async getById(id: string): Promise<Role | null> {
    try {
      const r = await teachingFetchJson<Record<string, unknown>>(`/roles/${id}`);
      return mapRole(r);
    } catch {
      return null;
    }
  },

  async create(role: { name: string; description?: string; permissions: Permission[] }): Promise<Role> {
    const body = {
      name: role.name,
      description: role.description ?? null,
      permissions: role.permissions,
    };
    const r = await teachingFetchJson<Record<string, unknown>>('/roles', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapRole(r);
  },

  async update(
    id: string,
    updates: { name?: string; description?: string; permissions?: Permission[] }
  ): Promise<Role> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.permissions !== undefined) body.permissions = updates.permissions;
    const r = await teachingFetchJson<Record<string, unknown>>(`/roles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return mapRole(r);
  },

  async delete(id: string): Promise<void> {
    await teachingFetch(`/roles/${id}`, { method: 'DELETE' });
  },

  async getAllPermissions(): Promise<Permission[]> {
    return ALL_PERMISSIONS as unknown as Permission[];
  },
};
