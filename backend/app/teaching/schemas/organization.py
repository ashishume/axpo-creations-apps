"""Organization schemas."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class OrganizationBase(BaseModel):
    name: str
    slug: str | None = None
    billing_email: str | None = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    billing_email: str | None = None


class OrganizationResponse(OrganizationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
