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
    organization_id: UUID | None
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


# User management (list/create/update/delete/reset-password)
class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int


class CreateUserRequest(BaseModel):
    username: str
    email: str | None = None
    name: str
    role_id: UUID
    password: str
    organization_id: UUID | None = None
    staff_id: UUID | None = None
    student_id: UUID | None = None


class UpdateUserRequest(BaseModel):
    email: str | None = None
    name: str | None = None
    role_id: UUID | None = None
    is_active: bool | None = None
    organization_id: UUID | None = None
    staff_id: UUID | None = None
    student_id: UUID | None = None


class ResetPasswordRequest(BaseModel):
    new_password: str
