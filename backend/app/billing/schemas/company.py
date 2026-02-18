"""Company schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CompanyBase(BaseModel):
    name: str
    address: str | None = None
    gstin: str | None = None
    pan: str | None = None
    phone: str | None = None
    email: str | None = None
    bank_name: str | None = None
    bank_account: str | None = None
    bank_ifsc: str | None = None
    logo_path: str | None = None
    financial_year_start: int = 2024
    state_code: str | None = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    gstin: str | None = None
    pan: str | None = None
    phone: str | None = None
    email: str | None = None
    bank_name: str | None = None
    bank_account: str | None = None
    bank_ifsc: str | None = None
    logo_path: str | None = None
    financial_year_start: int | None = None
    state_code: str | None = None


class CompanyResponse(CompanyBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
