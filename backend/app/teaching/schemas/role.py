"""Role schemas."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class RoleBase(BaseModel):
    name: str
    description: str | None = None
    is_system: bool = False


class RoleCreate(BaseModel):
    name: str
    description: str | None = None
    permissions: list[str] = []


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    permissions: list[str] | None = None


class RoleResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    is_system: bool
    permissions: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
