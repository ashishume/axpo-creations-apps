"""Auth schemas for teaching."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str | None
    name: str
    role_id: UUID
    must_change_password: bool
    is_active: bool
    last_login_at: Optional[datetime]
    staff_id: UUID | None
    student_id: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    user: UserResponse
    permissions: list[str] = []
    message: str = "Logged in successfully"


class MeResponse(BaseModel):
    user: UserResponse
    permissions: list[str] = []


class RefreshResponse(BaseModel):
    message: str = "Token refreshed"
