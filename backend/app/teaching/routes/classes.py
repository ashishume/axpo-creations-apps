"""Class routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.teaching.dependencies import get_teaching_db_session, get_current_teaching_user
from app.teaching.schemas.class_schema import ClassCreate, ClassUpdate, ClassResponse
from app.teaching.services.class_service import class_service
from app.teaching.models.user import User
from app.teaching.org_access import enforce_session_access

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/classes", tags=["teaching-classes"])


@router.post("", response_model=ClassResponse)
async def create_class(
    data: ClassCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await enforce_session_access(db, user, data.session_id)
    obj = await class_service.create(db, data)
    return ClassResponse.model_validate(obj)


@router.get("", response_model=list[ClassResponse])
async def list_classes(
    session_id: UUID | None = None,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    if session_id:
        await enforce_session_access(db, user, session_id)
        items = await class_service.list_by_session(db, session_id)
    elif user.organization_id:
        items = await class_service.list_by_organization(db, user.organization_id)
    else:
        items = await class_service.list_all(db)
    return [ClassResponse.model_validate(c) for c in items]


@router.post("/bulk", response_model=list[ClassResponse])
async def create_classes_bulk(
    data: list[ClassCreate],
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    session_ids = {d.session_id for d in data}
    for sid in session_ids:
        await enforce_session_access(db, user, sid)
    items = await class_service.create_many(db, data)
    return [ClassResponse.model_validate(c) for c in items]


@router.get("/{id}", response_model=ClassResponse)
async def get_class(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    obj = await class_service.get_or_404(db, id)
    await enforce_session_access(db, user, obj.session_id)
    return ClassResponse.model_validate(obj)


@router.patch("/{id}", response_model=ClassResponse)
async def update_class(
    id: UUID,
    data: ClassUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    existing = await class_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    obj = await class_service.update(db, id, data)
    return ClassResponse.model_validate(obj)


@router.delete("/{id}", status_code=204)
async def delete_class(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    existing = await class_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    await class_service.delete(db, id)
