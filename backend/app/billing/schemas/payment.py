"""Payment schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class PaymentAllocationCreate(BaseModel):
    invoice_id: UUID | None = None
    amount: Decimal = 0


class PaymentCreate(BaseModel):
    receipt_no: str
    date: date
    customer_id: UUID | None = None
    amount: Decimal = 0
    mode: str  # cash, cheque, online
    cheque_no: str | None = None
    cheque_date: Optional[date] = None
    bank_name: str | None = None
    reference_no: str | None = None
    allocations: list[PaymentAllocationCreate] = []


class PaymentAllocationResponse(BaseModel):
    id: UUID
    payment_id: UUID
    invoice_id: UUID | None
    amount: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentResponse(BaseModel):
    id: UUID
    receipt_no: str
    date: date
    customer_id: UUID | None
    amount: Decimal
    mode: str
    cheque_no: str | None
    cheque_date: Optional[date]
    bank_name: str | None
    reference_no: str | None
    created_at: datetime
    allocations: list[PaymentAllocationResponse] = []

    model_config = {"from_attributes": True}
