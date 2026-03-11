import { billingFetch, billingFetchJson } from "@/lib/api/client";
import type { SupplierRepository } from "../repository";
import type { Supplier } from "../types";

function mapFromApi(r: Record<string, unknown>): Supplier {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    phone: String(r.phone ?? ""),
    gstin: String(r.gstin ?? ""),
    address: String(r.address ?? ""),
    stateCode: String(r.state_code ?? ""),
    openingBalance: Number(r.opening_balance ?? 0),
    creditDays: Number(r.credit_days ?? 0),
    creditLimit: Number(r.credit_limit ?? 0),
    createdAt: String(r.created_at ?? ""),
  };
}

function toApi(s: Omit<Supplier, "id" | "createdAt">): Record<string, unknown> {
  return {
    name: s.name,
    phone: s.phone,
    gstin: s.gstin,
    address: s.address,
    state_code: s.stateCode,
    opening_balance: s.openingBalance,
    credit_days: s.creditDays,
    credit_limit: s.creditLimit,
  };
}

export const supplierRepositoryApi: SupplierRepository = {
  async getAll(): Promise<Supplier[]> {
    const list = await billingFetchJson<Record<string, unknown>[]>("/suppliers");
    return Array.isArray(list) ? list.map(mapFromApi) : [];
  },

  async getById(id: string): Promise<Supplier | null> {
    try {
      const r = await billingFetchJson<Record<string, unknown>>(`/suppliers/${id}`);
      return mapFromApi(r);
    } catch {
      return null;
    }
  },

  async create(data: Omit<Supplier, "id" | "createdAt">): Promise<Supplier> {
    const r = await billingFetchJson<Record<string, unknown>>("/suppliers", {
      method: "POST",
      body: JSON.stringify(toApi(data)),
    });
    return mapFromApi(r);
  },

  async update(id: string, updates: Partial<Supplier>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.phone !== undefined) body.phone = updates.phone;
    if (updates.gstin !== undefined) body.gstin = updates.gstin;
    if (updates.address !== undefined) body.address = updates.address;
    if (updates.stateCode !== undefined) body.state_code = updates.stateCode;
    if (updates.openingBalance !== undefined) body.opening_balance = updates.openingBalance;
    if (updates.creditDays !== undefined) body.credit_days = updates.creditDays;
    if (updates.creditLimit !== undefined) body.credit_limit = updates.creditLimit;
    await billingFetch(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await billingFetch(`/suppliers/${id}`, { method: "DELETE" });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Failed to delete" };
    }
  },
};
