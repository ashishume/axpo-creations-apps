"""User management routes: list, create, update, delete, reset password."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.teaching.dependencies import (
    get_teaching_db_session,
    get_current_teaching_user,
    require_teaching_permission,
)
from app.teaching.schemas.auth import (
    UserResponse,
    UserListResponse,
    CreateUserRequest,
    UpdateUserRequest,
    ResetPasswordRequest,
)
from app.teaching.services.user import user_service
from app.teaching.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/users", tags=["teaching-users"])


def _user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        name=user.name,
        role_id=user.role_id,
        organization_id=user.organization_id,
        must_change_password=user.must_change_password,
        is_active=user.is_active,
        last_login_at=user.last_login_at,
        staff_id=user.staff_id,
        student_id=user.student_id,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.get("", response_model=UserListResponse)
async def list_users(
    page: int = 1,
    page_size: int = 10,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(require_teaching_permission("users:view")),
):
    users, total = await user_service.list_paginated(db, page=page, page_size=page_size)
    return UserListResponse(users=[_user_to_response(u) for u in users], total=total)


@router.post("", response_model=UserResponse)
async def create_user(
    data: CreateUserRequest,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(require_teaching_permission("users:create")),
):
    created = await user_service.create(db, data)
    return _user_to_response(created)


@router.get("/{id}", response_model=UserResponse)
async def get_user(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(require_teaching_permission("users:view")),
):
    u = await user_service.get_or_404(db, id)
    return _user_to_response(u)


@router.patch("/{id}", response_model=UserResponse)
async def update_user(
    id: UUID,
    data: UpdateUserRequest,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(require_teaching_permission("users:edit")),
):
    updated = await user_service.update(db, id, data)
    return _user_to_response(updated)


@router.delete("/{id}", status_code=204)
async def delete_user(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(require_teaching_permission("users:delete")),
):
    await user_service.delete(db, id)


@router.post("/{id}/reset-password", status_code=204)
async def reset_password(
    id: UUID,
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(require_teaching_permission("users:edit")),
):
    await user_service.reset_password(db, id, data.new_password)
