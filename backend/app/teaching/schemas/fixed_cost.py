"""Fixed monthly cost schemas."""
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class FixedCostBase(BaseModel):
    session_id: UUID
    name: str
    amount: Decimal
    category: str
    is_active: bool = True


class FixedCostCreate(BaseModel):
    session_id: UUID
    name: str
    amount: Decimal
    category: str
    is_active: bool = True


class FixedCostUpdate(BaseModel):
    name: str | None = None
    amount: Decimal | None = None
    category: str | None = None
    is_active: bool | None = None


class FixedCostResponse(BaseModel):
    id: UUID
    session_id: UUID
    name: str
    amount: Decimal
    category: str
    is_active: bool

    model_config = {"from_attributes": True}
