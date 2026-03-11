import { billingFetch, billingFetchJson } from "@/lib/api/client";
import type { ExpenseRepository } from "../repository";
import type { Expense, BusinessType } from "../types";

function mapFromApi(r: Record<string, unknown>): Expense {
  return {
    id: String(r.id),
    date: String(r.date ?? ""),
    category: (r.category as Expense["category"]) ?? "Other",
    amount: Number(r.amount ?? 0),
    description: String(r.description ?? ""),
    businessType: (r.business_type as BusinessType) ?? "shop",
    createdAt: String(r.created_at ?? ""),
  };
}

function toApi(e: Omit<Expense, "id" | "createdAt">): Record<string, unknown> {
  return {
    date: e.date,
    category: e.category,
    amount: e.amount,
    description: e.description,
    business_type: e.businessType,
  };
}

export const expenseRepositoryApi: ExpenseRepository = {
  async getAll(businessType: BusinessType): Promise<Expense[]> {
    const list = await billingFetchJson<Record<string, unknown>[]>(`/expenses?business_type=${businessType}`);
    return Array.isArray(list) ? list.map(mapFromApi) : [];
  },

  async getById(id: string): Promise<Expense | null> {
    try {
      const r = await billingFetchJson<Record<string, unknown>>(`/expenses/${id}`);
      return mapFromApi(r);
    } catch {
      return null;
    }
  },

  async create(data: Omit<Expense, "id" | "createdAt">): Promise<Expense> {
    const r = await billingFetchJson<Record<string, unknown>>("/expenses", {
      method: "POST",
      body: JSON.stringify(toApi(data)),
    });
    return mapFromApi(r);
  },

  async update(id: string, updates: Partial<Expense>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (updates.date !== undefined) body.date = updates.date;
    if (updates.category !== undefined) body.category = updates.category;
    if (updates.amount !== undefined) body.amount = updates.amount;
    if (updates.description !== undefined) body.description = updates.description;
    await billingFetch(`/expenses/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await billingFetch(`/expenses/${id}`, { method: "DELETE" });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Failed to delete" };
    }
  },
};
