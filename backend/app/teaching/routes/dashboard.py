"""Dashboard stats route."""
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.dependencies import get_teaching_db_session, get_current_teaching_user
from app.teaching.models.user import User
from app.teaching.org_access import enforce_session_access
from app.teaching.schemas.dashboard import DashboardStatsResponse
from app.teaching.services.dashboard import compute_dashboard_stats

router = APIRouter(prefix="/dashboard", tags=["teaching-dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    session_id: UUID = Query(...),
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await enforce_session_access(db, user, session_id)
    return await compute_dashboard_stats(db, session_id)
