import { getSupabase } from '../supabase';
import type { Session } from '../../../types';
import type { PaginatedResult } from './schools';

export const sessionsRepository = {
  async getAll(): Promise<Session[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw new Error('Failed to fetch sessions');

    return (data || []).map(row => ({
      id: row.id,
      schoolId: row.school_id,
      year: row.year,
      startDate: row.start_date,
      endDate: row.end_date,
      salaryDueDay: row.salary_due_day ?? undefined,
    }));
  },

  async getBySchool(schoolId: string): Promise<Session[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('school_id', schoolId)
      .order('start_date', { ascending: false });

    if (error) throw new Error('Failed to fetch sessions');

    return (data || []).map(row => ({
      id: row.id,
      schoolId: row.school_id,
      year: row.year,
      startDate: row.start_date,
      endDate: row.end_date,
      salaryDueDay: row.salary_due_day ?? undefined,
    }));
  },

  async getPaginated(page: number = 1, pageSize: number = 10, schoolId?: string): Promise<PaginatedResult<Session>> {
    const supabase = getSupabase();
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('sessions')
      .select('*', { count: 'exact' })
      .order('start_date', { ascending: false });

    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }

    const { data, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) throw new Error('Failed to fetch sessions');

    const sessions = (data || []).map(row => ({
      id: row.id,
      schoolId: row.school_id,
      year: row.year,
      startDate: row.start_date,
      endDate: row.end_date,
      salaryDueDay: row.salary_due_day ?? undefined,
    }));

    return {
      data: sessions,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  async getById(id: string): Promise<Session | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      schoolId: data.school_id,
      year: data.year,
      startDate: data.start_date,
      endDate: data.end_date,
      salaryDueDay: data.salary_due_day ?? undefined,
    };
  },

  async create(session: Omit<Session, 'id'>): Promise<Session> {
    const supabase = getSupabase();
    const id = crypto.randomUUID();

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        id,
        school_id: session.schoolId,
        year: session.year,
        start_date: session.startDate,
        end_date: session.endDate,
        salary_due_day: session.salaryDueDay ?? 5,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create session');

    return {
      id: data.id,
      schoolId: data.school_id,
      year: data.year,
      startDate: data.start_date,
      endDate: data.end_date,
      salaryDueDay: data.salary_due_day ?? undefined,
    };
  },

  async update(id: string, updates: Partial<Omit<Session, 'id'>>): Promise<Session> {
    const supabase = getSupabase();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.schoolId !== undefined) dbUpdates.school_id = updates.schoolId;
    if (updates.year !== undefined) dbUpdates.year = updates.year;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.salaryDueDay !== undefined) dbUpdates.salary_due_day = updates.salaryDueDay;

    const { data, error } = await supabase
      .from('sessions')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update session');

    return {
      id: data.id,
      schoolId: data.school_id,
      year: data.year,
      startDate: data.start_date,
      endDate: data.end_date,
      salaryDueDay: data.salary_due_day ?? undefined,
    };
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete session');
  },
};
