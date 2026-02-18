"""JWT and HTTP-only cookie helpers. Domain-agnostic (domain passed as argument)."""
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from fastapi import Response
from jose import JWTError, jwt

from app.config import get_settings

# Bcrypt has a 72-byte limit; bcrypt 4.x raises ValueError for longer input
BCRYPT_MAX_PASSWORD_BYTES = 72

# Cookie names - suffix with domain for multi-domain if needed
ACCESS_TOKEN_COOKIE = "access_token"
REFRESH_TOKEN_COOKIE = "refresh_token"


def _password_bytes(plain: str) -> bytes:
    """Encode password to bytes and truncate to bcrypt limit."""
    b = plain.encode("utf-8")
    return b[:BCRYPT_MAX_PASSWORD_BYTES] if len(b) > BCRYPT_MAX_PASSWORD_BYTES else b


def verify_password(plain: str, hashed: str) -> bool:
    """Verify plain password against bcrypt hash. Uses bcrypt directly to avoid passlib+bcrypt 4.x issues."""
    try:
        return bcrypt.checkpw(_password_bytes(plain), hashed.encode("utf-8") if isinstance(hashed, str) else hashed)
    except Exception:
        return False


def hash_password(password: str) -> str:
    """Hash password with bcrypt."""
    return bcrypt.hashpw(_password_bytes(password), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict[str, Any], domain: str = "billing") -> str:
    """Create short-lived JWT access token. domain is for token payload only (e.g. 'billing' or 'teaching')."""
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "sub": str(to_encode.get("sub", "")), "domain": domain, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict[str, Any], domain: str = "billing") -> str:
    """Create long-lived JWT refresh token."""
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "sub": str(to_encode.get("sub", "")), "domain": domain, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any] | None:
    """Decode and validate JWT. Returns payload or None if invalid."""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
) -> None:
    """Set HTTP-only auth cookies on response."""
    settings = get_settings()
    max_age_access = get_settings().ACCESS_TOKEN_EXPIRE_MINUTES * 60
    max_age_refresh = get_settings().REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=access_token,
        max_age=max_age_access,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path="/",
        domain=settings.COOKIE_DOMAIN or None,
    )
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=refresh_token,
        max_age=max_age_refresh,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path="/",
        domain=settings.COOKIE_DOMAIN or None,
    )


def set_access_cookie(response: Response, access_token: str) -> None:
    """Set only the access token cookie (e.g. after refresh). Same options as set_auth_cookies."""
    settings = get_settings()
    max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=access_token,
        max_age=max_age,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path="/",
        domain=settings.COOKIE_DOMAIN or None,
    )


def clear_auth_cookies(response: Response) -> None:
    """Clear auth cookies (logout). Uses same path/domain as set_cookie for reliable deletion."""
    settings = get_settings()
    kwargs = {"path": "/"}
    if settings.COOKIE_DOMAIN:
        kwargs["domain"] = settings.COOKIE_DOMAIN
    response.delete_cookie(ACCESS_TOKEN_COOKIE, **kwargs)
    response.delete_cookie(REFRESH_TOKEN_COOKIE, **kwargs)
