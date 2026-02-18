"""Class schemas."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class ClassBase(BaseModel):
    session_id: UUID
    name: str
    registration_fees: Decimal = 0
    admission_fees: Decimal = 0
    annual_fund: Decimal = 0
    monthly_fees: Decimal = 0
    late_fee_amount: Decimal = 0
    late_fee_frequency: str = "weekly"
    due_day_of_month: int = 10


class ClassCreate(ClassBase):
    pass


class ClassUpdate(BaseModel):
    name: str | None = None
    registration_fees: Decimal | None = None
    admission_fees: Decimal | None = None
    annual_fund: Decimal | None = None
    monthly_fees: Decimal | None = None
    late_fee_amount: Decimal | None = None
    late_fee_frequency: str | None = None
    due_day_of_month: int | None = None


class ClassResponse(ClassBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
