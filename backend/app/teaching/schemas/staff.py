"""Staff schemas."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


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

    model_config = {"from_attributes": True}
