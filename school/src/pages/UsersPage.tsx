import { useState, useMemo } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useResetPassword } from '../hooks/useUsers';
import { useRoles } from '../hooks/useRoles';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Pagination, usePagination } from '../components/ui/Pagination';
import { PermissionGate } from '../components/auth/PermissionGate';
import { SkeletonTable } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  KeyRound, 
  UserCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { User, CreateUserRequest } from '../types/auth';
import { SUPER_ADMIN_ROLE_NAME } from '../types/auth';

export function UsersPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination(10);
  const { data, isLoading, error } = useUsers(page, pageSize);
  const { data: roles } = useRoles();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetPassword();
  const { user: currentUser } = useAuth();
  const { organizations, schools, sessions, staff } = useApp();
  const currentUserRoleName = currentUser?.role?.name ?? '';
  const isSuperAdmin = currentUserRoleName === SUPER_ADMIN_ROLE_NAME;
  const displayUsers = useMemo(() => {
    if (!data?.users) return [];
    if (isSuperAdmin) return data.users;
    return data.users.filter((u: User) => {
      const roleName = roles?.find((r) => r.id === u.roleId)?.name ?? u.role?.name;
      return roleName !== SUPER_ADMIN_ROLE_NAME;
    });
  }, [data?.users, roles, isSuperAdmin]);

  // Roles available for assign when creating/editing users (Super Admin cannot be assigned)
  const rolesForSelect = useMemo(
    () => (roles ?? []).filter((r) => r.name !== SUPER_ADMIN_ROLE_NAME),
    [roles]
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Create user form state
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    username: '',
    email: '',
    name: '',
    roleId: '',
    password: '',
    organizationId: null,
    staffId: undefined,
  });

  // Staff options for the selected org (for Manager / school-scoped access). Label: "Name (School – Session)"
  const staffOptionsForCurrentOrg = useMemo(() => {
    const orgId = createForm.organizationId || editingUser?.organizationId;
    if (!orgId) return [];
    const schoolIds = new Set(schools.filter((s) => s.organizationId === orgId).map((s) => s.id));
    const sessionIds = new Set(sessions.filter((s) => schoolIds.has(s.schoolId)).map((s) => s.id));
    return staff
      .filter((s) => sessionIds.has(s.sessionId))
      .map((s) => {
        const session = sessions.find((ss) => ss.id === s.sessionId);
        const school = session ? schools.find((sc) => sc.id === session.schoolId) : null;
        return { id: s.id, label: `${s.name} (${school?.name ?? '?'} – ${session?.year ?? '?'})` };
      });
  }, [createForm.organizationId, editingUser?.organizationId, schools, sessions, staff]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const organizationId = isSuperAdmin ? (createForm.organizationId ?? undefined) : (currentUser?.organizationId ?? undefined);
    if (!organizationId) return;
    try {
      await createUser.mutateAsync({
        ...createForm,
        organizationId: organizationId || null,
      });
      setShowCreateModal(false);
      setCreateForm({ username: '', email: '', name: '', roleId: '', password: '', organizationId: null, staffId: undefined });
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      await updateUser.mutateAsync({
        id: editingUser.id,
        updates: {
          name: editingUser.name,
          email: editingUser.email,
          roleId: editingUser.roleId,
          isActive: editingUser.isActive,
          organizationId: editingUser.organizationId ?? null,
          staffId: editingUser.staffId ?? null,
        },
      });
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    try {
      await deleteUser.mutateAsync(deletingUser.id);
      setDeletingUser(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPassword) return;
    
    try {
      await resetPassword.mutateAsync({ userId: resetPasswordUser.id, newPassword });
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (err) {
      console.error('Failed to reset password:', err);
    }
  };

  const getRoleName = (roleId: string) => {
    return roles?.find(r => r.id === roleId)?.name || 'Unknown';
  };

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        Failed to load users: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-600">Manage user accounts and access</p>
        </div>
        <PermissionGate permission="users:create">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Role
                  </th>
                  {isSuperAdmin && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                        Organization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                        Scope
                      </th>
                    </>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {displayUsers.map((user: User) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                          <UserCircle className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{getRoleName(user.roleId)}</td>
                    {isSuperAdmin && (
                      <>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {user.organizationId
                            ? organizations.find((o) => o.id === user.organizationId)?.name ?? '—'
                            : 'Super Admin'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {user.staffId
                            ? (() => {
                                const s = staff.find((st) => st.id === user.staffId);
                                const session = s ? sessions.find((ss) => ss.id === s.sessionId) : null;
                                const school = session ? schools.find((sc) => sc.id === session.schoolId) : null;
                                return school ? `${school.name} (${session?.year ?? '?'})` : '—';
                              })()
                            : 'All schools in org'}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                      {user.mustChangePassword && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          Must change password
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <PermissionGate permission="users:edit">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                            disabled={user.id === currentUser?.id}
                            title={user.id === currentUser?.id ? "Cannot edit your own account here" : "Edit user"}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setResetPasswordUser(user)}
                            title="Reset password"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        <PermissionGate permission="users:delete">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingUser(user)}
                            disabled={user.id === currentUser?.id || user.role?.isSystem}
                            title={
                              user.id === currentUser?.id
                                ? "Cannot delete your own account"
                                : user.role?.isSystem
                                ? "Cannot delete system admin"
                                : "Delete user"
                            }
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
                {displayUsers.length === 0 && (
                  <tr>
                    <td colSpan={isSuperAdmin ? 7 : 5} className="px-6 py-12 text-center text-slate-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && data.total > 0 && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(data.total / pageSize)}
              totalItems={data.total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </>
      )}

      {/* Create User Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
            <input
              type="text"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Username for login"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email (optional)</label>
            <input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select
              value={createForm.roleId}
              onChange={(e) => setCreateForm({ ...createForm, roleId: e.target.value })}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Select a role</option>
              {rolesForSelect.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          {isSuperAdmin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Organization</label>
              {organizations.length === 0 ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Create at least one organization first: go to <strong>Organizations</strong> in the sidebar, then add an organization. After that, you can assign new users to an org here.
                </p>
              ) : (
                <>
                  <select
                    value={createForm.organizationId ?? ''}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        organizationId: e.target.value || null,
                        staffId: undefined,
                      })
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    User will see only schools and data under this org.
                  </p>
                </>
              )}
            </div>
          )}
          {isSuperAdmin && (createForm.organizationId || editingUser?.organizationId) && staffOptionsForCurrentOrg.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Link to staff (optional)</label>
              <select
                value={createForm.staffId ?? ''}
                onChange={(e) => setCreateForm({ ...createForm, staffId: e.target.value || undefined })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">No link (org-level: sees all schools in org)</option>
                {staffOptionsForCurrentOrg.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                If set, user is school-scoped (Manager): they see only that staff member’s school.
              </p>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Default Password</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              required
              minLength={6}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Minimum 6 characters"
            />
            <p className="mt-1 text-xs text-slate-500">
              User will be required to change this on first login
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User"
      >
        {editingUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
              <input
                type="text"
                value={editingUser.username}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500">Username cannot be changed</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={editingUser.email || ''}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
              <select
                value={editingUser.roleId}
                onChange={(e) => setEditingUser({ ...editingUser, roleId: e.target.value })}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {rolesForSelect.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            {isSuperAdmin && organizations.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Organization</label>
                <select
                  value={editingUser.organizationId ?? ''}
                  onChange={(e) => {
                    const orgId = e.target.value || null;
                    setEditingUser({
                      ...editingUser,
                      organizationId: orgId ?? undefined,
                      staffId: orgId !== editingUser.organizationId ? undefined : editingUser.staffId,
                    });
                  }}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">—</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {isSuperAdmin && (editingUser.organizationId || createForm.organizationId) && staffOptionsForCurrentOrg.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Link to staff (optional)</label>
                <select
                  value={editingUser.staffId ?? ''}
                  onChange={(e) => setEditingUser({ ...editingUser, staffId: e.target.value || undefined })}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">No link (org-level: sees all schools in org)</option>
                  {staffOptionsForCurrentOrg.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  If set, user is school-scoped: they see only that staff member’s school.
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={editingUser.isActive}
                onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isActive" className="text-sm text-slate-700">
                Account is active
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Delete User"
      >
        {deletingUser && (
          <div className="space-y-4">
            <p className="text-slate-600">
              Are you sure you want to delete the user{' '}
              <span className="font-semibold">{deletingUser.name}</span>? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeletingUser(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteUser}
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={!!resetPasswordUser}
        onClose={() => {
          setResetPasswordUser(null);
          setNewPassword('');
        }}
        title="Reset Password"
      >
        {resetPasswordUser && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-slate-600">
              Reset password for <span className="font-semibold">{resetPasswordUser.name}</span>
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Minimum 6 characters"
              />
              <p className="mt-1 text-xs text-slate-500">
                User will be required to change this on their next login
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setResetPasswordUser(null);
                  setNewPassword('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={resetPassword.isPending}>
                {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
