import { billingFetch, billingFetchJson } from "@/lib/api/client";
import type { InvoiceRepository } from "../../repository";
import type { Invoice, InvoiceItem } from "../../types";

function mapInvoiceFromApi(r: Record<string, unknown>): Invoice {
  return {
    id: String(r.id),
    number: String(r.number ?? ""),
    date: String(r.date ?? ""),
    customerId: r.customer_id != null ? String(r.customer_id) : "",
    subtotal: Number(r.subtotal ?? 0),
    discount: Number(r.discount ?? 0),
    taxableAmount: Number(r.taxable_amount ?? 0),
    cgstAmount: Number(r.cgst_amount ?? 0),
    sgstAmount: Number(r.sgst_amount ?? 0),
    igstAmount: Number(r.igst_amount ?? 0),
    roundOff: Number(r.round_off ?? 0),
    total: Number(r.total ?? 0),
    totalInWords: String(r.total_in_words ?? ""),
    status: (r.status as Invoice["status"]) ?? "draft",
    cancelReason: String(r.cancel_reason ?? ""),
    createdAt: String(r.created_at ?? ""),
  };
}

function mapItemFromApi(r: Record<string, unknown>): InvoiceItem {
  return {
    id: String(r.id),
    invoiceId: String(r.invoice_id ?? ""),
    productId: r.product_id != null ? String(r.product_id) : "",
    quantity: Number(r.quantity ?? 0),
    rate: Number(r.rate ?? 0),
    costPrice: Number(r.cost_price ?? 0),
    discount: Number(r.discount ?? 0),
    lineTotal: Number(r.line_total ?? 0),
    taxableAmount: Number(r.taxable_amount ?? 0),
    gstAmount: Number(r.gst_amount ?? 0),
  };
}

export const invoiceRepositoryApi: InvoiceRepository = {
  async getAll(): Promise<Invoice[]> {
    const list = await billingFetchJson<Record<string, unknown>[]>("/invoices");
    return Array.isArray(list) ? list.map(mapInvoiceFromApi) : [];
  },

  async getById(id: string): Promise<Invoice | null> {
    try {
      const r = await billingFetchJson<Record<string, unknown>>(`/invoices/${id}`);
      return mapInvoiceFromApi(r);
    } catch {
      return null;
    }
  },

  async create(
    invoiceData: Omit<Invoice, "id" | "createdAt">,
    items: Omit<InvoiceItem, "id" | "invoiceId">[]
  ): Promise<Invoice> {
    const body = {
      number: invoiceData.number,
      date: invoiceData.date,
      customer_id: invoiceData.customerId || null,
      subtotal: invoiceData.subtotal,
      discount: invoiceData.discount,
      taxable_amount: invoiceData.taxableAmount,
      cgst_amount: invoiceData.cgstAmount,
      sgst_amount: invoiceData.sgstAmount,
      igst_amount: invoiceData.igstAmount,
      round_off: invoiceData.roundOff,
      total: invoiceData.total,
      total_in_words: invoiceData.totalInWords,
      status: invoiceData.status,
      cancel_reason: invoiceData.cancelReason,
      items: items.map((it) => ({
        product_id: it.productId || null,
        quantity: it.quantity,
        rate: it.rate,
        cost_price: it.costPrice,
        discount: it.discount,
        line_total: it.lineTotal,
        taxable_amount: it.taxableAmount,
        gst_amount: it.gstAmount,
      })),
    };
    const r = await billingFetchJson<Record<string, unknown>>("/invoices", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return mapInvoiceFromApi(r);
  },

  async update(id: string, updates: Partial<Invoice>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (updates.status !== undefined) body.status = updates.status;
    if (updates.cancelReason !== undefined) body.cancel_reason = updates.cancelReason;
    await billingFetch(`/invoices/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },

  async getItems(invoiceId: string): Promise<InvoiceItem[]> {
    try {
      const r = await billingFetchJson<Record<string, unknown>>(`/invoices/${invoiceId}`);
      const items = (r.items as Record<string, unknown>[]) ?? [];
      return items.map(mapItemFromApi);
    } catch {
      return [];
    }
  },

  /** Fetches all invoice items in one go using list endpoint (backend returns items per invoice). */
  async getAllItems(): Promise<InvoiceItem[]> {
    const list = await billingFetchJson<Record<string, unknown>[]>("/invoices");
    if (!Array.isArray(list)) return [];
    const all: InvoiceItem[] = [];
    for (const inv of list) {
      const items = (inv.items as Record<string, unknown>[]) ?? [];
      all.push(...items.map(mapItemFromApi));
    }
    return all;
  },

  async getNextSeq(fyStart: number): Promise<number> {
    const invoices = await this.getAll();
    const fyEnd = fyStart + 1;
    const start = `${fyStart}-04-01`;
    const end = `${fyEnd}-03-31`;
    const count = invoices.filter((i) => i.date >= start && i.date <= end).length;
    return count + 1;
  },
};
