import type { User, Role, Permission, LoginCredentials, ChangePasswordRequest, CreateUserRequest, UpdateUserRequest } from '../../../types/auth';
import { teachingFetch, teachingFetchJson } from '../../api/client';

function mapRole(r: Record<string, unknown>): Role | undefined {
  if (!r) return undefined;
  return {
    id: String(r.id),
    name: String(r.name ?? ''),
    isSystem: Boolean(r.is_system),
    permissions: [],
    createdAt: '',
    updatedAt: '',
  };
}

function mapUser(r: Record<string, unknown>, _permissions: string[]): User {
  const roleData = r.role as Record<string, unknown> | null | undefined;
  return {
    id: String(r.id),
    username: String(r.username ?? ''),
    email: r.email != null ? String(r.email) : undefined,
    name: String(r.name ?? ''),
    roleId: String(r.role_id),
    organizationId: r.organization_id != null ? String(r.organization_id) : undefined,
    role: roleData ? mapRole(roleData) : undefined,
    mustChangePassword: Boolean(r.must_change_password),
    isActive: Boolean(r.is_active),
    lastLoginAt: r.last_login_at != null ? String(r.last_login_at) : undefined,
    staffId: r.staff_id != null ? String(r.staff_id) : undefined,
    studentId: r.student_id != null ? String(r.student_id) : undefined,
    createdAt: String(r.created_at ?? ''),
    updatedAt: String(r.updated_at ?? ''),
  };
}

export const authRepositoryApi = {
  async signIn(credentials: LoginCredentials): Promise<{ user: User; permissions: Permission[] }> {
    const data = await teachingFetchJson<{ user: Record<string, unknown>; permissions: string[] }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: credentials.username, password: credentials.password }),
    });
    const user = mapUser(data.user, data.permissions ?? []);
    return { user, permissions: (data.permissions ?? []) as Permission[] };
  },

  async signOut(): Promise<void> {
    await teachingFetch('/auth/logout', { method: 'POST' });
  },

  async getCurrentSession(): Promise<{ user: User; permissions: Permission[] } | null> {
    try {
      const data = await teachingFetchJson<{ user: Record<string, unknown>; permissions: string[] }>('/auth/me');
      const user = mapUser(data.user, data.permissions ?? []);
      return { user, permissions: (data.permissions ?? []) as Permission[] };
    } catch {
      return null;
    }
  },

  async changePassword(_userId: string, request: ChangePasswordRequest): Promise<void> {
    const res = await teachingFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: request.currentPassword,
        new_password: request.newPassword,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error((err as { detail?: string }).detail ?? res.statusText);
    }
  },

  async getUsers(page: number = 1, pageSize: number = 10): Promise<{ users: User[]; total: number }> {
    const data = await teachingFetchJson<{ users: Record<string, unknown>[]; total: number }>(
      `/users?page=${page}&page_size=${pageSize}`
    );
    const users = (data.users ?? []).map((r) => mapUser(r, []));
    return { users, total: data.total ?? 0 };
  },

  async createUser(request: CreateUserRequest): Promise<User> {
    const body: Record<string, unknown> = {
      username: request.username,
      email: request.email ?? null,
      name: request.name,
      role_id: request.roleId,
      password: request.password,
      staff_id: request.staffId ?? null,
      student_id: request.studentId ?? null,
    };
    if (request.organizationId !== undefined) body.organization_id = request.organizationId;
    const r = await teachingFetchJson<Record<string, unknown>>('/users', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapUser(r, []);
  },

  async updateUser(userId: string, request: UpdateUserRequest): Promise<User> {
    const body: Record<string, unknown> = {};
    if (request.email !== undefined) body.email = request.email;
    if (request.name !== undefined) body.name = request.name;
    if (request.roleId !== undefined) body.role_id = request.roleId;
    if (request.isActive !== undefined) body.is_active = request.isActive;
    if (request.organizationId !== undefined) body.organization_id = request.organizationId;
    if (request.staffId !== undefined) body.staff_id = request.staffId;
    if (request.studentId !== undefined) body.student_id = request.studentId;
    const r = await teachingFetchJson<Record<string, unknown>>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return mapUser(r, []);
  },

  async deleteUser(userId: string): Promise<void> {
    const res = await teachingFetch(`/users/${userId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error((err as { detail?: string }).detail ?? res.statusText);
    }
  },

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const res = await teachingFetch(`/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error((err as { detail?: string }).detail ?? res.statusText);
    }
  },
};
