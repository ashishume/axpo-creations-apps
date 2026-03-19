"""Super Admin routes: list org subscriptions, lock, unlock, grant, revoke."""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.dependencies import get_teaching_db_session, get_current_teaching_user
from app.teaching.models.user import User
from app.teaching.schemas.subscription import (
    OrgSubscriptionStatus,
    GrantOrgSubscriptionRequest,
    UpdateOrgSubscriptionPeriodRequest,
)
from app.teaching.services import org_subscription as org_sub_svc

router = APIRouter(prefix="/admin/subscriptions", tags=["teaching-admin-subscriptions"])
logger = logging.getLogger(__name__)


def _require_super_admin(user: User) -> None:
    if user.organization_id is not None:
        raise HTTPException(status_code=403, detail="Super Admin only")


@router.get("")
async def admin_list_org_subscriptions(
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """List all organizations with subscription status. Super Admin only."""
    _require_super_admin(user)
    return await org_sub_svc.list_orgs_with_subscription_status(db)


@router.get("/{org_id}", response_model=OrgSubscriptionStatus)
async def admin_get_org_subscription(
    org_id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Get subscription details for an organization. Super Admin only."""
    _require_super_admin(user)
    data = await org_sub_svc.get_org_subscription_status(db, org_id)
    return OrgSubscriptionStatus(**data)


@router.post("/{org_id}/lock")
async def admin_lock_org(
    org_id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Lock an organization (blocks access). Super Admin only."""
    _require_super_admin(user)
    await org_sub_svc.lock_org(db, org_id)
    return {"success": True, "message": "Organization locked"}


@router.post("/{org_id}/unlock")
async def admin_unlock_org(
    org_id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Unlock an organization. Super Admin only."""
    _require_super_admin(user)
    await org_sub_svc.unlock_org(db, org_id)
    return {"success": True, "message": "Organization unlocked"}


@router.post("/{org_id}/grant")
async def admin_grant_subscription(
    org_id: UUID,
    body: GrantOrgSubscriptionRequest,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Manually grant subscription to an org (no Razorpay). Super Admin only. Optional period_end overrides duration_days."""
    _require_super_admin(user)
    await org_sub_svc.grant_org_subscription(
        db,
        org_id,
        body.plan_type,
        body.billing_interval,
        body.duration_days,
        period_end=body.period_end,
    )
    return {"success": True, "message": "Subscription granted"}


@router.patch("/{org_id}")
async def admin_update_org_subscription_period(
    org_id: UUID,
    body: UpdateOrgSubscriptionPeriodRequest,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Set org subscription period (expiry date). Super Admin only."""
    _require_super_admin(user)
    await org_sub_svc.update_org_subscription_period(
        db,
        org_id,
        current_period_end=body.current_period_end,
        current_period_start=body.current_period_start,
    )
    return {"success": True, "message": "Subscription period updated"}


@router.post("/{org_id}/revoke")
async def admin_revoke_subscription(
    org_id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Revoke an org's subscription. Super Admin only."""
    _require_super_admin(user)
    await org_sub_svc.revoke_org_subscription(db, org_id)
    return {"success": True, "message": "Subscription revoked"}
