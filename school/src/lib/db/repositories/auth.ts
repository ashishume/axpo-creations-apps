import bcrypt from 'bcryptjs';
import { getSupabase } from '../supabase';
import type {
  User,
  Role,
  Permission,
  DbUser,
  LoginCredentials,
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateUserRequest,
} from '../../../types/auth';
import { DEFAULT_ROLE_IDS } from '../../../types/auth';

const SALT_ROUNDS = 10;
const SESSION_STORAGE_KEY = 'school_auth_session';

// Session in sessionStorage (not localStorage) so login persists on refresh without using localStorage for app data
interface StoredSession {
  user: User;
  permissions: Permission[];
  expiresAt: number;
}

function getStoredSession(): StoredSession | null {
  try {
    const data = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!data) return null;
    const session = JSON.parse(data) as StoredSession;
    if (session.expiresAt < Date.now()) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function setStoredSession(user: User, permissions: Permission[]): void {
  const session: StoredSession = {
    user,
    permissions,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export const authRepository = {
  async signIn(credentials: LoginCredentials): Promise<{ user: User; permissions: Permission[] }> {
    const supabase = getSupabase();
    const { data: dbUser, error: userError } = await supabase
      .from('school_xx_users')
      .select('*')
      .eq('username', credentials.username)
      .eq('is_active', true)
      .single();

    if (userError || !dbUser) {
      throw new Error('Invalid username or password');
    }

    const isValid = await bcrypt.compare(credentials.password, dbUser.password_hash || '');
    if (!isValid) {
      throw new Error('Invalid username or password');
    }

    const { role, permissions } = await this.getRoleWithPermissions(dbUser.role_id);

    await supabase
      .from('school_xx_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', dbUser.id);

    const user: User = {
      id: dbUser.id,
      authUserId: dbUser.auth_user_id,
      organizationId: dbUser.organization_id ?? undefined,
      username: dbUser.username,
      email: dbUser.email,
      name: dbUser.name,
      roleId: dbUser.role_id,
      role,
      mustChangePassword: dbUser.must_change_password,
      isActive: dbUser.is_active,
      lastLoginAt: new Date().toISOString(),
      staffId: dbUser.staff_id,
      studentId: dbUser.student_id,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    };

    setStoredSession(user, permissions);
    return { user, permissions };
  },

  async signOut(): Promise<void> {
    clearStoredSession();
  },

  async getCurrentSession(): Promise<{ user: User; permissions: Permission[] } | null> {
    return getStoredSession();
  },

  async changePassword(userId: string, request: ChangePasswordRequest): Promise<void> {
    const supabase = getSupabase();
    const newHash = await bcrypt.hash(request.newPassword, SALT_ROUNDS);

    const { data: dbUser, error } = await supabase
      .from('school_xx_users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (error || !dbUser) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(request.currentPassword, dbUser.password_hash || '');
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const { error: updateError } = await supabase
      .from('school_xx_users')
      .update({
        password_hash: newHash,
        must_change_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error('Failed to update password');
    }

    const session = getStoredSession();
    if (session && session.user.id === userId) {
      session.user.mustChangePassword = false;
      setStoredSession(session.user, session.permissions);
    }
  },

  async getRoleWithPermissions(roleId: string): Promise<{ role: Role; permissions: Permission[] }> {
    const supabase = getSupabase();
    const { data: dbRole, error: roleError } = await supabase
      .from('school_xx_roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (roleError || !dbRole) {
      throw new Error('Role not found');
    }

    const { data: rolePerms } = await supabase
      .from('school_xx_role_permissions')
      .select('permission_id')
      .eq('role_id', roleId);

    const permissions = (rolePerms || []).map((rp) => rp.permission_id as Permission);

    const role: Role = {
      id: dbRole.id,
      name: dbRole.name,
      description: dbRole.description,
      isSystem: dbRole.is_system,
      permissions,
      createdAt: dbRole.created_at,
      updatedAt: dbRole.updated_at,
    };

    return { role, permissions };
  },

  async createUser(request: CreateUserRequest): Promise<User> {
    if (request.roleId === DEFAULT_ROLE_IDS.SUPER_ADMIN) {
      throw new Error('Cannot create a Super Admin user. Super Admin accounts are system-managed.');
    }

    const supabase = getSupabase();
    const passwordHash = await bcrypt.hash(request.password, SALT_ROUNDS);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insert: Record<string, unknown> = {
      id,
      username: request.username,
      email: request.email,
      name: request.name,
      role_id: request.roleId,
      password_hash: passwordHash,
      must_change_password: true,
      is_active: true,
      staff_id: request.staffId ?? null,
      student_id: request.studentId ?? null,
      created_at: now,
      updated_at: now,
    };
    if (request.organizationId !== undefined) insert.organization_id = request.organizationId;
    const { data, error } = await supabase
      .from('school_xx_users')
      .insert(insert)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Username already exists');
      }
      throw new Error('Failed to create user');
    }

    const { role } = await this.getRoleWithPermissions(data.role_id);

    return {
      id: data.id,
      authUserId: data.auth_user_id,
      organizationId: data.organization_id ?? undefined,
      username: data.username,
      email: data.email,
      name: data.name,
      roleId: data.role_id,
      role,
      mustChangePassword: data.must_change_password,
      isActive: data.is_active,
      lastLoginAt: data.last_login_at,
      staffId: data.staff_id ?? undefined,
      studentId: data.student_id ?? undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async getUsers(page: number = 1, pageSize: number = 10, organizationId?: string | null): Promise<{ users: User[]; total: number }> {
    const supabase = getSupabase();
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('school_xx_users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    const { data, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error('Failed to fetch users');
    }

    const users: User[] = await Promise.all(
      (data || []).map(async (dbUser: DbUser) => {
        const { role } = await this.getRoleWithPermissions(dbUser.role_id);
        return {
          id: dbUser.id,
          authUserId: dbUser.auth_user_id ?? undefined,
          organizationId: dbUser.organization_id ?? undefined,
          username: dbUser.username,
          email: dbUser.email ?? undefined,
          name: dbUser.name,
          roleId: dbUser.role_id,
          role,
          mustChangePassword: dbUser.must_change_password,
          isActive: dbUser.is_active,
          lastLoginAt: dbUser.last_login_at ?? undefined,
          staffId: dbUser.staff_id ?? undefined,
          studentId: dbUser.student_id ?? undefined,
          createdAt: dbUser.created_at,
          updatedAt: dbUser.updated_at,
        };
      })
    );

    return { users, total: count || 0 };
  },

  async getRoles(): Promise<Role[]> {
    const supabase = getSupabase();
    const { data: dbRoles, error } = await supabase
      .from('school_xx_roles')
      .select('*')
      .order('name');

    if (error) {
      throw new Error('Failed to fetch roles');
    }

    const roles: Role[] = await Promise.all(
      (dbRoles || []).map(async (dbRole: { id: string }) => {
        const { role } = await this.getRoleWithPermissions(dbRole.id);
        return role;
      })
    );

    return roles;
  },

  async updateUser(userId: string, request: UpdateUserRequest): Promise<User> {
    if (request.roleId === DEFAULT_ROLE_IDS.SUPER_ADMIN) {
      throw new Error('Cannot assign the Super Admin role. Super Admin is system-managed.');
    }

    const supabase = getSupabase();
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      updated_at: now,
    };
    if (request.email !== undefined) updates.email = request.email;
    if (request.name !== undefined) updates.name = request.name;
    if (request.roleId !== undefined) updates.role_id = request.roleId;
    if (request.isActive !== undefined) updates.is_active = request.isActive;
    if (request.organizationId !== undefined) updates.organization_id = request.organizationId;
    if (request.staffId !== undefined) updates.staff_id = request.staffId;
    if (request.studentId !== undefined) updates.student_id = request.studentId;

    const { data, error } = await supabase
      .from('school_xx_users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update user');
    }

    const { role } = await this.getRoleWithPermissions(data.role_id);

    return {
      id: data.id,
      authUserId: data.auth_user_id,
      organizationId: data.organization_id ?? undefined,
      username: data.username,
      email: data.email,
      name: data.name,
      roleId: data.role_id,
      role,
      mustChangePassword: data.must_change_password,
      isActive: data.is_active,
      lastLoginAt: data.last_login_at,
      staffId: data.staff_id ?? undefined,
      studentId: data.student_id ?? undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async deleteUser(userId: string): Promise<void> {
    const supabase = getSupabase();
    const { data: user } = await supabase
      .from('school_xx_users')
      .select('role_id')
      .eq('id', userId)
      .single();

    if (user?.role_id === DEFAULT_ROLE_IDS.SUPER_ADMIN) {
      throw new Error('Cannot delete a Super Admin user.');
    }

    const { error } = await supabase.from('school_xx_users').delete().eq('id', userId);

    if (error) {
      throw new Error('Failed to delete user');
    }
  },

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const supabase = getSupabase();
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const { error } = await supabase
      .from('school_xx_users')
      .update({
        password_hash: passwordHash,
        must_change_password: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error('Failed to reset password');
    }
  },
};
