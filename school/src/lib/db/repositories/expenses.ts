import { getSupabase } from '../supabase';
import type { Expense } from '../../../types';
import type { PaginatedResult } from './schools';

function dbRowToExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    date: row.date as string,
    amount: Number(row.amount) || 0,
    category: row.category as Expense['category'],
    description: row.description as string,
    vendorPayee: row.vendor_payee as string,
    paymentMethod: row.payment_method as Expense['paymentMethod'],
    tags: row.tags as string[] | undefined,
  };
}

export const expensesRepository = {
  async getAll(): Promise<Expense[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw new Error('Failed to fetch expenses');
    return (data || []).map(dbRowToExpense);
  },

  async getBySession(sessionId: string): Promise<Expense[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_expenses')
      .select('*')
      .eq('session_id', sessionId)
      .order('date', { ascending: false });

    if (error) throw new Error('Failed to fetch expenses');
    return (data || []).map(dbRowToExpense);
  },

  async getPaginated(
    page: number = 1,
    pageSize: number = 10,
    filters?: { sessionId?: string; category?: string; search?: string; startDate?: string; endDate?: string }
  ): Promise<PaginatedResult<Expense>> {
    const supabase = getSupabase();
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('school_xx_expenses')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false });

    if (filters?.sessionId) query = query.eq('session_id', filters.sessionId);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.search) query = query.or(`description.ilike.%${filters.search}%,vendor_payee.ilike.%${filters.search}%`);
    if (filters?.startDate) query = query.gte('date', filters.startDate);
    if (filters?.endDate) query = query.lte('date', filters.endDate);

    const { data, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) throw new Error('Failed to fetch expenses');

    return {
      data: (data || []).map(dbRowToExpense),
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  async getById(id: string): Promise<Expense | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return dbRowToExpense(data);
  },

  async create(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const supabase = getSupabase();
    const id = crypto.randomUUID();

    const { data, error } = await supabase
      .from('school_xx_expenses')
      .insert({
        id,
        session_id: expense.sessionId,
        date: expense.date,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        vendor_payee: expense.vendorPayee,
        payment_method: expense.paymentMethod,
        tags: expense.tags,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create expense');
    return dbRowToExpense(data);
  },

  async createMany(expenses: Omit<Expense, 'id'>[]): Promise<Expense[]> {
    if (expenses.length === 0) return [];
    const supabase = getSupabase();
    const rows = expenses.map((e) => ({
      id: crypto.randomUUID(),
      session_id: e.sessionId,
      date: e.date,
      amount: e.amount,
      category: e.category,
      description: e.description,
      vendor_payee: e.vendorPayee,
      payment_method: e.paymentMethod,
      tags: e.tags,
    }));
    const { data, error } = await supabase.from('school_xx_expenses').insert(rows).select();
    if (error) throw new Error('Failed to create expenses');
    return (data || []).map(dbRowToExpense);
  },

  async update(id: string, updates: Partial<Omit<Expense, 'id'>>): Promise<Expense> {
    const supabase = getSupabase();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.sessionId !== undefined) dbUpdates.session_id = updates.sessionId;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.vendorPayee !== undefined) dbUpdates.vendor_payee = updates.vendorPayee;
    if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

    const { data, error } = await supabase
      .from('school_xx_expenses')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update expense');
    return dbRowToExpense(data);
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('school_xx_expenses')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete expense');
  },
};
