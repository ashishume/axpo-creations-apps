"""Upload files to Supabase Storage. Used when TEACHING_SUPABASE_URL and SERVICE_ROLE_KEY are set (e.g. on Railway)."""
import uuid

import httpx

from app.config import get_settings

BUCKET_STUDENT_PHOTOS = "student-photos"
BUCKET_RECEIPTS = "receipts"


def _content_type_to_ext(content_type: str) -> str:
    m = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
    }
    return m.get(content_type, ".jpg")


async def upload_to_supabase_storage(
    raw: bytes,
    content_type: str,
    bucket: str,
    prefix: str,
) -> str | None:
    """
    Upload file to Supabase Storage. Returns public URL or None if config missing.
    Buckets must exist and be public in Supabase Dashboard (Storage).
    """
    settings = get_settings()
    url = (settings.TEACHING_SUPABASE_URL or "").rstrip("/")
    key = settings.TEACHING_SUPABASE_SERVICE_ROLE_KEY
    if not url or not key:
        return None
    ext = _content_type_to_ext(content_type)
    object_name = f"{prefix}-{uuid.uuid4().hex}{ext}"
    upload_url = f"{url}/storage/v1/object/{bucket}/{object_name}"
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": content_type,
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(upload_url, content=raw, headers=headers)
            r.raise_for_status()
    except Exception:
        return None
    return f"{url}/storage/v1/object/public/{bucket}/{object_name}"
