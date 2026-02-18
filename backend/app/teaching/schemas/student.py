"""Student schemas."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class StudentBase(BaseModel):
    session_id: UUID
    class_id: UUID | None = None
    name: str
    student_id: str
    fee_type: str = "Regular"
    father_name: str | None = None
    mother_name: str | None = None
    guardian_phone: str | None = None
    current_address: str | None = None
    permanent_address: str | None = None
    blood_group: str | None = None
    health_issues: str | None = None
    registration_fees: Decimal | None = None
    admission_fees: Decimal | None = None
    annual_fund: Decimal | None = None
    monthly_fees: Decimal | None = None
    transport_fees: Decimal | None = None
    registration_paid: bool = False
    admission_paid: bool = False
    annual_fund_paid: bool = False
    due_day_of_month: int | None = None
    late_fee_amount: Decimal | None = None
    late_fee_frequency: str | None = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    class_id: UUID | None = None
    name: str | None = None
    student_id: str | None = None
    fee_type: str | None = None
    father_name: str | None = None
    mother_name: str | None = None
    guardian_phone: str | None = None
    current_address: str | None = None
    permanent_address: str | None = None
    blood_group: str | None = None
    health_issues: str | None = None
    registration_fees: Decimal | None = None
    admission_fees: Decimal | None = None
    annual_fund: Decimal | None = None
    monthly_fees: Decimal | None = None
    transport_fees: Decimal | None = None
    registration_paid: bool | None = None
    admission_paid: bool | None = None
    annual_fund_paid: bool | None = None
    due_day_of_month: int | None = None
    late_fee_amount: Decimal | None = None
    late_fee_frequency: str | None = None


class StudentResponse(StudentBase):
    id: UUID
    user_id: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
