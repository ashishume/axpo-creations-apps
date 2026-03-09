"""Teaching API router - mounts all teaching routes at /teaching/api/v1."""
from fastapi import APIRouter

from app.teaching.routes import (
    auth,
    ai_assistant,
    dashboard,
    organizations,
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
)

router = APIRouter()

router.include_router(auth.router)
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
