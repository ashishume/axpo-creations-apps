"""Staff routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.teaching.dependencies import get_teaching_db_session, get_current_teaching_user
from app.teaching.schemas.staff import StaffCreate, StaffUpdate, StaffResponse
from app.teaching.services.staff import staff_service
from app.teaching.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/staff", tags=["teaching-staff"])


@router.post("", response_model=StaffResponse)
async def create_staff(
    data: StaffCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    staff = await staff_service.create(db, data)
    return StaffResponse.model_validate(staff)


@router.get("", response_model=list[StaffResponse])
async def list_staff(
    session_id: UUID | None = None,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    if session_id:
        staff_list = await staff_service.list_by_session(db, session_id)
    else:
        staff_list = await staff_service.list_all(db)
    return [StaffResponse.model_validate(s) for s in staff_list]


@router.post("/bulk", response_model=list[StaffResponse])
async def create_staff_bulk(
    data: list[StaffCreate],
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    staff_list = await staff_service.create_many(db, data)
    return [StaffResponse.model_validate(s) for s in staff_list]


@router.get("/{id}", response_model=StaffResponse)
async def get_staff(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    staff = await staff_service.get_or_404(db, id)
    return StaffResponse.model_validate(staff)


@router.patch("/{id}", response_model=StaffResponse)
async def update_staff(
    id: UUID,
    data: StaffUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    staff = await staff_service.update(db, id, data)
    return StaffResponse.model_validate(staff)


@router.delete("/{id}", status_code=204)
async def delete_staff(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await staff_service.delete(db, id)
