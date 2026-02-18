"""Expense schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ExpenseBase(BaseModel):
    date: date
    category: str  # Labour, Raw material, Fuel, Electricity, Maintenance, Rent, Other
    amount: Decimal = 0
    description: str | None = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    date: Optional[date] = None
    category: str | None = None
    amount: Decimal | None = None
    description: str | None = None


class ExpenseResponse(ExpenseBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
