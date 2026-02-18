"""Expense schemas for teaching."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ExpenseBase(BaseModel):
    session_id: UUID
    date: date
    amount: Decimal
    category: str
    description: str | None = None
    vendor_payee: str | None = None
    payment_method: str | None = None
    tags: list[str] | None = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    date: Optional[date] = None
    amount: Decimal | None = None
    category: str | None = None
    description: str | None = None
    vendor_payee: str | None = None
    payment_method: str | None = None
    tags: list[str] | None = None


class ExpenseResponse(ExpenseBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
