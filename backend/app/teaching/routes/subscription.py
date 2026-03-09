"""Subscription (premium plan) routes: status, create, verify, webhook, cancel, redeem coupon."""
import logging

from fastapi import APIRouter, Depends, HTTPException, Request

from sqlalchemy.ext.asyncio import AsyncSession

from app.teaching.dependencies import get_teaching_db_session, get_current_teaching_user
from app.teaching.models.user import User
from app.teaching.schemas.subscription import (
    CreateSubscriptionResponse,
    RedeemCouponRequest,
    SubscriptionStatus,
    VerifyPaymentRequest,
)
from app.teaching.services.subscription import (
    cancel_subscription,
    create_subscription,
    get_status,
    handle_webhook,
    redeem_coupon,
    verify_payment,
)

router = APIRouter(prefix="/subscription", tags=["teaching-subscription"])
logger = logging.getLogger(__name__)


@router.get("/status", response_model=SubscriptionStatus)
async def subscription_status(
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Return current subscription status for the authenticated user."""
    return await get_status(db, user.id)


@router.post("/create", response_model=CreateSubscriptionResponse)
async def subscription_create(
    user: User = Depends(get_current_teaching_user),
    platform: str = "default",
):
    """Create a Razorpay subscription and return subscription_id and key_id for checkout."""
    result = create_subscription(user.id, user.email or "", platform=platform)
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
async def subscription_verify(
    body: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Verify payment signature and activate premium."""
    ok = await verify_payment(
        db,
        user.id,
        body.razorpay_payment_id,
        body.razorpay_subscription_id,
        body.razorpay_signature,
        platform=body.platform,
    )
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid payment or verification failed.")
    return {"success": True, "plan_type": "premium"}


@router.post("/webhook")
async def subscription_webhook(
    request: Request,
    db: AsyncSession = Depends(get_teaching_db_session),
):
    """Razorpay webhook: subscription.charged, subscription.cancelled, subscription.expired. No auth."""
    body = await request.body()
    signature = (request.headers.get("X-Razorpay-Signature") or "").strip()
    handled = await handle_webhook(db, body, signature)
    if not handled and signature:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    return {"received": True, "handled": handled}


@router.post("/cancel")
async def subscription_cancel(
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Cancel the user's premium subscription."""
    ok = await cancel_subscription(db, user.id)
    if not ok:
        raise HTTPException(status_code=503, detail="Failed to cancel subscription.")
    return {"success": True}


@router.post("/redeem-coupon")
async def subscription_redeem_coupon(
    body: RedeemCouponRequest,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    """Redeem a coupon code to activate Premium for a period (no payment)."""
    success, message = await redeem_coupon(
        db, user.id, body.code, user_email=user.email
    )
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"success": True, "plan_type": "premium", "message": message}
