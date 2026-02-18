"""Common FastAPI dependencies (domain-agnostic)."""
from fastapi import Cookie, Request

from app.core.security import ACCESS_TOKEN_COOKIE, decode_token
from app.core.exceptions import UnauthorizedError


def get_access_token_from_cookie(request: Request, access_token: str | None = Cookie(None)) -> str | None:
    """Get access token from cookie. Used by domain-specific auth dependencies."""
    return access_token


def get_payload_from_token(token: str | None) -> dict | None:
    """Decode JWT and return payload. Returns None if missing or invalid."""
    if not token:
        return None
    return decode_token(token)


def require_token_payload(token: str | None, expected_domain: str) -> dict:
    """Require valid access token and optional domain check. Raises UnauthorizedError."""
    if not token:
        raise UnauthorizedError("Not authenticated")
    payload = decode_token(token)
    if not payload:
        raise UnauthorizedError("Invalid or expired token")
    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type")
    if expected_domain and payload.get("domain") != expected_domain:
        raise UnauthorizedError("Invalid token for this API")
    return payload
