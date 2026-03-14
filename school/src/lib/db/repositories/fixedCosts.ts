import { getSupabase } from '../supabase';
import type { FixedMonthlyCost } from '../../../types';

function dbRowToFixedCost(row: Record<string, unknown>): FixedMonthlyCost {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    name: row.name as string,
    amount: Number(row.amount) || 0,
    category: row.category as FixedMonthlyCost['category'],
    isActive: row.is_active as boolean ?? true,
  };
}

export const fixedCostsRepository = {
  async getAll(): Promise<FixedMonthlyCost[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('fixed_monthly_costs')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error('Failed to fetch fixed costs');
    return (data || []).map(dbRowToFixedCost);
  },

  async getBySession(sessionId: string): Promise<FixedMonthlyCost[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('fixed_monthly_costs')
      .select('*')
      .eq('session_id', sessionId)
      .order('name', { ascending: true });

    if (error) throw new Error('Failed to fetch fixed costs');
    return (data || []).map(dbRowToFixedCost);
  },

  async getById(id: string): Promise<FixedMonthlyCost | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('fixed_monthly_costs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbRowToFixedCost(data);
  },

  async create(cost: Omit<FixedMonthlyCost, 'id'>): Promise<FixedMonthlyCost> {
    const supabase = getSupabase();
    const id = crypto.randomUUID();

    const { data, error } = await supabase
      .from('fixed_monthly_costs')
      .insert({
        id,
        session_id: cost.sessionId,
        name: cost.name,
        amount: cost.amount,
        category: cost.category,
        is_active: cost.isActive ?? true,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create fixed cost');
    return dbRowToFixedCost(data);
  },

  async createMany(costs: Omit<FixedMonthlyCost, 'id'>[]): Promise<FixedMonthlyCost[]> {
    if (costs.length === 0) return [];
    const supabase = getSupabase();
    const rows = costs.map((c) => ({
      id: crypto.randomUUID(),
      session_id: c.sessionId,
      name: c.name,
      amount: c.amount,
      category: c.category,
      is_active: c.isActive ?? true,
    }));
    const { data, error } = await supabase.from('fixed_monthly_costs').insert(rows).select();
    if (error) throw new Error('Failed to create fixed costs');
    return (data || []).map(dbRowToFixedCost);
  },

  async update(id: string, updates: Partial<Omit<FixedMonthlyCost, 'id'>>): Promise<FixedMonthlyCost> {
    const supabase = getSupabase();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.sessionId !== undefined) dbUpdates.session_id = updates.sessionId;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('fixed_monthly_costs')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update fixed cost');
    return dbRowToFixedCost(data);
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('fixed_monthly_costs')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete fixed cost');
  },
};
