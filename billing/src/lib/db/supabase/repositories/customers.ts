import { supabase } from "../client";
import type { CustomerRepository } from "../../repository";
import type { Customer, BusinessType } from "../../types";

export const customerRepository: CustomerRepository = {
  async getAll(businessType: BusinessType): Promise<Customer[]> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("business_type", businessType)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapFromDb);
  },

  async getById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapFromDb(data);
  },

  async getByPhone(phone: string, businessType: BusinessType): Promise<Customer | null> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", phone)
      .eq("business_type", businessType)
      .single();

    if (error || !data) return null;
    return mapFromDb(data);
  },

  async create(customerData: Omit<Customer, "id" | "createdAt">): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .insert(mapToDb(customerData))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapFromDb(data);
  },

  async update(id: string, updates: Partial<Customer>): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.customerType !== undefined) dbUpdates.customer_type = updates.customerType;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.gstin !== undefined) dbUpdates.gstin = updates.gstin;
    if (updates.billingAddress !== undefined) dbUpdates.billing_address = updates.billingAddress;
    if (updates.shippingAddress !== undefined) dbUpdates.shipping_address = updates.shippingAddress;
    if (updates.openingBalance !== undefined) dbUpdates.opening_balance = updates.openingBalance;
    if (updates.creditDays !== undefined) dbUpdates.credit_days = updates.creditDays;
    if (updates.creditLimit !== undefined) dbUpdates.credit_limit = updates.creditLimit;
    if (updates.stateCode !== undefined) dbUpdates.state_code = updates.stateCode;

    const { error } = await supabase
      .from("customers")
      .update(dbUpdates)
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    // Check for related records
    const { data: invoices } = await supabase
      .from("invoices")
      .select("id")
      .eq("customer_id", id)
      .limit(1);

    const { data: payments } = await supabase
      .from("payments")
      .select("id")
      .eq("customer_id", id)
      .limit(1);

    if ((invoices && invoices.length > 0) || (payments && payments.length > 0)) {
      return { ok: false, error: "Customer has transactions and cannot be deleted." };
    }

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },
};

function mapFromDb(data: Record<string, unknown>): Customer {
  return {
    id: data.id as string,
    name: data.name as string,
    customerType: data.customer_type as Customer["customerType"],
    phone: data.phone as string,
    gstin: data.gstin as string,
    billingAddress: data.billing_address as string,
    shippingAddress: data.shipping_address as string,
    openingBalance: (data.opening_balance as number) || 0,
    creditDays: (data.credit_days as number) || 0,
    creditLimit: (data.credit_limit as number) || 0,
    stateCode: data.state_code as string,
    businessType: (data.business_type as BusinessType) || "shop",
    createdAt: data.created_at as string,
  };
}

function mapToDb(customer: Omit<Customer, "id" | "createdAt">): Record<string, unknown> {
  return {
    name: customer.name,
    customer_type: customer.customerType,
    phone: customer.phone,
    gstin: customer.gstin,
    billing_address: customer.billingAddress,
    shipping_address: customer.shippingAddress,
    opening_balance: customer.openingBalance,
    credit_days: customer.creditDays,
    credit_limit: customer.creditLimit,
    state_code: customer.stateCode,
    business_type: customer.businessType,
  };
}
