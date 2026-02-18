import { billingFetchJson } from "@/lib/api/client";
import type { CustomerRepository } from "../../repository";
import type { Customer } from "../../types";

function mapFromApi(r: Record<string, unknown>): Customer {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    customerType: (r.customer_type as Customer["customerType"]) ?? "Retail",
    phone: String(r.phone ?? ""),
    gstin: String(r.gstin ?? ""),
    billingAddress: String(r.billing_address ?? ""),
    shippingAddress: String(r.shipping_address ?? ""),
    openingBalance: Number(r.opening_balance ?? 0),
    creditDays: Number(r.credit_days ?? 0),
    creditLimit: Number(r.credit_limit ?? 0),
    stateCode: String(r.state_code ?? ""),
    createdAt: String(r.created_at ?? ""),
  };
}

function toApi(c: Omit<Customer, "id" | "createdAt">): Record<string, unknown> {
  return {
    name: c.name,
    customer_type: c.customerType,
    phone: c.phone,
    gstin: c.gstin,
    billing_address: c.billingAddress,
    shipping_address: c.shippingAddress,
    opening_balance: c.openingBalance,
    credit_days: c.creditDays,
    credit_limit: c.creditLimit,
    state_code: c.stateCode,
  };
}

export const customerRepositoryApi: CustomerRepository = {
  async getAll(): Promise<Customer[]> {
    const list = await billingFetchJson<Record<string, unknown>[]>("/customers");
    return Array.isArray(list) ? list.map(mapFromApi) : [];
  },

  async getById(id: string): Promise<Customer | null> {
    try {
      const r = await billingFetchJson<Record<string, unknown>>(`/customers/${id}`);
      return mapFromApi(r);
    } catch {
      return null;
    }
  },

  async getByPhone(phone: string): Promise<Customer | null> {
    const list = await billingFetchJson<Record<string, unknown>[]>("/customers");
    if (!Array.isArray(list)) return null;
    const found = list.find((x) => (x.phone as string) === phone);
    return found ? mapFromApi(found) : null;
  },

  async create(data: Omit<Customer, "id" | "createdAt">): Promise<Customer> {
    const r = await billingFetchJson<Record<string, unknown>>("/customers", {
      method: "POST",
      body: JSON.stringify(toApi(data)),
    });
    return mapFromApi(r);
  },

  async update(id: string, updates: Partial<Customer>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.customerType !== undefined) body.customer_type = updates.customerType;
    if (updates.phone !== undefined) body.phone = updates.phone;
    if (updates.gstin !== undefined) body.gstin = updates.gstin;
    if (updates.billingAddress !== undefined) body.billing_address = updates.billingAddress;
    if (updates.shippingAddress !== undefined) body.shipping_address = updates.shippingAddress;
    if (updates.openingBalance !== undefined) body.opening_balance = updates.openingBalance;
    if (updates.creditDays !== undefined) body.credit_days = updates.creditDays;
    if (updates.creditLimit !== undefined) body.credit_limit = updates.creditLimit;
    if (updates.stateCode !== undefined) body.state_code = updates.stateCode;
    await billingFetch(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await billingFetch(`/customers/${id}`, { method: "DELETE" });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Failed to delete" };
    }
  },
};
