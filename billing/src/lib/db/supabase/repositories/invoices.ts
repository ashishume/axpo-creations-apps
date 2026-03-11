import { supabase } from "../client";
import type { InvoiceRepository } from "../../repository";
import type { Invoice, InvoiceItem } from "../../types";

export const invoiceRepository: InvoiceRepository = {
  async getAll(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapInvoiceFromDb);
  },

  async getById(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapInvoiceFromDb(data);
  },

  async create(
    invoiceData: Omit<Invoice, "id" | "createdAt">,
    items: Omit<InvoiceItem, "id" | "invoiceId">[]
  ): Promise<Invoice> {
    // Insert invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert(mapInvoiceToDb(invoiceData))
      .select()
      .single();

    if (invoiceError) throw new Error(invoiceError.message);

    // Insert items
    if (items.length > 0) {
      const itemsToInsert = items.map((item) => mapItemToDb(item, invoice.id));
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsToInsert);

      if (itemsError) throw new Error(itemsError.message);
    }

    return mapInvoiceFromDb(invoice);
  },

  async update(id: string, updates: Partial<Invoice>): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.cancelReason !== undefined) dbUpdates.cancel_reason = updates.cancelReason;

    const { error } = await supabase
      .from("invoices")
      .update(dbUpdates)
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async getItems(invoiceId: string): Promise<InvoiceItem[]> {
    const { data, error } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId);

    if (error) throw new Error(error.message);
    return (data || []).map(mapItemFromDb);
  },

  async getAllItems(): Promise<InvoiceItem[]> {
    const { data, error } = await supabase
      .from("invoice_items")
      .select("*");

    if (error) throw new Error(error.message);
    return (data || []).map(mapItemFromDb);
  },

  async getNextSeq(fyStart: number): Promise<number> {
    const fyEnd = fyStart + 1;
    const fySuffix = `${fyStart}-${String((fyStart + 1) % 100).padStart(2, "0")}`;
    const prefix = `INV/${fySuffix}/`;

    const { data, error } = await supabase
      .from("invoices")
      .select("number")
      .like("number", `${prefix}%`)
      .order("number", { ascending: false })
      .limit(1);

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) {
      return 1;
    }

    const lastNumber = data[0].number as string;
    const seqPart = lastNumber.replace(prefix, "");
    const lastSeq = parseInt(seqPart, 10) || 0;
    return lastSeq + 1;
  },
};

function mapInvoiceFromDb(data: Record<string, unknown>): Invoice {
  return {
    id: data.id as string,
    number: data.number as string,
    date: data.date as string,
    customerId: data.customer_id as string,
    subtotal: data.subtotal as number,
    discount: data.discount as number,
    taxableAmount: data.taxable_amount as number,
    cgstAmount: data.cgst_amount as number,
    sgstAmount: data.sgst_amount as number,
    igstAmount: data.igst_amount as number,
    roundOff: data.round_off as number,
    total: data.total as number,
    totalInWords: data.total_in_words as string,
    status: data.status as Invoice["status"],
    cancelReason: data.cancel_reason as string,
    createdAt: data.created_at as string,
  };
}

function mapInvoiceToDb(invoice: Omit<Invoice, "id" | "createdAt">): Record<string, unknown> {
  return {
    number: invoice.number,
    date: invoice.date,
    customer_id: invoice.customerId,
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    taxable_amount: invoice.taxableAmount,
    cgst_amount: invoice.cgstAmount,
    sgst_amount: invoice.sgstAmount,
    igst_amount: invoice.igstAmount,
    round_off: invoice.roundOff,
    total: invoice.total,
    total_in_words: invoice.totalInWords,
    status: invoice.status,
    cancel_reason: invoice.cancelReason,
  };
}

function mapItemFromDb(data: Record<string, unknown>): InvoiceItem {
  return {
    id: data.id as string,
    invoiceId: data.invoice_id as string,
    productId: data.product_id as string,
    quantity: data.quantity as number,
    rate: data.rate as number,
    costPrice: data.cost_price as number,
    discount: data.discount as number,
    lineTotal: data.line_total as number,
    taxableAmount: data.taxable_amount as number,
    gstAmount: data.gst_amount as number,
  };
}

function mapItemToDb(
  item: Omit<InvoiceItem, "id" | "invoiceId">,
  invoiceId: string
): Record<string, unknown> {
  return {
    invoice_id: invoiceId,
    product_id: item.productId,
    quantity: item.quantity,
    rate: item.rate,
    cost_price: item.costPrice,
    discount: item.discount,
    line_total: item.lineTotal,
    taxable_amount: item.taxableAmount,
    gst_amount: item.gstAmount,
  };
}
