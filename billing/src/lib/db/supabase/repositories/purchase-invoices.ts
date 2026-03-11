import { supabase } from "../client";
import type { PurchaseInvoiceRepository } from "../../repository";
import type { PurchaseInvoice, PurchaseInvoiceItem } from "../../types";
import { stockMovementRepository } from "./stock";
import { productRepository } from "./products";

export const purchaseInvoiceRepository: PurchaseInvoiceRepository = {
  async getAll(): Promise<PurchaseInvoice[]> {
    const { data, error } = await supabase
      .from("purchase_invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapInvoiceFromDb);
  },

  async getById(id: string): Promise<PurchaseInvoice | null> {
    const { data, error } = await supabase
      .from("purchase_invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapInvoiceFromDb(data);
  },

  async create(
    purchaseInvoiceData: Omit<PurchaseInvoice, "id" | "createdAt">,
    items: Omit<PurchaseInvoiceItem, "id" | "purchaseInvoiceId" | "createdAt">[]
  ): Promise<PurchaseInvoice> {
    const { data: invoice, error: invoiceError } = await supabase
      .from("purchase_invoices")
      .insert(mapInvoiceToDb(purchaseInvoiceData))
      .select()
      .single();

    if (invoiceError) throw new Error(invoiceError.message);

    if (items.length > 0) {
      const itemsToInsert = items.map((item) => mapItemToDb(item, invoice.id));
      const { data: insertedItems, error: itemsError } = await supabase
        .from("purchase_invoice_items")
        .insert(itemsToInsert)
        .select();

      if (itemsError) throw new Error(itemsError.message);

      for (const item of insertedItems || []) {
        const productId = item.product_id as string;
        const quantity = Number(item.quantity ?? 0);
        if (productId && quantity > 0) {
          await stockMovementRepository.create({
            date: purchaseInvoiceData.date,
            productId,
            quantity,
            type: "purchase",
            referenceId: invoice.id,
            remarks: `Purchase invoice ${purchaseInvoiceData.number}`,
          });
          await productRepository.updateStock(productId, quantity);
        }
      }
    }

    return mapInvoiceFromDb(invoice);
  },

  async update(id: string, updates: Partial<PurchaseInvoice>): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { error } = await supabase
      .from("purchase_invoices")
      .update(dbUpdates)
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async getItems(purchaseInvoiceId: string): Promise<PurchaseInvoiceItem[]> {
    const { data, error } = await supabase
      .from("purchase_invoice_items")
      .select("*")
      .eq("purchase_invoice_id", purchaseInvoiceId);

    if (error) throw new Error(error.message);
    return (data || []).map(mapItemFromDb);
  },

  async getAllItems(): Promise<PurchaseInvoiceItem[]> {
    const { data, error } = await supabase
      .from("purchase_invoice_items")
      .select("*");

    if (error) throw new Error(error.message);
    return (data || []).map(mapItemFromDb);
  },
};

function mapInvoiceFromDb(data: Record<string, unknown>): PurchaseInvoice {
  return {
    id: data.id as string,
    number: data.number as string,
    date: data.date as string,
    supplierId: data.supplier_id != null ? String(data.supplier_id) : "",
    subtotal: Number(data.subtotal ?? 0),
    discount: Number(data.discount ?? 0),
    taxableAmount: Number(data.taxable_amount ?? 0),
    cgstAmount: Number(data.cgst_amount ?? 0),
    sgstAmount: Number(data.sgst_amount ?? 0),
    igstAmount: Number(data.igst_amount ?? 0),
    roundOff: Number(data.round_off ?? 0),
    total: Number(data.total ?? 0),
    totalInWords: String(data.total_in_words ?? ""),
    status: (data.status as PurchaseInvoice["status"]) ?? "final",
    createdAt: String(data.created_at ?? ""),
  };
}

function mapInvoiceToDb(pi: Omit<PurchaseInvoice, "id" | "createdAt">): Record<string, unknown> {
  return {
    number: pi.number,
    date: pi.date,
    supplier_id: pi.supplierId || null,
    subtotal: pi.subtotal,
    discount: pi.discount,
    taxable_amount: pi.taxableAmount,
    cgst_amount: pi.cgstAmount,
    sgst_amount: pi.sgstAmount,
    igst_amount: pi.igstAmount,
    round_off: pi.roundOff,
    total: pi.total,
    total_in_words: pi.totalInWords,
    status: pi.status,
  };
}

function mapItemFromDb(data: Record<string, unknown>): PurchaseInvoiceItem {
  return {
    id: data.id as string,
    purchaseInvoiceId: data.purchase_invoice_id as string,
    productId: data.product_id != null ? String(data.product_id) : "",
    quantity: Number(data.quantity ?? 0),
    rate: Number(data.rate ?? 0),
    discount: Number(data.discount ?? 0),
    lineTotal: Number(data.line_total ?? 0),
    taxableAmount: Number(data.taxable_amount ?? 0),
    gstAmount: Number(data.gst_amount ?? 0),
    createdAt: String(data.created_at ?? ""),
  };
}

function mapItemToDb(
  item: Omit<PurchaseInvoiceItem, "id" | "purchaseInvoiceId" | "createdAt">,
  purchaseInvoiceId: string
): Record<string, unknown> {
  return {
    purchase_invoice_id: purchaseInvoiceId,
    product_id: item.productId || null,
    quantity: item.quantity,
    rate: item.rate,
    discount: item.discount,
    line_total: item.lineTotal,
    taxable_amount: item.taxableAmount,
    gst_amount: item.gstAmount,
  };
}
