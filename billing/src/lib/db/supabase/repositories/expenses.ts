import { supabase } from "../client";
import type { ExpenseRepository } from "../../repository";
import type { Expense } from "../../types";

export const expenseRepository: ExpenseRepository = {
  async getAll(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapFromDb);
  },

  async getById(id: string): Promise<Expense | null> {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapFromDb(data);
  },

  async create(expenseData: Omit<Expense, "id" | "createdAt">): Promise<Expense> {
    const { data, error } = await supabase
      .from("expenses")
      .insert(mapToDb(expenseData))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapFromDb(data);
  },

  async update(id: string, updates: Partial<Expense>): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.description !== undefined) dbUpdates.description = updates.description;

    const { error } = await supabase
      .from("expenses")
      .update(dbUpdates)
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },
};

function mapFromDb(data: Record<string, unknown>): Expense {
  return {
    id: data.id as string,
    date: data.date as string,
    category: data.category as Expense["category"],
    amount: data.amount as number,
    description: data.description as string,
    createdAt: data.created_at as string,
  };
}

function mapToDb(expense: Omit<Expense, "id" | "createdAt">): Record<string, unknown> {
  return {
    date: expense.date,
    category: expense.category,
    amount: expense.amount,
    description: expense.description,
  };
}
