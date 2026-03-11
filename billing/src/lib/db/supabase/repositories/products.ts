import { supabase } from "../client";
import type { ProductRepository } from "../../repository";
import type { Product, BusinessType } from "../../types";

export const productRepository: ProductRepository = {
  async getAll(businessType: BusinessType): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("business_type", businessType)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapFromDb);
  },

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapFromDb(data);
  },

  async create(productData: Omit<Product, "id" | "createdAt">): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert(mapToDb(productData))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapFromDb(data);
  },

  async update(id: string, updates: Partial<Product>): Promise<void> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.productType !== undefined) dbUpdates.product_type = updates.productType;
    if (updates.hsn !== undefined) dbUpdates.hsn = updates.hsn;
    if (updates.gstRate !== undefined) dbUpdates.gst_rate = updates.gstRate;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.sellingPrice !== undefined) dbUpdates.selling_price = updates.sellingPrice;
    if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
    if (updates.currentStock !== undefined) dbUpdates.current_stock = updates.currentStock;

    const { error } = await supabase
      .from("products")
      .update(dbUpdates)
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    // Check for related records
    const { data: invoiceItems } = await supabase
      .from("invoice_items")
      .select("id")
      .eq("product_id", id)
      .limit(1);

    const { data: stockMovements } = await supabase
      .from("stock_movements")
      .select("id")
      .eq("product_id", id)
      .limit(1);

    if ((invoiceItems && invoiceItems.length > 0) || (stockMovements && stockMovements.length > 0)) {
      return { ok: false, error: "Product has transactions and cannot be deleted." };
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  async updateStock(id: string, quantity: number): Promise<void> {
    const { error } = await supabase.rpc("update_product_stock", {
      product_id: id,
      quantity_change: quantity,
    });

    if (error) {
      // Fallback: fetch and update manually
      const product = await this.getById(id);
      if (product) {
        await this.update(id, { currentStock: product.currentStock + quantity });
      }
    }
  },
};

function mapFromDb(data: Record<string, unknown>): Product {
  return {
    id: data.id as string,
    name: data.name as string,
    productType: data.product_type as Product["productType"],
    hsn: data.hsn as string,
    gstRate: data.gst_rate as number,
    unit: data.unit as string,
    sellingPrice: data.selling_price as number,
    costPrice: (data.cost_price as number) || 0,
    currentStock: data.current_stock as number,
    businessType: (data.business_type as BusinessType) || "shop",
    createdAt: data.created_at as string,
  };
}

function mapToDb(product: Omit<Product, "id" | "createdAt">): Record<string, unknown> {
  return {
    name: product.name,
    product_type: product.productType,
    hsn: product.hsn,
    gst_rate: product.gstRate,
    unit: product.unit,
    selling_price: product.sellingPrice,
    cost_price: product.costPrice,
    current_stock: product.currentStock,
    business_type: product.businessType,
  };
}
