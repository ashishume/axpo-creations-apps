import type { User, Permission, LoginCredentials, ChangePasswordRequest, CreateUserRequest, UpdateUserRequest } from '../../../types/auth';
import { teachingFetch, teachingFetchJson } from '../../api/client';

function mapUser(r: Record<string, unknown>, _permissions: string[]): User {
  return {
    id: String(r.id),
    username: String(r.username ?? ''),
    email: r.email != null ? String(r.email) : undefined,
    name: String(r.name ?? ''),
    roleId: String(r.role_id),
    role: undefined,
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

  async changePassword(_userId: string, _request: ChangePasswordRequest): Promise<void> {
    throw new Error('Change password is not available when using the API. Use profile or contact admin.');
  },

  async getUsers(_page: number = 1, _pageSize: number = 10): Promise<{ users: User[]; total: number }> {
    throw new Error('User management is not available when using the backend API.');
  },

  async createUser(_request: CreateUserRequest): Promise<User> {
    throw new Error('User management is not available when using the backend API.');
  },

  async updateUser(_userId: string, _request: UpdateUserRequest): Promise<User> {
    throw new Error('User management is not available when using the backend API.');
  },

  async deleteUser(_userId: string): Promise<void> {
    throw new Error('User management is not available when using the backend API.');
  },

  async resetPassword(_userId: string, _newPassword: string): Promise<void> {
    throw new Error('User management is not available when using the backend API.');
  },
};
