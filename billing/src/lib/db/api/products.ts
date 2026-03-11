import { billingFetch, billingFetchJson } from "@/lib/api/client";
import type { ProductRepository } from "../repository";
import type { Product } from "../types";

function mapFromApi(r: Record<string, unknown>): Product {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    productType: String(r.product_type ?? ""),
    hsn: String(r.hsn ?? ""),
    gstRate: Number(r.gst_rate ?? 5),
    unit: String(r.unit ?? "pieces"),
    sellingPrice: Number(r.selling_price ?? 0),
    costPrice: Number(r.cost_price ?? 0),
    currentStock: Number(r.current_stock ?? 0),
    createdAt: String(r.created_at ?? ""),
  };
}

function toApi(p: Omit<Product, "id" | "createdAt">): Record<string, unknown> {
  return {
    name: p.name,
    product_type: p.productType,
    hsn: p.hsn,
    gst_rate: p.gstRate,
    unit: p.unit,
    selling_price: p.sellingPrice,
    cost_price: p.costPrice,
    current_stock: p.currentStock,
  };
}

export const productRepositoryApi: ProductRepository = {
  async getAll(): Promise<Product[]> {
    const list = await billingFetchJson<Record<string, unknown>[]>("/products");
    return Array.isArray(list) ? list.map(mapFromApi) : [];
  },

  async getById(id: string): Promise<Product | null> {
    try {
      const r = await billingFetchJson<Record<string, unknown>>(`/products/${id}`);
      return mapFromApi(r);
    } catch {
      return null;
    }
  },

  async create(data: Omit<Product, "id" | "createdAt">): Promise<Product> {
    const r = await billingFetchJson<Record<string, unknown>>("/products", {
      method: "POST",
      body: JSON.stringify(toApi(data)),
    });
    return mapFromApi(r);
  },

  async update(id: string, updates: Partial<Product>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.productType !== undefined) body.product_type = updates.productType;
    if (updates.hsn !== undefined) body.hsn = updates.hsn;
    if (updates.gstRate !== undefined) body.gst_rate = updates.gstRate;
    if (updates.unit !== undefined) body.unit = updates.unit;
    if (updates.sellingPrice !== undefined) body.selling_price = updates.sellingPrice;
    if (updates.costPrice !== undefined) body.cost_price = updates.costPrice;
    if (updates.currentStock !== undefined) body.current_stock = updates.currentStock;
    await billingFetch(`/products/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await billingFetch(`/products/${id}`, { method: "DELETE" });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Failed to delete" };
    }
  },

  async updateStock(id: string, quantity: number): Promise<void> {
    const p = await this.getById(id);
    if (p) await this.update(id, { currentStock: p.currentStock + quantity });
  },
};
