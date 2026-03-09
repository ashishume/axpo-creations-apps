"""Subscription (premium plan) service: Razorpay create, verify, webhook, cancel, coupon redeem."""
import hmac
import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.teaching.models.subscription import CouponRedemption, PremiumCoupon, UserSubscription
from app.teaching.schemas.subscription import SubscriptionStatus

SUBSCRIPTION_TOTAL_COUNT = 60
logger = logging.getLogger(__name__)


def _get_razorpay_client():
    """Return Razorpay client."""
    settings = get_settings()
    if not (settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET):
        return None
    try:
        import razorpay
        return razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
        )
    except Exception as e:
        logger.warning("Razorpay client init failed: %s", e)
        return None


def create_subscription(
    user_id: UUID,
    user_email: str,
    platform: str = "default",
) -> dict | None:
    """
    Create a Razorpay subscription. Returns dict with subscription_id and key_id for checkout.
    """
    settings = get_settings()
    plan_id = settings.RAZORPAY_PLAN_ID
    if not plan_id:
        logger.warning("Razorpay plan id not set for platform=%s", platform)
        return None
    rp = _get_razorpay_client()
    if not rp:
        return None
    try:
        data = {
            "plan_id": plan_id,
            "total_count": SUBSCRIPTION_TOTAL_COUNT,
            "quantity": 1,
            "customer_notify": 0,
            "notes": {"user_id": str(user_id)},
        }
        sub = rp.subscription.create(data)
        sub_id = sub.get("id")
        if not sub_id:
            return None
        return {
            "subscription_id": sub_id,
            "key_id": settings.RAZORPAY_KEY_ID,
        }
    except Exception as e:
        logger.exception("Razorpay subscription create failed for platform=%s: %s", platform, e)
        return None


def _verify_signature(
    razorpay_payment_id: str,
    razorpay_subscription_id: str,
    signature: str,
) -> bool:
    """Verify Razorpay payment signature (HMAC SHA256)."""
    settings = get_settings()
    if not settings.RAZORPAY_KEY_SECRET:
        return False
    message = f"{razorpay_payment_id}|{razorpay_subscription_id}"
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


async def verify_payment(
    db: AsyncSession,
    user_id: UUID,
    razorpay_payment_id: str,
    razorpay_subscription_id: str,
    razorpay_signature: str,
    platform: str | None = None,
) -> bool:
    """
    Verify payment signature and fetch subscription details from Razorpay, then upsert user_subscriptions.
    """
    if not _verify_signature(razorpay_payment_id, razorpay_subscription_id, razorpay_signature):
        logger.warning("Subscription payment signature verification failed for user %s", user_id)
        return False
    rp = _get_razorpay_client()
    if not rp:
        return False
    try:
        sub = rp.subscription.fetch(razorpay_subscription_id)
        status = (sub.get("status") or "").lower()
        plan_type = "premium"
        db_status = "active"
        if status in ("cancelled", "expired", "completed"):
            plan_type = "free"
            db_status = "cancelled" if status == "cancelled" else "expired" if status == "expired" else "inactive"
        current_start = sub.get("current_start")
        current_end = sub.get("current_end")
        now = datetime.now(timezone.utc)
        period_start = datetime.utcfromtimestamp(current_start).replace(tzinfo=timezone.utc) if current_start else None
        period_end = datetime.utcfromtimestamp(current_end).replace(tzinfo=timezone.utc) if current_end else None

        result = await db.execute(select(UserSubscription).where(UserSubscription.user_id == user_id))
        row = result.scalar_one_or_none()
        if row:
            row.razorpay_subscription_id = razorpay_subscription_id
            row.razorpay_payment_id = razorpay_payment_id
            row.plan_type = plan_type
            row.status = db_status
            row.amount = Decimal("99.0")
            row.current_period_start = period_start
            row.current_period_end = period_end
            row.updated_at = now
        else:
            row = UserSubscription(
                user_id=user_id,
                razorpay_subscription_id=razorpay_subscription_id,
                razorpay_payment_id=razorpay_payment_id,
                plan_type=plan_type,
                status=db_status,
                amount=Decimal("99.0"),
                current_period_start=period_start,
                current_period_end=period_end,
            )
            db.add(row)
        await db.flush()
        return True
    except Exception as e:
        logger.exception("Razorpay subscription fetch or DB update failed: %s", e)
        return False


