import { getSupabase } from '../supabase';
import type { School, PlanId } from '../../../types';

const DEFAULT_PLAN: PlanId = 'starter';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const schoolsRepository = {
  async getAll(): Promise<School[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_schools')
      .select('*')
      .order('name');

    if (error) throw new Error('Failed to fetch schools');

    return (data || []).map(row => ({
      id: row.id,
      organizationId: row.organization_id as string | undefined,
      name: row.name,
      address: row.address || '',
      contact: row.contact || '',
      isLocked: row.is_locked ?? false,
      planId: (row.plan_id as PlanId) || DEFAULT_PLAN,
    }));
  },

  async getPaginated(page: number = 1, pageSize: number = 10): Promise<PaginatedResult<School>> {
    const supabase = getSupabase();
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from('school_xx_schools')
      .select('*', { count: 'exact' })
      .order('name')
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error('Failed to fetch schools');

    const schools = (data || []).map(row => ({
      id: row.id,
      organizationId: row.organization_id as string | undefined,
      name: row.name,
      address: row.address || '',
      contact: row.contact || '',
      isLocked: row.is_locked ?? false,
      planId: (row.plan_id as PlanId) || DEFAULT_PLAN,
    }));

    return {
      data: schools,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  async getById(id: string): Promise<School | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_schools')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      organizationId: data.organization_id as string | undefined,
      name: data.name,
      address: data.address || '',
      contact: data.contact || '',
      isLocked: data.is_locked ?? false,
      planId: (data.plan_id as PlanId) || DEFAULT_PLAN,
    };
  },

  async create(school: Omit<School, 'id'>): Promise<School> {
    const supabase = getSupabase();
    const id = crypto.randomUUID();

    const payload: Record<string, unknown> = {
      id,
      name: school.name,
      address: school.address,
      contact: school.contact,
      is_locked: school.isLocked ?? false,
      plan_id: school.planId ?? DEFAULT_PLAN,
    };
    if (school.organizationId != null) payload.organization_id = school.organizationId;

    const { data, error } = await supabase
      .from('school_xx_schools')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error('Failed to create school');

    return {
      id: data.id,
      organizationId: data.organization_id as string | undefined,
      name: data.name,
      address: data.address || '',
      contact: data.contact || '',
      isLocked: data.is_locked ?? false,
      planId: (data.plan_id as PlanId) || DEFAULT_PLAN,
    };
  },

  async update(id: string, updates: Partial<Omit<School, 'id'>>): Promise<School> {
    const supabase = getSupabase();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.contact !== undefined) dbUpdates.contact = updates.contact;
    if (updates.isLocked !== undefined) dbUpdates.is_locked = updates.isLocked;
    if (updates.planId !== undefined) dbUpdates.plan_id = updates.planId;
    if (updates.organizationId !== undefined) dbUpdates.organization_id = updates.organizationId;

    const { data, error } = await supabase
      .from('school_xx_schools')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update school');

    return {
      id: data.id,
      organizationId: data.organization_id as string | undefined,
      name: data.name,
      address: data.address || '',
      contact: data.contact || '',
      isLocked: data.is_locked ?? false,
      planId: (data.plan_id as PlanId) || DEFAULT_PLAN,
    };
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('school_xx_schools')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete school');
  },
};
