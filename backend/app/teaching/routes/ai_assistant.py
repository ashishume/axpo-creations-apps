"""AI Assistant (Axpo Assistant) routes - parse natural language to intents."""
from fastapi import APIRouter, Depends

from app.teaching.dependencies import get_current_teaching_user
from app.teaching.models.user import User
from app.teaching.schemas.ai_assistant import AIStatusResponse, ParseRequest, ParseResponse
from app.teaching.services.ai_assistant import is_ai_available, parse_intent

router = APIRouter(prefix="/ai-assistant", tags=["teaching-ai-assistant"])


@router.get("/status", response_model=AIStatusResponse)
async def ai_status(
    user: User = Depends(get_current_teaching_user),
):
    """Return whether the AI Assistant is configured and available."""
    return AIStatusResponse(available=is_ai_available())


@router.post("/parse", response_model=ParseResponse)
async def parse_user_input(
    body: ParseRequest,
    user: User = Depends(get_current_teaching_user),
):
    """Parse user natural language input into an intent (add student, pay salary, analytics, etc.)."""
    result = await parse_intent(body.input)
    return ParseResponse(**result)