async def get_status(db: AsyncSession, user_id: UUID) -> SubscriptionStatus:
    """
    Get current subscription status for user.
    Coupon-based premium (no razorpay_subscription_id) is treated as expired when current_period_end has passed.
    """
    result = await db.execute(select(UserSubscription).where(UserSubscription.user_id == user_id))
    row = result.scalar_one_or_none()
    if not row:
        return SubscriptionStatus(plan_type="free", status="inactive")

    plan_type = row.plan_type or "free"
    status = row.status or "inactive"
    if status != "active":
        plan_type = "free"

    end_dt = row.current_period_end
    if (
        status == "active"
        and plan_type == "premium"
        and not row.razorpay_subscription_id
        and end_dt is not None
    ):
        now_utc = datetime.now(timezone.utc)
        end_utc = end_dt if end_dt.tzinfo else end_dt.replace(tzinfo=timezone.utc)
        if end_utc < now_utc:
            await db.execute(
                update(UserSubscription)
                .where(UserSubscription.user_id == user_id)
                .values(plan_type="free", status="expired", updated_at=now_utc)
            )
            await db.flush()
            plan_type = "free"
            status = "expired"
            logger.info("Coupon-based premium expired for user %s (period ended %s)", user_id, end_dt)

    platform_val = None
    if row.razorpay_subscription_id:
        platform_val = "razorpay"

    amount_float = float(row.amount) if row.amount is not None else None
    return SubscriptionStatus(
        plan_type=plan_type,
        status=status,
        amount=amount_float,
        current_period_start=row.current_period_start,
        current_period_end=row.current_period_end,
        razorpay_subscription_id=row.razorpay_subscription_id,
        platform=platform_val,
    )


def _verify_webhook_signature(body: bytes, signature: str) -> bool:
    """Verify Razorpay webhook X-Razorpay-Signature."""
    settings = get_settings()
    secret = (settings.RAZORPAY_WEBHOOK_SECRET or "").strip()
    if not secret:
        logger.warning("No Razorpay webhook secret set, skipping webhook verification")
        return True
    expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


async def handle_webhook(db: AsyncSession, body: bytes, signature: str) -> bool:
    """
    Handle Razorpay webhook events: subscription.charged, subscription.cancelled, subscription.expired.
    Returns True if signature is valid and event was handled.
    """
    if not _verify_webhook_signature(body, signature):
        return False
    try:
        data = json.loads(body.decode("utf-8"))
    except Exception as e:
        logger.warning("Webhook body parse error: %s", e)
        return False

    event = data.get("event") or data.get("event_type") or ""
    payload = data.get("payload") or data
    subscription = (
        payload.get("payload", {}).get("subscription", {}).get("entity")
        or payload.get("subscription")
        or {}
    )
    sub_id = subscription.get("id")
    if not sub_id:
        logger.warning("Webhook missing subscription id: %s", event)
        return False

    result = await db.execute(
        select(UserSubscription).where(UserSubscription.razorpay_subscription_id == sub_id)
    )
    row = result.scalar_one_or_none()
    if not row:
        logger.warning("Webhook subscription %s not found in DB", sub_id)
        return False

    user_id = row.user_id
    now = datetime.now(timezone.utc)

    if event == "subscription.charged":
        payment = (
            payload.get("payload", {}).get("payment", {}).get("entity")
            or payload.get("payment")
            or {}
        )
        current_start = subscription.get("current_start")
        current_end = subscription.get("current_end")
        row.plan_type = "premium"
        row.status = "active"
        row.razorpay_payment_id = payment.get("id")
        row.amount = Decimal((payment.get("amount") or 0) / 100.0)
        row.current_period_start = (
            datetime.utcfromtimestamp(current_start).replace(tzinfo=timezone.utc) if current_start else None
        )
        row.current_period_end = (
            datetime.utcfromtimestamp(current_end).replace(tzinfo=timezone.utc) if current_end else None
        )
        row.updated_at = now
        await db.flush()
        return True

    if event in ("subscription.cancelled", "subscription.expired"):
        row.plan_type = "free"
        row.status = "cancelled" if event == "subscription.cancelled" else "expired"
        row.updated_at = now
        await db.flush()
        return True

    return False


