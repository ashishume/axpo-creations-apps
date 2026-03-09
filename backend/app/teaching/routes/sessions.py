"""Session routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.teaching.dependencies import get_teaching_db_session, get_current_teaching_user
from app.teaching.schemas.session import SessionCreate, SessionUpdate, SessionResponse
from app.teaching.services.session import session_service
from app.teaching.models.user import User
from app.teaching.org_access import enforce_school_access, enforce_session_access

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/sessions", tags=["teaching-sessions"])


@router.post("", response_model=SessionResponse)
async def create_session(
    data: SessionCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await enforce_school_access(db, user, data.school_id)
    session = await session_service.create(db, data)
    return SessionResponse.model_validate(session)


@router.get("", response_model=list[SessionResponse])
async def list_sessions(
    school_id: UUID | None = None,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    if school_id:
        await enforce_school_access(db, user, school_id)
        sessions = await session_service.list_by_school(db, school_id)
    elif user.organization_id:
        sessions = await session_service.list_by_organization(db, user.organization_id)
    else:
        sessions = await session_service.list_all(db)
    return [SessionResponse.model_validate(s) for s in sessions]


@router.get("/{id}", response_model=SessionResponse)
async def get_session(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await enforce_session_access(db, user, id)
    session = await session_service.get_or_404(db, id)
    return SessionResponse.model_validate(session)


@router.patch("/{id}", response_model=SessionResponse)
async def update_session(
    id: UUID,
    data: SessionUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await enforce_session_access(db, user, id)
    session = await session_service.update(db, id, data)
    return SessionResponse.model_validate(session)


@router.delete("/{id}", status_code=204)
async def delete_session(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await enforce_session_access(db, user, id)
    await session_service.delete(db, id)
