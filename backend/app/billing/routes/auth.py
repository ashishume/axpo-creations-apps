"""Auth routes - login, logout, refresh, me."""
from fastapi import APIRouter, Depends, Response

from app.core.security import set_auth_cookies, set_access_cookie, clear_auth_cookies, create_access_token
from app.billing.dependencies import (
    get_billing_db_session,
    get_current_billing_user,
    get_billing_refresh_token,
)
from app.billing.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, RefreshResponse, UserResponse
from app.billing.services.auth import auth_service
from app.billing.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/auth", tags=["billing-auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    data: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_billing_db_session),
):
    user = await auth_service.login(db, data.email, data.password)
    access, refresh = auth_service.create_tokens(user, domain="billing")
    set_auth_cookies(response, access, refresh)
    return LoginResponse(
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            created_at=user.created_at,
        ),
    )


@router.post("/register", response_model=LoginResponse)
async def register(
    data: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_billing_db_session),
):
    # Validate role to avoid DB constraint issues
    role = (data.role or "user").strip().lower()
    if role not in ("user", "admin"):
        role = "user"
    user = await auth_service.register(
        db, data.email, data.password, name=data.name, role=role
    )
    # Commit is done by get_billing_db_session when the request ends
    access, refresh = auth_service.create_tokens(user, domain="billing")
    set_auth_cookies(response, access, refresh)
    return LoginResponse(
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            created_at=user.created_at,
        ),
    )


@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out"}


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    response: Response,
    refresh_token: str | None = Depends(get_billing_refresh_token),
):
    payload = auth_service.refresh_access_token(refresh_token or "", domain="billing")
    if not payload:
        return RefreshResponse(message="Invalid or expired refresh token")
    new_access = create_access_token({"sub": payload["sub"]}, domain="billing")
    set_access_cookie(response, new_access)
    return RefreshResponse(message="Token refreshed")


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_billing_user)):
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        created_at=user.created_at,
    )
