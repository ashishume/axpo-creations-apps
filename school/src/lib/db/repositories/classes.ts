import { getSupabase } from '../supabase';
import type { StudentClass } from '../../../types';
import type { PaginatedResult } from './schools';

function mapRow(row: Record<string, unknown>): StudentClass {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    name: row.name as string,
    registrationFees: Number(row.registration_fees) || 0,
    annualFund: Number(row.annual_fund) || 0,
    monthlyFees: Number(row.monthly_fees) || 0,
    lateFeeAmount: Number(row.late_fee_amount) || 0,
    lateFeeFrequency: ((row.late_fee_frequency as string) || 'weekly') as StudentClass['lateFeeFrequency'],
    dueDayOfMonth: Number(row.due_day_of_month) || 10,
  };
}

export const classesRepository = {
  async getAll(): Promise<StudentClass[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_classes')
      .select('*')
      .order('name');

    if (error) throw new Error('Failed to fetch classes');
    return (data || []).map(mapRow);
  },

  async getBySession(sessionId: string): Promise<StudentClass[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_classes')
      .select('*')
      .eq('session_id', sessionId)
      .order('name');

    if (error) throw new Error('Failed to fetch classes');
    return (data || []).map(mapRow);
  },

  async getPaginated(page: number = 1, pageSize: number = 10, sessionId?: string): Promise<PaginatedResult<StudentClass>> {
    const supabase = getSupabase();
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('school_xx_classes')
      .select('*', { count: 'exact' })
      .order('name');

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) throw new Error('Failed to fetch classes');

    return {
      data: (data || []).map(mapRow),
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  async getById(id: string): Promise<StudentClass | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_classes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapRow(data);
  },

  async create(studentClass: Omit<StudentClass, 'id'>): Promise<StudentClass> {
    const supabase = getSupabase();
    const id = crypto.randomUUID();

    const { data, error } = await supabase
      .from('school_xx_classes')
      .insert({
        id,
        session_id: studentClass.sessionId,
        name: studentClass.name,
        registration_fees: studentClass.registrationFees,
        annual_fund: studentClass.annualFund,
        monthly_fees: studentClass.monthlyFees,
        late_fee_amount: studentClass.lateFeeAmount,
        late_fee_frequency: studentClass.lateFeeFrequency,
        due_day_of_month: studentClass.dueDayOfMonth,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create class');
    return mapRow(data);
  },

  async createMany(classes: Omit<StudentClass, 'id'>[]): Promise<StudentClass[]> {
    if (classes.length === 0) return [];
    const supabase = getSupabase();
    const rows = classes.map((c) => ({
      id: crypto.randomUUID(),
      session_id: c.sessionId,
      name: c.name,
      registration_fees: c.registrationFees,
      annual_fund: c.annualFund,
      monthly_fees: c.monthlyFees,
      late_fee_amount: c.lateFeeAmount,
      late_fee_frequency: c.lateFeeFrequency,
      due_day_of_month: c.dueDayOfMonth,
    }));
    const { data, error } = await supabase.from('school_xx_classes').insert(rows).select();
    if (error) throw new Error('Failed to create classes');
    return (data || []).map(mapRow);
  },

  async update(id: string, updates: Partial<Omit<StudentClass, 'id'>>): Promise<StudentClass> {
    const supabase = getSupabase();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.sessionId !== undefined) dbUpdates.session_id = updates.sessionId;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.registrationFees !== undefined) dbUpdates.registration_fees = updates.registrationFees;
    if (updates.annualFund !== undefined) dbUpdates.annual_fund = updates.annualFund;
    if (updates.monthlyFees !== undefined) dbUpdates.monthly_fees = updates.monthlyFees;
    if (updates.lateFeeAmount !== undefined) dbUpdates.late_fee_amount = updates.lateFeeAmount;
    if (updates.lateFeeFrequency !== undefined) dbUpdates.late_fee_frequency = updates.lateFeeFrequency;
    if (updates.dueDayOfMonth !== undefined) dbUpdates.due_day_of_month = updates.dueDayOfMonth;

    const { data, error } = await supabase
      .from('school_xx_classes')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update class');
    return mapRow(data);
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('school_xx_classes')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete class');
  },
};
