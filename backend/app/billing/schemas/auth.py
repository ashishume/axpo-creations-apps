"""Auth request/response schemas."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str | None = None
    role: str = "user"


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str | None
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    user: UserResponse
    message: str = "Logged in successfully"


class RefreshResponse(BaseModel):
    message: str = "Token refreshed"
