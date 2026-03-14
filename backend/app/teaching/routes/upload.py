"""File upload routes for student photos and receipt photos (max 2MB).
When TEACHING_SUPABASE_URL and TEACHING_SUPABASE_SERVICE_ROLE_KEY are set, files are
uploaded to Supabase Storage (persists on Railway). Otherwise files are stored locally
(ephemeral on Railway – use Supabase Storage in production).
"""
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.teaching.dependencies import get_current_teaching_user, require_active_org_subscription
from app.teaching.models.user import User
from app.teaching.services.storage import (
    BUCKET_RECEIPTS,
    BUCKET_STUDENT_PHOTOS,
    upload_to_supabase_storage,
)

router = APIRouter(
    prefix="/upload",
    tags=["teaching-upload"],
    dependencies=[Depends(require_active_org_subscription)],
)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


def _allowed_ext(content_type: str) -> str:
    m = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
    }
    return m.get(content_type, ".jpg")


@router.post("/student-photo")
async def upload_student_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_teaching_user),
):
    """Upload a student profile photo. Max 2MB. Returns public URL path."""
    settings = get_settings()
    return await _upload_image(
        file,
        settings.UPLOAD_DIR,
        settings.UPLOAD_MAX_BYTES,
        prefix="student",
        bucket=BUCKET_STUDENT_PHOTOS,
    )


@router.post("/receipt")
async def upload_receipt(
    file: UploadFile = File(...),
    user: User = Depends(get_current_teaching_user),
):
    """Upload a fee receipt photo. Max 2MB. Returns public URL path."""
    settings = get_settings()
    return await _upload_image(
        file,
        settings.UPLOAD_DIR,
        settings.UPLOAD_MAX_BYTES,
        prefix="receipt",
        bucket=BUCKET_RECEIPTS,
    )


async def _upload_image(
    file: UploadFile,
    upload_dir: str,
    max_bytes: int,
    prefix: str,
    bucket: str,
) -> JSONResponse:
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image (JPEG, PNG, GIF, or WebP).",
        )
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Allowed types: JPEG, PNG, GIF, WebP.",
        )

    raw = await file.read()
    if len(raw) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File must be under {max_bytes // (1024 * 1024)}MB.",
        )

    # Prefer Supabase Storage when configured (persists on Railway)
    public_url = await upload_to_supabase_storage(raw, content_type, bucket, prefix)
    if public_url:
        return JSONResponse(content={"url": public_url})

    # Fallback: local filesystem (ephemeral on Railway)
    path = Path(upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    ext = _allowed_ext(content_type)
    name = f"{prefix}-{uuid.uuid4().hex}{ext}"
    file_path = path / name
    file_path.write_bytes(raw)
    url_path = f"/upload/files/{name}"
    return JSONResponse(content={"url": url_path})
