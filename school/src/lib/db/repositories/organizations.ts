import { getSupabase } from '../supabase';
import type { Organization } from '../../../types';

function rowToOrg(row: Record<string, unknown>): Organization {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: (row.slug as string) || undefined,
    billingEmail: (row.billing_email as string) || undefined,
  };
}

export const organizationsRepository = {
  async getAll(): Promise<Organization[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name');

    if (error) throw new Error('Failed to fetch organizations');
    return (data || []).map(rowToOrg);
  },

  async getById(id: string): Promise<Organization | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return rowToOrg(data);
  },

  async create(org: Omit<Organization, 'id'>): Promise<Organization> {
    const supabase = getSupabase();
    const id = crypto.randomUUID();

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        id,
        name: org.name,
        slug: org.slug || null,
        billing_email: org.billingEmail || null,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create organization');
    return rowToOrg(data);
  },

  async update(id: string, updates: Partial<Omit<Organization, 'id'>>): Promise<Organization> {
    const supabase = getSupabase();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.slug !== undefined) dbUpdates.slug = updates.slug || null;
    if (updates.billingEmail !== undefined) dbUpdates.billing_email = updates.billingEmail || null;

    const { data, error } = await supabase
      .from('organizations')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update organization');
    return rowToOrg(data);
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete organization');
  },
};
