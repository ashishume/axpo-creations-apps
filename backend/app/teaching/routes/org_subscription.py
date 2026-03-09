"""Org-level subscription routes: status, create, verify, webhook, cancel."""
import logging

from fastapi import APIRouter, Depends, HTTPException, Request

from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.dependencies import (
    get_teaching_db_session,
    get_current_teaching_user,
    require_teaching_permission,
)
from app.teaching.models.user import User
from app.teaching.schemas.subscription import (
    CreateSubscriptionResponse,
    OrgSubscriptionStatus,
    VerifyOrgPaymentRequest,
    CreateOrgSubscriptionRequest,
)
from app.teaching.services import org_subscription as org_sub_svc

router = APIRouter(prefix="/org-subscription", tags=["teaching-org-subscription"])
logger = logging.getLogger(__name__)


def _require_org_user(user: User) -> None:
    if user.organization_id is None:
        raise HTTPException(status_code=403, detail="Organization required")


@router.get("/status", response_model=OrgSubscriptionStatus)
async def org_subscription_status(
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Return current org subscription status for the authenticated user's organization."""
    _require_org_user(user)
    data = await org_sub_svc.get_org_subscription_status(db, user.organization_id)
    return OrgSubscriptionStatus(**data)


@router.post("/create", response_model=CreateSubscriptionResponse)
async def org_subscription_create(
    body: CreateOrgSubscriptionRequest,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(require_teaching_permission("plans:manage")),
):
    """Create a Razorpay subscription for the user's org; returns subscription_id and key_id for checkout."""
    _require_org_user(user)
    result = org_sub_svc.create_org_subscription(
        user.organization_id,
        body.plan_type,
        body.billing_interval,
    )
    if not result:
        raise HTTPException(
            status_code=503,
            detail="Subscription creation unavailable. Check Razorpay configuration.",
        )
    return CreateSubscriptionResponse(
        subscription_id=result["subscription_id"],
        key_id=result["key_id"],
    )


@router.post("/verify")
async def org_subscription_verify(
    body: VerifyOrgPaymentRequest,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(require_teaching_permission("plans:manage")),
):
    """Verify payment signature and activate org subscription."""
    _require_org_user(user)
    ok = await org_sub_svc.verify_org_payment(
        db,
        user.organization_id,
        body.razorpay_payment_id,
        body.razorpay_subscription_id,
        body.razorpay_signature,
    )
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid payment or verification failed.")
    return {"success": True}


@router.post("/webhook")
async def org_subscription_webhook(
    request: Request,
    db: AsyncSession = Depends(get_teaching_db_session),
):
    """Razorpay webhook for org subscriptions. No auth."""
    body = await request.body()
    signature = (request.headers.get("X-Razorpay-Signature") or "").strip()
    handled = await org_sub_svc.handle_org_webhook(db, body, signature)
    if not handled and signature:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    return {"received": True, "handled": handled}


@router.post("/cancel")
async def org_subscription_cancel(
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(require_teaching_permission("plans:manage")),
):
    """Cancel the org's subscription."""
    _require_org_user(user)
    ok = await org_sub_svc.cancel_org_subscription(db, user.organization_id)
    if not ok:
        raise HTTPException(status_code=503, detail="Failed to cancel subscription.")
    return {"success": True}
