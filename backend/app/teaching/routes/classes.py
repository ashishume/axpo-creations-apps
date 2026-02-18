"""Class routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.teaching.dependencies import get_teaching_db_session, get_current_teaching_user
from app.teaching.schemas.class_schema import ClassCreate, ClassUpdate, ClassResponse
from app.teaching.services.class_service import class_service
from app.teaching.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/classes", tags=["teaching-classes"])


@router.post("", response_model=ClassResponse)
async def create_class(
    data: ClassCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    obj = await class_service.create(db, data)
    return ClassResponse.model_validate(obj)


@router.get("", response_model=list[ClassResponse])
async def list_classes(
    session_id: UUID | None = None,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    if session_id:
        items = await class_service.list_by_session(db, session_id)
    else:
        items = await class_service.list_all(db)
    return [ClassResponse.model_validate(c) for c in items]


@router.post("/bulk", response_model=list[ClassResponse])
async def create_classes_bulk(
    data: list[ClassCreate],
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    items = await class_service.create_many(db, data)
    return [ClassResponse.model_validate(c) for c in items]


@router.get("/{id}", response_model=ClassResponse)
async def get_class(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    obj = await class_service.get_or_404(db, id)
    return ClassResponse.model_validate(obj)


@router.patch("/{id}", response_model=ClassResponse)
async def update_class(
    id: UUID,
    data: ClassUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    obj = await class_service.update(db, id, data)
    return ClassResponse.model_validate(obj)


@router.delete("/{id}", status_code=204)
async def delete_class(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await class_service.delete(db, id)
