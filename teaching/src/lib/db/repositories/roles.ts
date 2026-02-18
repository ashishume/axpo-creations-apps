import { getSupabase } from '../supabase';
import type { Role, Permission } from '../../../types/auth';
import { ALL_PERMISSIONS, SUPER_ADMIN_ROLE_NAME } from '../../../types/auth';

export const rolesRepository = {
  async getAll(): Promise<Role[]> {
    const supabase = getSupabase();
    const { data: dbRoles, error } = await supabase
      .from('school_xx_roles')
      .select('*')
      .order('name');

    if (error) throw new Error('Failed to fetch roles');

    const { data: rolePerms } = await supabase
      .from('school_xx_role_permissions')
      .select('role_id, permission_id');

    const permissionsByRole: Record<string, Permission[]> = {};
    (rolePerms || []).forEach((rp: { role_id: string; permission_id: string }) => {
      if (!permissionsByRole[rp.role_id]) permissionsByRole[rp.role_id] = [];
      permissionsByRole[rp.role_id].push(rp.permission_id as Permission);
    });

    return (dbRoles || []).map((dbRole: Record<string, unknown>) => ({
      id: dbRole.id as string,
      name: dbRole.name as string,
      description: dbRole.description as string | undefined,
      isSystem: dbRole.is_system as boolean,
      permissions: permissionsByRole[dbRole.id as string] || [],
      createdAt: dbRole.created_at as string,
      updatedAt: dbRole.updated_at as string,
    }));
  },

  async getById(id: string): Promise<Role | null> {
    const supabase = getSupabase();
    const { data: dbRole, error } = await supabase
      .from('school_xx_roles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !dbRole) return null;

    const { data: rolePerms } = await supabase
      .from('school_xx_role_permissions')
      .select('permission_id')
      .eq('role_id', id);

    const permissions = (rolePerms || []).map((rp: { permission_id: string }) => rp.permission_id as Permission);

    return {
      id: dbRole.id,
      name: dbRole.name,
      description: dbRole.description,
      isSystem: dbRole.is_system,
      permissions,
      createdAt: dbRole.created_at,
      updatedAt: dbRole.updated_at,
    };
  },

  async create(role: { name: string; description?: string; permissions: Permission[] }): Promise<Role> {
    if (role.name.trim().toLowerCase() === SUPER_ADMIN_ROLE_NAME.toLowerCase()) {
      throw new Error('Cannot create a role named Super Admin. Super Admin is system-managed.');
    }

    const supabase = getSupabase();
    const id = crypto.randomUUID();

    const { data, error } = await supabase
      .from('school_xx_roles')
      .insert({
        id,
        name: role.name,
        description: role.description,
        is_system: false,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create role');

    if (role.permissions.length > 0) {
      const { error: permError } = await supabase
        .from('school_xx_role_permissions')
        .insert(
          role.permissions.map(p => ({
            role_id: id,
            permission_id: p,
          }))
        );

      if (permError) {
        await supabase.from('school_xx_roles').delete().eq('id', id);
        throw new Error('Failed to assign permissions');
      }
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      isSystem: data.is_system,
      permissions: role.permissions,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async update(id: string, updates: { name?: string; description?: string; permissions?: Permission[] }): Promise<Role> {
    const supabase = getSupabase();

    const { data: existingRole } = await supabase
      .from('school_xx_roles')
      .select('is_system, name')
      .eq('id', id)
      .single();

    if (existingRole?.is_system) {
      throw new Error('Cannot modify system roles');
    }

    if (updates.name !== undefined && updates.name.trim().toLowerCase() === SUPER_ADMIN_ROLE_NAME.toLowerCase()) {
      throw new Error('Cannot rename a role to Super Admin.');
    }

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;

    const { data, error } = await supabase
      .from('school_xx_roles')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update role');

    if (updates.permissions !== undefined) {
      await supabase
        .from('school_xx_role_permissions')
        .delete()
        .eq('role_id', id);

      if (updates.permissions.length > 0) {
        await supabase
          .from('school_xx_role_permissions')
          .insert(
            updates.permissions.map(p => ({
              role_id: id,
              permission_id: p,
            }))
          );
      }
    }

    const { data: rolePerms } = await supabase
      .from('school_xx_role_permissions')
      .select('permission_id')
      .eq('role_id', id);

    const permissions = (rolePerms || []).map((rp: { permission_id: string }) => rp.permission_id as Permission);

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      isSystem: data.is_system,
      permissions,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase();

    const { data: existingRole } = await supabase
      .from('school_xx_roles')
      .select('is_system')
      .eq('id', id)
      .single();

    if (existingRole?.is_system) {
      throw new Error('Cannot delete system roles');
    }

    const { error } = await supabase
      .from('school_xx_roles')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete role');
  },

  async getAllPermissions(): Promise<Permission[]> {
    return ALL_PERMISSIONS as unknown as Permission[];
  },
};
