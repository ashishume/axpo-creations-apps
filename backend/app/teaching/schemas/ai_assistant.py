"""AI Assistant (Axpo Assistant) request/response schemas."""
from typing import Any

from pydantic import BaseModel, Field


class ParseRequest(BaseModel):
    """Request body for parsing user natural language input."""

    input: str = Field(..., min_length=1, description="User message to parse")


class EntityFilters(BaseModel):
    """Filters for update/delete operations to identify the entity (camelCase for frontend)."""

    id: str | None = None
    name: str | None = None
    studentId: str | None = None
    employeeId: str | None = None


class ParseResponse(BaseModel):
    """Parsed intent result returned by the AI Assistant."""

    success: bool = Field(..., description="Whether the intent was recognized")
    intent: str = Field(..., description="Intent type (e.g. add_student, query_analytics)")
    entity: str | None = Field(None, description="Entity type: student, staff, expense, stock, fixedCost, salaryPayment, class")
    operation: str | None = Field(None, description="Operation: add, update, delete, query")
    data: Any = Field(None, description="Parsed entity data or array of entities")
    filters: EntityFilters | None = Field(None, description="Filters for update/delete")
    message: str | None = Field(None, description="Friendly response from the assistant")
    error: str | None = Field(None, description="Error message if parsing failed")


class AIStatusResponse(BaseModel):
    """Response for AI availability check."""

    available: bool = Field(..., description="Whether the AI Assistant is configured and available")
