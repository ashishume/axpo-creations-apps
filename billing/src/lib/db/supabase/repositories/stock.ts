import { supabase } from "../client";
import type { StockMovementRepository } from "../../repository";
import type { StockMovement, BusinessType } from "../../types";
import { productRepository } from "./products";

export const stockMovementRepository: StockMovementRepository = {
  async getAll(businessType: BusinessType, productId?: string): Promise<StockMovement[]> {
    let query = supabase
      .from("stock_movements")
      .select("*")
      .eq("business_type", businessType)
      .order("created_at", { ascending: false });

    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(mapFromDb);
  },

  async create(movementData: Omit<StockMovement, "id" | "createdAt">): Promise<StockMovement> {
    // Insert movement
    const { data, error } = await supabase
      .from("stock_movements")
      .insert(mapToDb(movementData))
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Update product stock
    await productRepository.updateStock(movementData.productId, movementData.quantity);

    return mapFromDb(data);
  },
};

function mapFromDb(data: Record<string, unknown>): StockMovement {
  return {
    id: data.id as string,
    date: data.date as string,
    productId: data.product_id as string,
    quantity: data.quantity as number,
    type: data.type as StockMovement["type"],
    referenceId: data.reference_id as string | null,
    remarks: data.remarks as string,
    businessType: (data.business_type as BusinessType) || "shop",
    createdAt: data.created_at as string,
  };
}

function mapToDb(movement: Omit<StockMovement, "id" | "createdAt">): Record<string, unknown> {
  return {
    date: movement.date,
    product_id: movement.productId,
    quantity: movement.quantity,
    type: movement.type,
    reference_id: movement.referenceId,
    remarks: movement.remarks,
    business_type: movement.businessType,
  };
}
