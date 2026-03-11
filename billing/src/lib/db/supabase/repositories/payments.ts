import { supabase } from "../client";
import type { PaymentRepository } from "../../repository";
import type { Payment, PaymentAllocation, BusinessType } from "../../types";

export const paymentRepository: PaymentRepository = {
  async getAll(businessType: BusinessType): Promise<Payment[]> {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("business_type", businessType)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapPaymentFromDb);
  },

  async getById(id: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapPaymentFromDb(data);
  },

  async create(
    paymentData: Omit<Payment, "id" | "createdAt">,
    allocations: Omit<PaymentAllocation, "id" | "paymentId">[]
  ): Promise<Payment> {
    // Insert payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert(mapPaymentToDb(paymentData))
      .select()
      .single();

    if (paymentError) throw new Error(paymentError.message);

    // Insert allocations
    if (allocations.length > 0) {
      const allocsToInsert = allocations.map((alloc) => ({
        payment_id: payment.id,
        invoice_id: alloc.invoiceId,
        amount: alloc.amount,
      }));
      const { error: allocError } = await supabase
        .from("payment_allocations")
        .insert(allocsToInsert);

      if (allocError) throw new Error(allocError.message);
    }

    return mapPaymentFromDb(payment);
  },

  async getAllocations(paymentId?: string): Promise<PaymentAllocation[]> {
    let query = supabase.from("payment_allocations").select("*");
    
    if (paymentId) {
      query = query.eq("payment_id", paymentId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(mapAllocationFromDb);
  },

  async getNextSeq(fyStart: number, businessType: BusinessType): Promise<number> {
    const fyEnd = fyStart + 1;
    const startDate = `${fyStart}-04-01`;
    const endDate = `${fyEnd}-03-31`;

    const { count, error } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("business_type", businessType)
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) throw new Error(error.message);
    return (count || 0) + 1;
  },
};

function mapPaymentFromDb(data: Record<string, unknown>): Payment {
  return {
    id: data.id as string,
    receiptNo: data.receipt_no as string,
    date: data.date as string,
    customerId: data.customer_id as string,
    amount: data.amount as number,
    mode: data.mode as Payment["mode"],
    chequeNo: data.cheque_no as string,
    chequeDate: data.cheque_date as string,
    bankName: data.bank_name as string,
    referenceNo: data.reference_no as string,
    businessType: (data.business_type as BusinessType) || "shop",
    createdAt: data.created_at as string,
  };
}

function mapPaymentToDb(payment: Omit<Payment, "id" | "createdAt">): Record<string, unknown> {
  const chequeDate = payment.chequeDate && String(payment.chequeDate).trim() !== ""
    ? payment.chequeDate
    : null;
  const date = payment.date && String(payment.date).trim() !== ""
    ? payment.date
    : new Date().toISOString().slice(0, 10);

  return {
    receipt_no: payment.receiptNo,
    date,
    customer_id: payment.customerId,
    amount: payment.amount,
    mode: payment.mode,
    cheque_no: payment.chequeNo && String(payment.chequeNo).trim() !== "" ? payment.chequeNo : null,
    cheque_date: chequeDate,
    bank_name: payment.bankName && String(payment.bankName).trim() !== "" ? payment.bankName : null,
    reference_no: payment.referenceNo && String(payment.referenceNo).trim() !== "" ? payment.referenceNo : null,
    business_type: payment.businessType,
  };
}

function mapAllocationFromDb(data: Record<string, unknown>): PaymentAllocation {
  return {
    id: data.id as string,
    paymentId: data.payment_id as string,
    invoiceId: data.invoice_id as string,
    amount: data.amount as number,
  };
}
