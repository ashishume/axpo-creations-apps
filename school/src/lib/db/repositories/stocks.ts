import { getSupabase } from '../supabase';
import type { Stock, StockTransaction } from '../../../types';
import type { PaginatedResult } from './schools';

function dbRowToStock(row: Record<string, unknown>, transactions: StockTransaction[] = []): Stock {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    publisherName: row.publisher_name as string,
    description: row.description as string,
    purchaseDate: row.purchase_date as string,
    totalCreditAmount: Number(row.total_credit_amount) || 0,
    transactions,
    status: row.status as Stock['status'],
    settledDate: row.settled_date as string | undefined,
    settledAmount: row.settled_amount != null ? Number(row.settled_amount) : undefined,
    notes: row.notes as string | undefined,
  };
}

export const stocksRepository = {
  async getAll(): Promise<Stock[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_stocks')
      .select('*')
      .order('purchase_date', { ascending: false });

    if (error) throw new Error('Failed to fetch stocks');

    const stockIds = (data || []).map((s: { id: string }) => s.id);
    const { data: transactionsData } = stockIds.length > 0
      ? await supabase.from('school_xx_stock_transactions').select('*').in('stock_id', stockIds)
      : { data: [] };

    const transactionsByStock: Record<string, StockTransaction[]> = {};
    (transactionsData || []).forEach((t: Record<string, unknown>) => {
      const sid = t.stock_id as string;
      if (!transactionsByStock[sid]) transactionsByStock[sid] = [];
      transactionsByStock[sid].push({
        id: t.id as string,
        date: t.date as string,
        type: t.type as StockTransaction['type'],
        amount: Number(t.amount) || 0,
        quantity: t.quantity as number,
        description: t.description as string,
        receiptNumber: t.receipt_number as string | undefined,
      });
    });

    return (data || []).map((row: Record<string, unknown>) => dbRowToStock(row, transactionsByStock[row.id as string] || []));
  },

  async getBySession(sessionId: string): Promise<Stock[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_stocks')
      .select('*')
      .eq('session_id', sessionId)
      .order('purchase_date', { ascending: false });

    if (error) throw new Error('Failed to fetch stocks');

    const stockIds = (data || []).map((s: { id: string }) => s.id);
    const { data: transactionsData } = stockIds.length > 0
      ? await supabase.from('school_xx_stock_transactions').select('*').in('stock_id', stockIds)
      : { data: [] };

    const transactionsByStock: Record<string, StockTransaction[]> = {};
    (transactionsData || []).forEach((t: Record<string, unknown>) => {
      const sid = t.stock_id as string;
      if (!transactionsByStock[sid]) transactionsByStock[sid] = [];
      transactionsByStock[sid].push({
        id: t.id as string,
        date: t.date as string,
        type: t.type as StockTransaction['type'],
        amount: Number(t.amount) || 0,
        quantity: t.quantity as number,
        description: t.description as string,
        receiptNumber: t.receipt_number as string | undefined,
      });
    });

    return (data || []).map((row: Record<string, unknown>) => dbRowToStock(row, transactionsByStock[row.id as string] || []));
  },

  async getPaginated(
    page: number = 1,
    pageSize: number = 10,
    filters?: { sessionId?: string; status?: string; search?: string }
  ): Promise<PaginatedResult<Stock>> {
    const supabase = getSupabase();
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('school_xx_stocks')
      .select('*', { count: 'exact' })
      .order('purchase_date', { ascending: false });

    if (filters?.sessionId) query = query.eq('session_id', filters.sessionId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.search) query = query.or(`publisher_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);

    const { data, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) throw new Error('Failed to fetch stocks');

    const stockIds = (data || []).map((s: { id: string }) => s.id);
    const { data: transactionsData } = stockIds.length > 0
      ? await supabase.from('school_xx_stock_transactions').select('*').in('stock_id', stockIds)
      : { data: [] };

    const transactionsByStock: Record<string, StockTransaction[]> = {};
    (transactionsData || []).forEach((t: Record<string, unknown>) => {
      const sid = t.stock_id as string;
      if (!transactionsByStock[sid]) transactionsByStock[sid] = [];
      transactionsByStock[sid].push({
        id: t.id as string,
        date: t.date as string,
        type: t.type as StockTransaction['type'],
        amount: Number(t.amount) || 0,
        quantity: t.quantity as number,
        description: t.description as string,
        receiptNumber: t.receipt_number as string | undefined,
      });
    });

    const stocks = (data || []).map((row: Record<string, unknown>) => dbRowToStock(row, transactionsByStock[row.id as string] || []));

    return {
      data: stocks,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  async getById(id: string): Promise<Stock | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_stocks')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    const { data: transactionsData } = await supabase
      .from('school_xx_stock_transactions')
      .select('*')
      .eq('stock_id', id);

    const transactions: StockTransaction[] = (transactionsData || []).map((t: Record<string, unknown>) => ({
      id: t.id as string,
      date: t.date as string,
      type: t.type as StockTransaction['type'],
      amount: Number(t.amount) || 0,
      quantity: t.quantity as number,
      description: t.description as string,
      receiptNumber: t.receipt_number as string | undefined,
    }));

    return dbRowToStock(data, transactions);
  },

  async create(stock: Omit<Stock, 'id' | 'transactions'>): Promise<Stock> {
    const supabase = getSupabase();
    const id = crypto.randomUUID();

    const { data, error } = await supabase
      .from('school_xx_stocks')
      .insert({
        id,
        session_id: stock.sessionId,
        publisher_name: stock.publisherName,
        description: stock.description,
        purchase_date: stock.purchaseDate,
        total_credit_amount: stock.totalCreditAmount,
        status: stock.status,
        settled_date: stock.settledDate,
        settled_amount: stock.settledAmount,
        notes: stock.notes,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create stock');
    return dbRowToStock(data, []);
  },

  async createMany(stocks: Omit<Stock, 'id' | 'transactions'>[]): Promise<Stock[]> {
    if (stocks.length === 0) return [];
    const supabase = getSupabase();
    const rows = stocks.map((s) => ({
      id: crypto.randomUUID(),
      session_id: s.sessionId,
      publisher_name: s.publisherName,
      description: s.description,
      purchase_date: s.purchaseDate,
      total_credit_amount: s.totalCreditAmount,
      status: s.status ?? 'open',
      settled_date: s.settledDate,
      settled_amount: s.settledAmount,
      notes: s.notes,
    }));
    const { data, error } = await supabase.from('school_xx_stocks').insert(rows).select();
    if (error) throw new Error('Failed to create stocks');
    return (data || []).map((row: Record<string, unknown>) => dbRowToStock(row, []));
  },

  async update(id: string, updates: Partial<Omit<Stock, 'id' | 'transactions'>>): Promise<Stock> {
    const supabase = getSupabase();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.sessionId !== undefined) dbUpdates.session_id = updates.sessionId;
    if (updates.publisherName !== undefined) dbUpdates.publisher_name = updates.publisherName;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.purchaseDate !== undefined) dbUpdates.purchase_date = updates.purchaseDate;
    if (updates.totalCreditAmount !== undefined) dbUpdates.total_credit_amount = updates.totalCreditAmount;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.settledDate !== undefined) dbUpdates.settled_date = updates.settledDate;
    if (updates.settledAmount !== undefined) dbUpdates.settled_amount = updates.settledAmount;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { data, error } = await supabase
      .from('school_xx_stocks')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update stock');

    const { data: transactionsData } = await supabase
      .from('school_xx_stock_transactions')
      .select('*')
      .eq('stock_id', id);

    const transactions: StockTransaction[] = (transactionsData || []).map((t: Record<string, unknown>) => ({
      id: t.id as string,
      date: t.date as string,
      type: t.type as StockTransaction['type'],
      amount: Number(t.amount) || 0,
      quantity: t.quantity as number,
      description: t.description as string,
      receiptNumber: t.receipt_number as string | undefined,
    }));

    return dbRowToStock(data, transactions);
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('school_xx_stocks')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete stock');
  },

  async addTransaction(stockId: string, transaction: Omit<StockTransaction, 'id'>): Promise<StockTransaction> {
    const supabase = getSupabase();
    const id = crypto.randomUUID();

    const { data, error } = await supabase
      .from('school_xx_stock_transactions')
      .insert({
        id,
        stock_id: stockId,
        date: transaction.date,
        type: transaction.type,
        amount: transaction.amount,
        quantity: transaction.quantity,
        description: transaction.description,
        receipt_number: transaction.receiptNumber,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to add transaction');

    return {
      id: data.id,
      date: data.date,
      type: data.type,
      amount: Number(data.amount),
      quantity: data.quantity,
      description: data.description,
      receiptNumber: data.receipt_number,
    };
  },

  async deleteTransaction(_stockId: string, transactionId: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('school_xx_stock_transactions')
      .delete()
      .eq('id', transactionId);

    if (error) throw new Error('Failed to delete transaction');
  },
};
