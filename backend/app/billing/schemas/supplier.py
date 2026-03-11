"""Supplier schemas."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class SupplierBase(BaseModel):
    name: str
    phone: str | None = None
    gstin: str | None = None
    address: str | None = None
    state_code: str | None = None
    opening_balance: Decimal = 0
    credit_days: int = 0
    credit_limit: Decimal = 0


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    gstin: str | None = None
    address: str | None = None
    state_code: str | None = None
    opening_balance: Decimal | None = None
    credit_days: int | None = None
    credit_limit: Decimal | None = None


class SupplierResponse(SupplierBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
