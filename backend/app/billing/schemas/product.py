"""Product schemas."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class ProductBase(BaseModel):
    name: str
    product_type: str
    hsn: str | None = None
    gst_rate: Decimal = 5
    unit: str | None = "pieces"
    selling_price: Decimal = 0
    cost_price: Decimal | None = None
    current_stock: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    product_type: str | None = None
    hsn: str | None = None
    gst_rate: Decimal | None = None
    unit: str | None = None
    selling_price: Decimal | None = None
    cost_price: Decimal | None = None
    current_stock: int | None = None


class ProductResponse(ProductBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
