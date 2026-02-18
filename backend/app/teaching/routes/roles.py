"""Role routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.teaching.dependencies import get_teaching_db_session, get_current_teaching_user
from app.teaching.schemas.role import RoleCreate, RoleUpdate, RoleResponse
from app.teaching.services.role import role_service
from app.teaching.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/roles", tags=["teaching-roles"])


def _role_to_response(role, permissions: list[str]) -> RoleResponse:
    return RoleResponse(
        id=role.id,
        name=role.name,
        description=role.description,
        is_system=role.is_system,
        permissions=permissions,
        created_at=role.created_at,
        updated_at=role.updated_at,
    )


@router.get("", response_model=list[RoleResponse])
async def list_roles(
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    rows = await role_service.list_all(db)
    return [_role_to_response(r, p) for r, p in rows]


@router.get("/{id}", response_model=RoleResponse)
async def get_role(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    role, perms = await role_service.get_or_404(db, id)
    return _role_to_response(role, perms)


@router.post("", response_model=RoleResponse)
async def create_role(
    data: RoleCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    role, perms = await role_service.create(db, data)
    return _role_to_response(role, perms)


@router.patch("/{id}", response_model=RoleResponse)
async def update_role(
    id: UUID,
    data: RoleUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    role, perms = await role_service.update(db, id, data)
    return _role_to_response(role, perms)


@router.delete("/{id}", status_code=204)
async def delete_role(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await role_service.delete(db, id)
