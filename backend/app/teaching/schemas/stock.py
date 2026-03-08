"""Stock schemas for teaching."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class StockBase(BaseModel):
    session_id: UUID
    publisher_name: str
    description: str | None = None
    purchase_date: date
    total_credit_amount: Decimal
    status: str = "open"
    settled_date: Optional[date] = None
    settled_amount: Decimal | None = None
    notes: str | None = None


class StockCreate(StockBase):
    pass


class StockUpdate(BaseModel):
    publisher_name: str | None = None
    description: str | None = None
    purchase_date: Optional[date] = None
    total_credit_amount: Decimal | None = None
    status: str | None = None
    settled_date: Optional[date] = None
    settled_amount: Decimal | None = None
    notes: str | None = None


class StockTransactionCreate(BaseModel):
    date: date
    type: str  # purchase, sale, return
    amount: Decimal
    quantity: int | None = None
    description: str | None = None
    receipt_number: str | None = None


class StockTransactionResponse(BaseModel):
    id: UUID
    date: date
    type: str
    amount: Decimal
    quantity: int | None = None
    description: str | None = None
    receipt_number: str | None = None

    model_config = {"from_attributes": True}


class StockResponse(StockBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    transactions: list[StockTransactionResponse] = []

    model_config = {"from_attributes": True}
