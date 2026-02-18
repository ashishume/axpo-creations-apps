// Permission types - granular permissions for role-based access control
export type Permission =
  | 'dashboard:view'
  | 'students:view'
  | 'students:create'
  | 'students:edit'
  | 'students:delete'
  | 'staff:view'
  | 'staff:create'
  | 'staff:edit'
  | 'staff:delete'
  | 'expenses:view'
  | 'expenses:create'
  | 'expenses:edit'
  | 'expenses:delete'
  | 'stocks:view'
  | 'stocks:create'
  | 'stocks:edit'
  | 'stocks:delete'
  | 'reports:view'
  | 'settings:view'
  | 'settings:edit'
  | 'users:view'
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'roles:manage'
  | 'schools:view'
  | 'schools:create'
  | 'schools:edit'
  | 'schools:delete'
  | 'app:lock'
  | 'plans:manage'
  | 'assistant:use';

// Permission metadata for UI display
export interface PermissionMeta {
  id: Permission;
  module: string;
  action: string;
  description: string;
}

// All permissions grouped by module
export const PERMISSION_MODULES = {
  dashboard: ['dashboard:view'],
  students: ['students:view', 'students:create', 'students:edit', 'students:delete'],
  staff: ['staff:view', 'staff:create', 'staff:edit', 'staff:delete'],
  expenses: ['expenses:view', 'expenses:create', 'expenses:edit', 'expenses:delete'],
  stocks: ['stocks:view', 'stocks:create', 'stocks:edit', 'stocks:delete'],
  reports: ['reports:view'],
  settings: ['settings:view', 'settings:edit'],
  users: ['users:view', 'users:create', 'users:edit', 'users:delete'],
  roles: ['roles:manage'],
  schools: ['schools:view', 'schools:create', 'schools:edit', 'schools:delete'],
  app: ['app:lock'],
  plans: ['plans:manage'],
  assistant: ['assistant:use'],
} as const;

// All available permissions
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSION_MODULES).flat() as Permission[];

// Role interface
export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean; // System roles (admin) cannot be deleted
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

// Database role record
export interface DbRole {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

// User interface
export interface User {
  id: string;
  authUserId?: string; // Link to Supabase auth.users
  /** Organization this user belongs to (null = platform Super Admin). */
  organizationId?: string | null;
  username: string;
  email?: string;
  name: string;
  roleId: string;
  role?: Role;
  mustChangePassword: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  staffId?: string; // Link to staff if user is a staff member
  studentId?: string; // Link to student if user is a student
  createdAt: string;
  updatedAt: string;
}

// Database user record
export interface DbUser {
  id: string;
  auth_user_id: string | null;
  organization_id: string | null;
  username: string;
  email: string | null;
  name: string;
  role_id: string;
  password_hash: string | null;
  must_change_password: boolean;
  is_active: boolean;
  last_login_at: string | null;
  staff_id: string | null;
  student_id: string | null;
  created_at: string;
  updated_at: string;
}

// Login credentials
export interface LoginCredentials {
  username: string;
  password: string;
}

// Change password request
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Create user request
export interface CreateUserRequest {
  username: string;
  email?: string;
  name: string;
  roleId: string;
  password: string;
  /** Organization the user belongs to (required for non–Super Admin; Super Admin has null). */
  organizationId?: string | null;
  staffId?: string;
  studentId?: string;
}

// Update user request
export interface UpdateUserRequest {
  email?: string;
  name?: string;
  roleId?: string;
  isActive?: boolean;
  /** Organization the user belongs to (null = Super Admin). */
  organizationId?: string | null;
  staffId?: string | null;
  studentId?: string | null;
}

// Auth state
export interface AuthState {
  user: User | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth context value
export interface AuthContextValue extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (request: ChangePasswordRequest) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  refreshUser: () => Promise<void>;
}

// Default role IDs (matching schema.sql)
export const DEFAULT_ROLE_IDS = {
  SUPER_ADMIN: '00000000-0000-0000-0000-000000000000',
  ADMIN: '00000000-0000-0000-0000-000000000001',
  MANAGER: '00000000-0000-0000-0000-000000000002',
  TEACHER: '00000000-0000-0000-0000-000000000003',
  STUDENT: '00000000-0000-0000-0000-000000000004',
} as const;

/** Role name used to hide super admin users from Admin in user management */
export const SUPER_ADMIN_ROLE_NAME = 'Super Admin';

// Helper to convert DB user to app user
export function dbUserToUser(dbUser: DbUser, role?: Role): User {
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
}

// Helper to convert DB role to app role
export function dbRoleToRole(dbRole: DbRole, permissions: Permission[]): Role {
  return {
    id: dbRole.id,
    name: dbRole.name,
    description: dbRole.description ?? undefined,
    isSystem: dbRole.is_system,
    permissions,
    createdAt: dbRole.created_at,
    updatedAt: dbRole.updated_at,
  };
}
