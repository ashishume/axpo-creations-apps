"""Class schemas."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, field_validator


class ClassBase(BaseModel):
    session_id: UUID
    name: str
    registration_fees: Decimal = 0  # Registration/Admission fees (one-time)
    annual_fund: Decimal = 0
    monthly_fees: Decimal = 0
    late_fee_amount: Decimal = 0
    late_fee_frequency: str = "weekly"
    due_day_of_month: int = 10


class ClassCreate(ClassBase):
    @field_validator("monthly_fees")
    @classmethod
    def monthly_fees_must_be_positive(cls, v: Decimal) -> Decimal:
        if v is not None and v <= 0:
            raise ValueError("Monthly fees must be greater than zero (zero breaks finance logic)")
        return v


class ClassUpdate(BaseModel):
    name: str | None = None
    registration_fees: Decimal | None = None
    annual_fund: Decimal | None = None
    monthly_fees: Decimal | None = None
    late_fee_amount: Decimal | None = None
    late_fee_frequency: str | None = None
    due_day_of_month: int | None = None

    @field_validator("monthly_fees")
    @classmethod
    def monthly_fees_must_be_positive(cls, v: Decimal | None) -> Decimal | None:
        if v is not None and v <= 0:
            raise ValueError("Monthly fees must be greater than zero (zero breaks finance logic)")
        return v


class ClassResponse(ClassBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
