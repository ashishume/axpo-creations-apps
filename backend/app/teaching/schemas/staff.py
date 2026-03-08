"""Staff schemas."""
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class SalaryPaymentCreate(BaseModel):
    month: str
    amount: Decimal
    status: str = "Paid"
    payment_date: date | None = None
    method: str | None = None
    due_date: str | None = None


class SalaryPaymentResponse(BaseModel):
    id: UUID
    month: str
    paid_amount: Decimal
    status: str
    payment_date: date | None = None
    method: str | None = None
    due_date: date | None = None
    late_days: int = 0
    expected_amount: Decimal | None = None

    model_config = {"from_attributes": True}


class SalaryPaymentUpdate(BaseModel):
    paid_amount: Decimal | None = None
    status: str | None = None
    payment_date: date | None = None
    method: str | None = None


class StaffBase(BaseModel):
    session_id: UUID
    name: str
    employee_id: str
    role: str
    monthly_salary: Decimal
    subject_or_grade: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    salary_due_day: int = 5


class StaffCreate(StaffBase):
    pass


class StaffUpdate(BaseModel):
    name: str | None = None
    employee_id: str | None = None
    role: str | None = None
    monthly_salary: Decimal | None = None
    subject_or_grade: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    salary_due_day: int | None = None


class StaffResponse(StaffBase):
    id: UUID
    user_id: UUID | None
    created_at: datetime
    updated_at: datetime
    salary_payments: list[SalaryPaymentResponse] = []

    model_config = {"from_attributes": True}
