import { billingFetchJson } from "@/lib/api/client";
import type { StockMovementRepository } from "../repository";
import type { StockMovement } from "../types";
import { productRepositoryApi } from "./products";

function mapFromApi(r: Record<string, unknown>): StockMovement {
  return {
    id: String(r.id),
    date: String(r.date ?? ""),
    productId: r.product_id != null ? String(r.product_id) : "",
    quantity: Number(r.quantity ?? 0),
    type: (r.type as StockMovement["type"]) ?? "adjustment",
    referenceId: r.reference_id != null ? String(r.reference_id) : null,
    remarks: String(r.remarks ?? ""),
    createdAt: String(r.created_at ?? ""),
  };
}

export const stockMovementRepositoryApi: StockMovementRepository = {
  async getAll(productId?: string): Promise<StockMovement[]> {
    const list = await billingFetchJson<Record<string, unknown>[]>("/stocks");
    let arr = Array.isArray(list) ? list.map(mapFromApi) : [];
    if (productId) arr = arr.filter((m) => m.productId === productId);
    return arr;
  },

  async create(movementData: Omit<StockMovement, "id" | "createdAt">): Promise<StockMovement> {
    const body = {
      date: movementData.date,
      product_id: movementData.productId || null,
      quantity: movementData.quantity,
      type: movementData.type,
      reference_id: movementData.referenceId || null,
      remarks: movementData.remarks || null,
    };
    const r = await billingFetchJson<Record<string, unknown>>("/stocks", {
      method: "POST",
      body: JSON.stringify(body),
    });
    await productRepositoryApi.updateStock(
      movementData.productId,
      movementData.quantity
    );
    return mapFromApi(r);
  },
};
