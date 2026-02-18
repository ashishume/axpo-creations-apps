"""Invoice schemas."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class InvoiceItemBase(BaseModel):
    product_id: UUID | None = None
    quantity: int = 0
    rate: Decimal = 0
    cost_price: Decimal | None = None
    discount: Decimal | None = None
    line_total: Decimal = 0
    taxable_amount: Decimal | None = None
    gst_amount: Decimal | None = None


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItemResponse(InvoiceItemBase):
    id: UUID
    invoice_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceBase(BaseModel):
    number: str
    date: date
    customer_id: UUID | None = None
    subtotal: Decimal = 0
    discount: Decimal | None = None
    taxable_amount: Decimal = 0
    cgst_amount: Decimal | None = None
    sgst_amount: Decimal | None = None
    igst_amount: Decimal | None = None
    round_off: Decimal | None = None
    total: Decimal = 0
    total_in_words: str | None = None
    status: str = "draft"
    cancel_reason: str | None = None


class InvoiceCreate(InvoiceBase):
    items: list[InvoiceItemCreate] = []


class InvoiceUpdate(BaseModel):
    number: str | None = None
    date: Optional[date] = None
    customer_id: UUID | None = None
    subtotal: Decimal | None = None
    discount: Decimal | None = None
    taxable_amount: Decimal | None = None
    cgst_amount: Decimal | None = None
    sgst_amount: Decimal | None = None
    igst_amount: Decimal | None = None
    round_off: Decimal | None = None
    total: Decimal | None = None
    total_in_words: str | None = None
    status: str | None = None
    cancel_reason: str | None = None


class InvoiceResponse(InvoiceBase):
    id: UUID
    created_at: datetime
    items: list[InvoiceItemResponse] = []

    model_config = {"from_attributes": True}
