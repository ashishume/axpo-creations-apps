import { supabase } from "../client";
import type { SupplierRepository } from "../../repository";
import type { Supplier } from "../../types";

export const supplierRepository: SupplierRepository = {
  async getAll(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapFromDb);
  },

  async getById(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapFromDb(data);
  },

  async create(supplierData: Omit<Supplier, "id" | "createdAt">): Promise<Supplier> {
    const { data, error } = await supabase
      .from("suppliers")
      .insert(mapToDb(supplierData))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapFromDb(data);
  },

  async update(id: string, updates: Partial<Supplier>): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.gstin !== undefined) dbUpdates.gstin = updates.gstin;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.stateCode !== undefined) dbUpdates.state_code = updates.stateCode;
    if (updates.openingBalance !== undefined) dbUpdates.opening_balance = updates.openingBalance;
    if (updates.creditDays !== undefined) dbUpdates.credit_days = updates.creditDays;
    if (updates.creditLimit !== undefined) dbUpdates.credit_limit = updates.creditLimit;

    const { error } = await supabase
      .from("suppliers")
      .update(dbUpdates)
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    const { data: purchaseInvoices } = await supabase
      .from("purchase_invoices")
      .select("id")
      .eq("supplier_id", id)
      .limit(1);

    if (purchaseInvoices && purchaseInvoices.length > 0) {
      return { ok: false, error: "Supplier has purchase invoices and cannot be deleted." };
    }

    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },
};

function mapFromDb(data: Record<string, unknown>): Supplier {
  return {
    id: data.id as string,
    name: data.name as string,
    phone: data.phone as string,
    gstin: data.gstin as string,
    address: data.address as string,
    stateCode: data.state_code as string,
    openingBalance: (data.opening_balance as number) ?? 0,
    creditDays: (data.credit_days as number) ?? 0,
    creditLimit: (data.credit_limit as number) ?? 0,
    createdAt: data.created_at as string,
  };
}

function mapToDb(supplier: Omit<Supplier, "id" | "createdAt">): Record<string, unknown> {
  return {
    name: supplier.name,
    phone: supplier.phone,
    gstin: supplier.gstin,
    address: supplier.address,
    state_code: supplier.stateCode,
    opening_balance: supplier.openingBalance,
    credit_days: supplier.creditDays,
    credit_limit: supplier.creditLimit,
  };
}
