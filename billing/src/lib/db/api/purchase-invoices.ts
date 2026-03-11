import { billingFetch, billingFetchJson } from "@/lib/api/client";
import type { PurchaseInvoiceRepository } from "../repository";
import type { PurchaseInvoice, PurchaseInvoiceItem } from "../types";

function mapInvoiceFromApi(r: Record<string, unknown>): PurchaseInvoice {
  return {
    id: String(r.id),
    number: String(r.number ?? ""),
    date: String(r.date ?? ""),
    supplierId: r.supplier_id != null ? String(r.supplier_id) : "",
    subtotal: Number(r.subtotal ?? 0),
    discount: Number(r.discount ?? 0),
    taxableAmount: Number(r.taxable_amount ?? 0),
    cgstAmount: Number(r.cgst_amount ?? 0),
    sgstAmount: Number(r.sgst_amount ?? 0),
    igstAmount: Number(r.igst_amount ?? 0),
    roundOff: Number(r.round_off ?? 0),
    total: Number(r.total ?? 0),
    totalInWords: String(r.total_in_words ?? ""),
    status: (r.status as PurchaseInvoice["status"]) ?? "final",
    createdAt: String(r.created_at ?? ""),
  };
}

function mapItemFromApi(r: Record<string, unknown>): PurchaseInvoiceItem {
  return {
    id: String(r.id),
    purchaseInvoiceId: String(r.purchase_invoice_id ?? ""),
    productId: r.product_id != null ? String(r.product_id) : "",
    quantity: Number(r.quantity ?? 0),
    rate: Number(r.rate ?? 0),
    discount: Number(r.discount ?? 0),
    lineTotal: Number(r.line_total ?? 0),
    taxableAmount: Number(r.taxable_amount ?? 0),
    gstAmount: Number(r.gst_amount ?? 0),
    createdAt: String(r.created_at ?? ""),
  };
}

export const purchaseInvoiceRepositoryApi: PurchaseInvoiceRepository = {
  async getAll(): Promise<PurchaseInvoice[]> {
    const list = await billingFetchJson<Record<string, unknown>[]>("/purchase-invoices");
    return Array.isArray(list) ? list.map(mapInvoiceFromApi) : [];
  },

  async getById(id: string): Promise<PurchaseInvoice | null> {
    try {
      const r = await billingFetchJson<Record<string, unknown>>(`/purchase-invoices/${id}`);
      return mapInvoiceFromApi(r);
    } catch {
      return null;
    }
  },

  async create(
    purchaseInvoiceData: Omit<PurchaseInvoice, "id" | "createdAt">,
    items: Omit<PurchaseInvoiceItem, "id" | "purchaseInvoiceId" | "createdAt">[]
  ): Promise<PurchaseInvoice> {
    const body = {
      number: purchaseInvoiceData.number,
      date: purchaseInvoiceData.date,
      supplier_id: purchaseInvoiceData.supplierId || null,
      subtotal: purchaseInvoiceData.subtotal,
      discount: purchaseInvoiceData.discount,
      taxable_amount: purchaseInvoiceData.taxableAmount,
      cgst_amount: purchaseInvoiceData.cgstAmount,
      sgst_amount: purchaseInvoiceData.sgstAmount,
      igst_amount: purchaseInvoiceData.igstAmount,
      round_off: purchaseInvoiceData.roundOff,
      total: purchaseInvoiceData.total,
      total_in_words: purchaseInvoiceData.totalInWords,
      status: purchaseInvoiceData.status,
      items: items.map((it) => ({
        product_id: it.productId || null,
        quantity: it.quantity,
        rate: it.rate,
        discount: it.discount,
        line_total: it.lineTotal,
        taxable_amount: it.taxableAmount,
        gst_amount: it.gstAmount,
      })),
    };
    const r = await billingFetchJson<Record<string, unknown>>("/purchase-invoices", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return mapInvoiceFromApi(r);
  },

  async update(id: string, updates: Partial<PurchaseInvoice>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (updates.status !== undefined) body.status = updates.status;
    await billingFetch(`/purchase-invoices/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },

  async getItems(purchaseInvoiceId: string): Promise<PurchaseInvoiceItem[]> {
    try {
      const r = await billingFetchJson<Record<string, unknown>>(`/purchase-invoices/${purchaseInvoiceId}`);
      const items = (r.items as Record<string, unknown>[]) ?? [];
      return items.map(mapItemFromApi);
    } catch {
      return [];
    }
  },

  async getAllItems(): Promise<PurchaseInvoiceItem[]> {
    const list = await billingFetchJson<Record<string, unknown>[]>("/purchase-invoices");
    if (!Array.isArray(list)) return [];
    const all: PurchaseInvoiceItem[] = [];
    for (const pi of list) {
      const items = (pi.items as Record<string, unknown>[]) ?? [];
      all.push(...items.map(mapItemFromApi));
    }
    return all;
  },
};
