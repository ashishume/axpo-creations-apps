"""Teaching API router - mounts all teaching routes at /teaching/api/v1."""
from pathlib import Path

from fastapi import APIRouter
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.teaching.routes import (
    auth,
    admin_subscriptions,
    ai_assistant,
    dashboard,
    organizations,
    org_subscription,
    roles,
    schools,
    sessions,
    classes,
    students,
    staff,
    expenses,
    stocks,
    fixed_costs,
    leaves,
    users,
    subscription,
    upload,
)

router = APIRouter()

# Ensure upload directory exists and serve uploaded files (student photos, receipts)
_settings = get_settings()
_upload_dir = Path(_settings.UPLOAD_DIR)
_upload_dir.mkdir(parents=True, exist_ok=True)
router.mount("/upload/files", StaticFiles(directory=str(_upload_dir)), name="upload_files")

router.include_router(upload.router)
router.include_router(auth.router)
router.include_router(org_subscription.router)
router.include_router(admin_subscriptions.router)
router.include_router(ai_assistant.router)
router.include_router(dashboard.router)
router.include_router(users.router)
router.include_router(organizations.router)
router.include_router(roles.router)
router.include_router(schools.router)
router.include_router(sessions.router)
router.include_router(classes.router)
router.include_router(students.router)
router.include_router(staff.router)
router.include_router(expenses.router)
router.include_router(stocks.router)
router.include_router(fixed_costs.router)
router.include_router(leaves.router)
router.include_router(subscription.router)
