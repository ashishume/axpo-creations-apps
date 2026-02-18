"""Stock movement schemas."""
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class StockMovementCreate(BaseModel):
    date: date
    product_id: UUID | None = None
    quantity: int
    type: str  # opening, production, sale, adjustment
    reference_id: UUID | None = None
    remarks: str | None = None


class StockMovementResponse(StockMovementCreate):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