async def cancel_subscription(db: AsyncSession, user_id: UUID) -> bool:
    """
    Cancel the user's premium subscription.
    If from Razorpay: cancel in Razorpay then update DB. If coupon-based: update DB only.
    """
    result = await db.execute(select(UserSubscription).where(UserSubscription.user_id == user_id))
    row = result.scalar_one_or_none()
    if not row:
        return True
    if row.status not in ("active", "pending"):
        return True

    sub_id = row.razorpay_subscription_id
    now = datetime.now(timezone.utc)

    if not sub_id:
        row.plan_type = "free"
        row.status = "cancelled"
        row.updated_at = now
        await db.flush()
        logger.info("Cancelled coupon-based premium for user %s", user_id)
        return True

    rp = _get_razorpay_client()
    if not rp:
        return False
    try:
        rp.subscription.cancel(sub_id)
        row.plan_type = "free"
        row.status = "cancelled"
        row.updated_at = now
        await db.flush()
        return True
    except Exception as e:
        logger.exception("Razorpay subscription cancel failed: %s", e)
        return False


async def redeem_coupon(
    db: AsyncSession,
    user_id: UUID,
    code: str,
    user_email: str | None = None,
) -> tuple[bool, str]:
    """
    Redeem a premium coupon for the user. On success, create or update user_subscriptions
    and log to coupon_redemptions. Returns (success, message).
    """
    code_clean = (code or "").strip().upper()
    if not code_clean:
        return False, "Invalid coupon code."
    try:
        result = await db.execute(select(PremiumCoupon).where(PremiumCoupon.code == code_clean))
        coupon = result.scalar_one_or_none()
        if not coupon:
            return False, "Coupon not found or invalid."

        if coupon.used_count >= coupon.max_uses:
            return False, "This coupon has reached its maximum uses."

        now = datetime.now(timezone.utc)
        if coupon.valid_until:
            end = coupon.valid_until if coupon.valid_until.tzinfo else coupon.valid_until.replace(tzinfo=timezone.utc)
            if now > end:
                return False, "This coupon has expired."
        if coupon.valid_from:
            start = coupon.valid_from if coupon.valid_from.tzinfo else coupon.valid_from.replace(tzinfo=timezone.utc)
            if now < start:
                return False, "This coupon is not yet valid."

        coupon.used_count += 1
        period_end = now + timedelta(days=coupon.duration_days)

        result = await db.execute(select(UserSubscription).where(UserSubscription.user_id == user_id))
        sub_row = result.scalar_one_or_none()
        if sub_row:
            sub_row.plan_type = "premium"
            sub_row.status = "active"
            sub_row.amount = Decimal("99.0")
            sub_row.current_period_start = now
            sub_row.current_period_end = period_end
            sub_row.razorpay_subscription_id = None
            sub_row.razorpay_payment_id = None
            sub_row.updated_at = now
        else:
            sub_row = UserSubscription(
                user_id=user_id,
                plan_type="premium",
                status="active",
                amount=Decimal("99.0"),
                current_period_start=now,
                current_period_end=period_end,
            )
            db.add(sub_row)
        await db.flush()

        redemption = CouponRedemption(
            user_id=user_id,
            user_email=(user_email or "").strip() or None,
            coupon_code=code_clean,
            coupon_id=coupon.id,
            success=True,
        )
        db.add(redemption)
        await db.flush()

        logger.info("Coupon %s redeemed for user %s, premium until %s", code_clean, user_id, period_end.isoformat())
        return True, "Premium activated successfully."
    except Exception as e:
        logger.exception("Coupon redeem failed: %s", e)
        return False, "Failed to redeem coupon. Please try again."
