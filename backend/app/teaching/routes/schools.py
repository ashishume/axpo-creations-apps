"""School routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.teaching.dependencies import get_teaching_db_session, get_current_teaching_user
from app.teaching.schemas.school import SchoolCreate, SchoolUpdate, SchoolResponse
from app.teaching.services.school import school_service
from app.teaching.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/schools", tags=["teaching-schools"])


@router.post("", response_model=SchoolResponse)
async def create_school(
    data: SchoolCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    school = await school_service.create(db, data)
    return SchoolResponse.model_validate(school)


@router.get("", response_model=list[SchoolResponse])
async def list_schools(
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    schools = await school_service.list_all(db)
    return [SchoolResponse.model_validate(s) for s in schools]


@router.get("/{id}", response_model=SchoolResponse)
async def get_school(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    school = await school_service.get_or_404(db, id)
    return SchoolResponse.model_validate(school)


@router.patch("/{id}", response_model=SchoolResponse)
async def update_school(
    id: UUID,
    data: SchoolUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    school = await school_service.update(db, id, data)
    return SchoolResponse.model_validate(school)


@router.delete("/{id}", status_code=204)
async def delete_school(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await school_service.delete(db, id)
