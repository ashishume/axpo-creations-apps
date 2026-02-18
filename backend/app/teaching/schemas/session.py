"""Session schemas."""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class SessionBase(BaseModel):
    school_id: UUID
    year: str
    start_date: date
    end_date: date
    is_active: bool = True
    salary_due_day: int = 5


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    year: str | None = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool | None = None
    salary_due_day: int | None = None


class SessionResponse(SessionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
