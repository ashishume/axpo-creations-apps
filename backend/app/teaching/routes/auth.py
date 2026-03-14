"""Teaching auth routes - login, logout, refresh, me."""
from fastapi import APIRouter, Depends, Response

from app.core.security import set_auth_cookies, set_access_cookie, clear_auth_cookies, create_access_token
from app.teaching.dependencies import (
    get_teaching_db_session,
    get_current_teaching_user,
    get_teaching_refresh_token,
)
from app.teaching.schemas.auth import (
    LoginRequest, LoginResponse, RefreshResponse,
    UserResponse, RoleInfo, MeResponse, ChangePasswordRequest,
)
from app.teaching.services.auth import auth_service
from app.teaching.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/auth", tags=["teaching-auth"])


async def _build_user_response(db: AsyncSession, user: User) -> UserResponse:
    """Build UserResponse with embedded role info (role loaded via joinedload in get_current_teaching_user)."""
    role_info = None
    if user.role:
        role_info = RoleInfo(id=user.role.id, name=user.role.name, is_system=user.role.is_system)
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        name=user.name,
        role_id=user.role_id,
        role=role_info,
        organization_id=user.organization_id,
        must_change_password=user.must_change_password,
        is_active=user.is_active,
        last_login_at=user.last_login_at,
        staff_id=user.staff_id,
        student_id=user.student_id,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    data: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_teaching_db_session),
):
    user = await auth_service.login(db, data.username, data.password)
    access, refresh = auth_service.create_tokens(user, domain="teaching")
    set_auth_cookies(response, access, refresh)
    permissions = await auth_service.get_permissions_for_user(db, user)
    return LoginResponse(
        user=await _build_user_response(db, user),
        permissions=permissions,
    )


@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out"}


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    response: Response,
    refresh_token: str | None = Depends(get_teaching_refresh_token),
):
    payload = auth_service.refresh_access_token(refresh_token or "", domain="teaching")
    if not payload:
        return RefreshResponse(message="Invalid or expired refresh token")
    new_access = create_access_token({"sub": payload["sub"]}, domain="teaching")
    set_access_cookie(response, new_access)
    return RefreshResponse(message="Token refreshed")


@router.post("/change-password", status_code=204)
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await auth_service.change_password(db, user, data.current_password, data.new_password)


@router.get("/me", response_model=MeResponse)
async def me(
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    permissions = await auth_service.get_permissions_for_user(db, user)
    return MeResponse(
        user=await _build_user_response(db, user),
        permissions=permissions,
    )
