import { useState, useRef } from 'react';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '../hooks/useRoles';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FormField } from '../components/ui/FormField';
import { Modal } from '../components/ui/Modal';
import { PermissionGate } from '../components/auth/PermissionGate';
import { SkeletonCard } from '../components/ui/Skeleton';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Shield,
  Lock,
  CheckSquare,
  Square
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { type Role, type Permission, PERMISSION_MODULES, ALL_PERMISSIONS, SUPER_ADMIN_ROLE_NAME } from '../types/auth';

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  students: 'Students',
  staff: 'Staff & Salary',
  expenses: 'Expenses',
  stocks: 'Stocks',
  reports: 'Reports',
  settings: 'Settings',
  users: 'User Management',
  roles: 'Role Management',
  schools: 'Schools & Sessions',
  app: 'App lock',
  plans: 'Plans',
  assistant: 'Axpo Assistant',
  leaves: 'Leave Management',
};

const ACTION_LABELS: Record<string, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  manage: 'Manage',
  use: 'Use',
  approve: 'Approve',
  lock: 'Lock',
};

function getPermissionLabel(permission: Permission): string {
  const [, action] = permission.split(':');
  return `${ACTION_LABELS[action] || action}`;
}

export function RolesPage() {
  const { data: roles, isLoading, error } = useRoles();
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.name === SUPER_ADMIN_ROLE_NAME;
  const displayRoles = (roles ?? []).filter((r) => isSuperAdmin || r.name !== SUPER_ADMIN_ROLE_NAME);

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPermissions, setFormPermissions] = useState<Permission[]>([]);
  const permissionsScrollRef = useRef<HTMLDivElement>(null);

  const openCreateModal = () => {
    setFormName('');
    setFormDescription('');
    setFormPermissions([]);
    setShowCreateModal(true);
  };

  const openEditModal = (role: Role) => {
    setFormName(role.name);
    setFormDescription(role.description || '');
    setFormPermissions([...role.permissions]);
    setEditingRole(role);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formName.trim().toLowerCase() === SUPER_ADMIN_ROLE_NAME.toLowerCase()) {
      return; // Cannot create a role named Super Admin
    }
    try {
      await createRole.mutateAsync({
        name: formName,
        description: formDescription,
        permissions: formPermissions,
      });
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create role:', err);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    
    try {
      await updateRole.mutateAsync({
        id: editingRole.id,
        updates: {
          name: formName,
          description: formDescription,
          permissions: formPermissions,
        },
      });
      setEditingRole(null);
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    
    try {
      await deleteRole.mutateAsync(deletingRole.id);
      setDeletingRole(null);
    } catch (err) {
      console.error('Failed to delete role:', err);
    }
  };

  const togglePermission = (permission: Permission) => {
    const scrollTop = permissionsScrollRef.current?.scrollTop ?? 0;
    if (formPermissions.includes(permission)) {
      setFormPermissions(formPermissions.filter(p => p !== permission));
    } else {
      setFormPermissions([...formPermissions, permission]);
    }
    setTimeout(() => {
      permissionsScrollRef.current && (permissionsScrollRef.current.scrollTop = scrollTop);
    }, 0);
  };

  const toggleModulePermissions = (moduleKey: string) => {
    const scrollTop = permissionsScrollRef.current?.scrollTop ?? 0;
    const modulePerms = PERMISSION_MODULES[moduleKey as keyof typeof PERMISSION_MODULES] as readonly Permission[];
    const allSelected = modulePerms.every(p => formPermissions.includes(p as Permission));
    
    if (allSelected) {
      setFormPermissions(formPermissions.filter(p => !modulePerms.includes(p as Permission)));
    } else {
      const newPerms = new Set([...formPermissions, ...modulePerms]);
      setFormPermissions(Array.from(newPerms) as Permission[]);
    }
    setTimeout(() => {
      permissionsScrollRef.current && (permissionsScrollRef.current.scrollTop = scrollTop);
    }, 0);
  };

  const selectAllPermissions = () => {
    setFormPermissions([...ALL_PERMISSIONS] as Permission[]);
  };

  const clearAllPermissions = () => {
    setFormPermissions([]);
  };

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
        Failed to load roles: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  const PermissionsEditor = ({ disabled = false }: { disabled?: boolean }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Permissions</span>
        {!disabled && (
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={selectAllPermissions}>
              Select All
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clearAllPermissions}>
              Clear All
            </Button>
          </div>
        )}
      </div>
      
      <div
        ref={permissionsScrollRef}
        className="max-h-96 space-y-4 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4"
      >
        {Object.entries(PERMISSION_MODULES).map(([moduleKey, modulePerms]) => {
          const allSelected = modulePerms.every(p => formPermissions.includes(p as Permission));
          const someSelected = modulePerms.some(p => formPermissions.includes(p as Permission));
          
          return (
            <div key={moduleKey} className="space-y-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (!disabled) toggleModulePermissions(moduleKey);
                }}
                disabled={disabled}
                className={`flex items-center gap-2 text-sm font-medium ${disabled ? 'cursor-not-allowed text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
              >
                {allSelected ? (
                  <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                ) : someSelected ? (
                  <div className="h-4 w-4 rounded border border-indigo-600 dark:border-indigo-400 bg-indigo-100 dark:bg-indigo-900/50" />
                ) : (
                  <Square className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                )}
                {MODULE_LABELS[moduleKey] || moduleKey}
              </button>
              
              <div className="ml-6 flex flex-wrap gap-2">
                {modulePerms.map((perm) => {
                  const isSelected = formPermissions.includes(perm as Permission);
                  return (
                    <button
                      key={perm}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!disabled) togglePermission(perm as Permission);
                      }}
                      disabled={disabled}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        disabled
                          ? isSelected
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                          : isSelected
                          ? 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {getPermissionLabel(perm as Permission)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {formPermissions.length} of {ALL_PERMISSIONS.length} permissions selected
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Roles & Permissions</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage roles and configure access permissions</p>
        </div>
        <PermissionGate permission="roles:manage">
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayRoles.map((role) => (
            <div
              key={role.id}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    role.isSystem ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-indigo-100 dark:bg-indigo-900/50'
                  }`}>
                    {role.isSystem ? (
                      <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{role.name}</h3>
                    {role.isSystem && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">System Role</span>
                    )}
                  </div>
                </div>
                
                {!role.isSystem && (
                  <PermissionGate permission="roles:manage">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(role)}
                        title="Edit role"
                      >
                        <Pencil className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingRole(role)}
                        title="Delete role"
                      >
                        <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                      </Button>
                    </div>
                  </PermissionGate>
                )}
              </div>
              
              {role.description && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{role.description}</p>
              )}
              
              <div className="mt-4">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                  {role.permissions.length} permissions
                </div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 5).map((perm) => (
                    <span
                      key={perm}
                      className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300"
                    >
                      {perm}
                    </span>
                  ))}
                  {role.permissions.length > 5 && (
                    <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                      +{role.permissions.length - 5} more
                    </span>
                  )}
                </div>
              </div>
              
              {role.isSystem && (
                <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                  System roles cannot be modified or deleted
                </p>
              )}
            </div>
          ))}
          
          {displayRoles.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
              No roles found
            </div>
          )}
        </div>
      )}

      {/* Create Role Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Role"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          <FormField label="Role Name" required>
            <Input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              placeholder="e.g., Accountant"
            />
          </FormField>
          <FormField label="Description">
            <Input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Brief description of this role"
            />
          </FormField>
          
          <PermissionsEditor />
          
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRole.isPending}>
              {createRole.isPending ? 'Creating...' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        open={!!editingRole}
        onClose={() => setEditingRole(null)}
        title={`Edit Role: ${editingRole?.name}`}
      >
        {editingRole && (
          <form onSubmit={handleUpdateRole} className="space-y-4">
            <FormField label="Role Name" required>
              <Input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                disabled={editingRole.isSystem}
                className={editingRole.isSystem ? "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400" : undefined}
              />
            </FormField>
            <FormField label="Description">
              <Input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                disabled={editingRole.isSystem}
                className={editingRole.isSystem ? "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400" : undefined}
              />
            </FormField>
            
            <PermissionsEditor disabled={editingRole.isSystem} />
            
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditingRole(null)}>
                Cancel
              </Button>
              {!editingRole.isSystem && (
                <Button type="submit" disabled={updateRole.isPending}>
                  {updateRole.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        title="Delete Role"
      >
        {deletingRole && (
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete the role{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{deletingRole.name}</span>? Users with this role will
              lose their permissions.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeletingRole(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteRole}
                disabled={deleteRole.isPending}
              >
                {deleteRole.isPending ? 'Deleting...' : 'Delete Role'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
