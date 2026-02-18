"""Customer schemas."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class CustomerBase(BaseModel):
    name: str
    customer_type: str  # Dealer, Contractor, Retail, Builder
    phone: str | None = None
    gstin: str | None = None
    billing_address: str | None = None
    shipping_address: str | None = None
    opening_balance: Decimal = 0
    credit_days: int = 0
    credit_limit: Decimal = 0
    state_code: str | None = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: str | None = None
    customer_type: str | None = None
    phone: str | None = None
    gstin: str | None = None
    billing_address: str | None = None
    shipping_address: str | None = None
    opening_balance: Decimal | None = None
    credit_days: int | None = None
    credit_limit: Decimal | None = None
    state_code: str | None = None


class CustomerResponse(CustomerBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
