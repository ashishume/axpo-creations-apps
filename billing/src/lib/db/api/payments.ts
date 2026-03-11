import { billingFetchJson } from "@/lib/api/client";
import type { PaymentRepository } from "../repository";
import type { Payment, PaymentAllocation, BusinessType } from "../types";

function mapPaymentFromApi(r: Record<string, unknown>): Payment {
  return {
    id: String(r.id),
    receiptNo: String(r.receipt_no ?? ""),
    date: String(r.date ?? ""),
    customerId: r.customer_id != null ? String(r.customer_id) : "",
    amount: Number(r.amount ?? 0),
    mode: (r.mode as Payment["mode"]) ?? "cash",
    chequeNo: String(r.cheque_no ?? ""),
    chequeDate: String(r.cheque_date ?? ""),
    bankName: String(r.bank_name ?? ""),
    referenceNo: String(r.reference_no ?? ""),
    businessType: (r.business_type as BusinessType) ?? "shop",
    createdAt: String(r.created_at ?? ""),
  };
}

function mapAllocationFromApi(r: Record<string, unknown>): PaymentAllocation {
  return {
    id: String(r.id),
    paymentId: String(r.payment_id ?? ""),
    invoiceId: r.invoice_id != null ? String(r.invoice_id) : "",
    amount: Number(r.amount ?? 0),
  };
}

export const paymentRepositoryApi: PaymentRepository = {
  async getAll(businessType: BusinessType): Promise<Payment[]> {
    const list = await billingFetchJson<Record<string, unknown>[]>(`/payments?business_type=${businessType}`);
    return Array.isArray(list) ? list.map(mapPaymentFromApi) : [];
  },

  async getById(id: string): Promise<Payment | null> {
    try {
      const r = await billingFetchJson<Record<string, unknown>>(`/payments/${id}`);
      return mapPaymentFromApi(r);
    } catch {
      return null;
    }
  },

  async create(
    paymentData: Omit<Payment, "id" | "createdAt">,
    allocations: Omit<PaymentAllocation, "id" | "paymentId">[]
  ): Promise<Payment> {
    const body = {
      receipt_no: paymentData.receiptNo,
      date: paymentData.date,
      customer_id: paymentData.customerId || null,
      amount: paymentData.amount,
      mode: paymentData.mode,
      cheque_no: paymentData.chequeNo || null,
      cheque_date: paymentData.chequeDate || null,
      bank_name: paymentData.bankName || null,
      reference_no: paymentData.referenceNo || null,
      allocations: allocations.map((a) => ({
        invoice_id: a.invoiceId || null,
        amount: a.amount,
      })),
    };
    const r = await billingFetchJson<Record<string, unknown>>("/payments", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return mapPaymentFromApi(r);
  },

  async getAllocations(paymentId?: string): Promise<PaymentAllocation[]> {
    if (paymentId) {
      try {
        const r = await billingFetchJson<Record<string, unknown>>(`/payments/${paymentId}`);
        const allocs = (r.allocations as Record<string, unknown>[]) ?? [];
        return allocs.map(mapAllocationFromApi);
      } catch {
        return [];
      }
    }
    /** All allocations: one list call (backend returns allocations per payment). */
    const list = await billingFetchJson<Record<string, unknown>[]>("/payments");
    if (!Array.isArray(list)) return [];
    const all: PaymentAllocation[] = [];
    for (const pay of list) {
      const allocs = (pay.allocations as Record<string, unknown>[]) ?? [];
      all.push(...allocs.map(mapAllocationFromApi));
    }
    return all;
  },

  async getNextSeq(fyStart: number, businessType: BusinessType): Promise<number> {
    const payments = await this.getAll(businessType);
    const fyEnd = fyStart + 1;
    const start = `${fyStart}-04-01`;
    const end = `${fyEnd}-03-31`;
    const count = payments.filter((p: Payment) => p.date >= start && p.date <= end).length;
    return count + 1;
  },
};
