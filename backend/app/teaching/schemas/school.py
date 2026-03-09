"""School schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class SchoolBase(BaseModel):
    name: str
    address: str | None = None
    contact: str | None = None
    logo_url: str | None = None
    is_locked: bool = False
    plan_id: str = "starter"


class SchoolCreate(SchoolBase):
    organization_id: UUID | None = None


class SchoolUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    contact: str | None = None
    logo_url: str | None = None
    is_locked: bool | None = None
    plan_id: str | None = None
    organization_id: Optional[UUID] = None


class SchoolResponse(SchoolBase):
    id: UUID
    organization_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
