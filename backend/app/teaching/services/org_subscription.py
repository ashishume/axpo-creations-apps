"""Org-level subscription service: Razorpay create, verify, webhook, cancel, lock, grant."""
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
from app.teaching.models.organization import Organization
from app.teaching.models.subscription import OrgSubscription

logger = logging.getLogger(__name__)

# Razorpay subscription total_count by interval (number of billing cycles)
SUBSCRIPTION_TOTAL_COUNT = {"monthly": 12, "quarterly": 4, "annual": 1}


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


def create_org_subscription(
    org_id: UUID,
    plan_type: str,
    billing_interval: str,
) -> dict | None:
    """
    Create a Razorpay subscription for the organization.
    Returns dict with subscription_id and key_id for checkout.
    """
    settings = get_settings()
    plan_id = settings.get_razorpay_plan_id(plan_type, billing_interval)
    if not plan_id:
        logger.warning("No Razorpay plan for plan_type=%s billing_interval=%s", plan_type, billing_interval)
        return None
    rp = _get_razorpay_client()
    if not rp:
        return None
    total_count = SUBSCRIPTION_TOTAL_COUNT.get(billing_interval, 12)
    try:
        data = {
            "plan_id": plan_id,
            "total_count": total_count,
            "quantity": 1,
            "customer_notify": 0,
            "notes": {"organization_id": str(org_id)},
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
        logger.exception("Razorpay org subscription create failed: %s", e)
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


async def verify_org_payment(
    db: AsyncSession,
    org_id: UUID,
    razorpay_payment_id: str,
    razorpay_subscription_id: str,
    razorpay_signature: str,
) -> bool:
    """
    Verify payment signature and fetch subscription from Razorpay, then upsert OrgSubscription.
    """
    if not _verify_signature(razorpay_payment_id, razorpay_subscription_id, razorpay_signature):
        logger.warning("Org subscription payment signature verification failed for org %s", org_id)
        return False
    rp = _get_razorpay_client()
    if not rp:
        return False
    try:
        sub = rp.subscription.fetch(razorpay_subscription_id)
        status = (sub.get("status") or "").lower()
        plan_id_rz = (sub.get("plan_id") or "").lower()
        plan_type = "premium" if ("premium" in plan_id_rz or "ai" in plan_id_rz) else "starter"
        billing_interval = "monthly"
        db_status = "active"
        if status in ("cancelled", "expired"):
            db_status = "cancelled" if status == "cancelled" else "expired"
        elif status == "halted":
            db_status = "halted"
        elif status == "pending":
            db_status = "pending"

        current_start = sub.get("current_start")
        current_end = sub.get("current_end")
        now = datetime.now(timezone.utc)
        period_start = (
            datetime.utcfromtimestamp(current_start).replace(tzinfo=timezone.utc) if current_start else now
        )
        period_end = (
            datetime.utcfromtimestamp(current_end).replace(tzinfo=timezone.utc) if current_end else None
        )
        if "annual" in plan_id_rz or "year" in plan_id_rz:
            billing_interval = "annual"
        elif "quarter" in plan_id_rz:
            billing_interval = "quarterly"

        result = await db.execute(
            select(OrgSubscription).where(OrgSubscription.organization_id == org_id)
        )
        row = result.scalar_one_or_none()
        amount_val = None
        if row:
            row.razorpay_subscription_id = razorpay_subscription_id
            row.razorpay_payment_id = razorpay_payment_id
            row.plan_type = plan_type
            row.billing_interval = billing_interval
            row.status = db_status
            row.amount = amount_val
            row.current_period_start = period_start
            row.current_period_end = period_end
            row.updated_at = now
        else:
            row = OrgSubscription(
                organization_id=org_id,
                razorpay_subscription_id=razorpay_subscription_id,
                razorpay_payment_id=razorpay_payment_id,
                plan_type=plan_type,
                billing_interval=billing_interval,
                status=db_status,
                amount=amount_val,
                current_period_start=period_start,
                current_period_end=period_end,
            )
            db.add(row)
        await db.flush()
        return True
    except Exception as e:
        logger.exception("Razorpay org subscription fetch or DB update failed: %s", e)
        return False


async def get_org_subscription_status(db: AsyncSession, org_id: UUID) -> dict:
    """
    Get current org subscription status. Returns dict with plan_type, status, is_locked, etc.
    """
    result = await db.execute(
        select(OrgSubscription).where(OrgSubscription.organization_id == org_id)
    )
    row = result.scalar_one_or_none()
    if not row:
        return {
            "plan_type": "starter",
            "billing_interval": "monthly",
            "status": "inactive",
            "is_locked": False,
            "amount": None,
            "current_period_start": None,
            "current_period_end": None,
            "razorpay_subscription_id": None,
        }
    end_dt = row.current_period_end
    status = row.status or "inactive"
    if (
        status == "active"
        and end_dt is not None
        and not row.razorpay_subscription_id
    ):
        now_utc = datetime.now(timezone.utc)
        end_utc = end_dt if end_dt.tzinfo else end_dt.replace(tzinfo=timezone.utc)
        if end_utc < now_utc:
            await db.execute(
                update(OrgSubscription)
                .where(OrgSubscription.organization_id == org_id)
                .values(status="expired", updated_at=now_utc)
            )
            await db.flush()
            status = "expired"
    amount_float = float(row.amount) if row.amount is not None else None
    return {
        "plan_type": row.plan_type or "starter",
        "billing_interval": row.billing_interval or "monthly",
        "status": status,
        "is_locked": row.is_locked or False,
        "amount": amount_float,
        "current_period_start": row.current_period_start,
        "current_period_end": row.current_period_end,
        "razorpay_subscription_id": row.razorpay_subscription_id,
    }


def _verify_webhook_signature(body: bytes, signature: str) -> bool:
    """Verify Razorpay webhook X-Razorpay-Signature."""
    settings = get_settings()
    secret = (settings.RAZORPAY_WEBHOOK_SECRET or "").strip()
    if not secret:
        logger.warning("No Razorpay webhook secret set, skipping webhook verification")
        return True
    expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


async def handle_org_webhook(db: AsyncSession, body: bytes, signature: str) -> bool:
    """
    Handle Razorpay webhook events for org subscriptions: charged, pending, halted, cancelled, expired.
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
        select(OrgSubscription).where(OrgSubscription.razorpay_subscription_id == sub_id)
    )
    row = result.scalar_one_or_none()
    if not row:
        logger.warning("Webhook org subscription %s not found in DB", sub_id)
        return False

    now = datetime.now(timezone.utc)

    if event == "subscription.charged":
        payment = (
            payload.get("payload", {}).get("payment", {}).get("entity")
            or payload.get("payment")
            or {}
        )
        current_start = subscription.get("current_start")
        current_end = subscription.get("current_end")
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

    if event == "subscription.pending":
        row.status = "pending"
        row.updated_at = now
        await db.flush()
        return True

    if event == "subscription.halted":
        row.status = "halted"
        row.updated_at = now
        await db.flush()
        return True

    if event in ("subscription.cancelled", "subscription.expired"):
        row.status = "cancelled" if event == "subscription.cancelled" else "expired"
        row.updated_at = now
        await db.flush()
        return True

    return False


async def cancel_org_subscription(db: AsyncSession, org_id: UUID) -> bool:
    """Cancel the org's Razorpay subscription and mark as cancelled in DB."""
    result = await db.execute(
        select(OrgSubscription).where(OrgSubscription.organization_id == org_id)
    )
    row = result.scalar_one_or_none()
    if not row:
        return True
    if row.status not in ("active", "pending"):
        return True

    sub_id = row.razorpay_subscription_id
    now = datetime.now(timezone.utc)

    if not sub_id:
        row.status = "cancelled"
        row.updated_at = now
        await db.flush()
        logger.info("Cancelled manual-grant subscription for org %s", org_id)
        return True

    rp = _get_razorpay_client()
    if not rp:
        return False
    try:
        rp.subscription.cancel(sub_id)
        row.status = "cancelled"
        row.updated_at = now
        await db.flush()
        return True
    except Exception as e:
        logger.exception("Razorpay org subscription cancel failed: %s", e)
        return False


async def lock_org(db: AsyncSession, org_id: UUID) -> bool:
    """Set is_locked=True for the org's subscription. Creates row if missing."""
    result = await db.execute(
        select(OrgSubscription).where(OrgSubscription.organization_id == org_id)
    )
    row = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if row:
        row.is_locked = True
        row.updated_at = now
        await db.flush()
        return True
    row = OrgSubscription(
        organization_id=org_id,
        plan_type="starter",
        billing_interval="monthly",
        status="inactive",
        is_locked=True,
        updated_at=now,
    )
    db.add(row)
    await db.flush()
    return True


async def unlock_org(db: AsyncSession, org_id: UUID) -> bool:
    """Set is_locked=False for the org's subscription."""
    result = await db.execute(
        select(OrgSubscription).where(OrgSubscription.organization_id == org_id)
    )
    row = result.scalar_one_or_none()
    if not row:
        return True
    row.is_locked = False
    row.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return True


async def update_org_subscription_period(
    db: AsyncSession,
    org_id: UUID,
    *,
    current_period_end: datetime | None = None,
    current_period_start: datetime | None = None,
) -> bool:
    """
    Super Admin sets subscription period (expiry) for an org. Creates inactive row if none exists.
    """
    result = await db.execute(
        select(OrgSubscription).where(OrgSubscription.organization_id == org_id)
    )
    row = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if not row:
        row = OrgSubscription(
            organization_id=org_id,
            plan_type="starter",
            billing_interval="monthly",
            status="inactive",
            is_locked=False,
            current_period_start=current_period_start or now,
            current_period_end=current_period_end or now,
        )
        db.add(row)
    else:
        if current_period_end is not None:
            row.current_period_end = (
                current_period_end if current_period_end.tzinfo else current_period_end.replace(tzinfo=timezone.utc)
            )
        if current_period_start is not None:
            row.current_period_start = (
                current_period_start
                if current_period_start.tzinfo
                else current_period_start.replace(tzinfo=timezone.utc)
            )
        row.updated_at = now
    await db.flush()
    logger.info(
        "Updated subscription period for org %s: end=%s start=%s",
        org_id,
        row.current_period_end,
        row.current_period_start,
    )
    return True


async def grant_org_subscription(
    db: AsyncSession,
    org_id: UUID,
    plan_type: str,
    billing_interval: str,
    duration_days: int,
    period_end: datetime | None = None,
) -> bool:
    """
    Super Admin manually grants subscription (no Razorpay). Creates or updates OrgSubscription.
    If period_end is provided, use it as current_period_end; else use now + duration_days.
    """
    now = datetime.now(timezone.utc)
    if period_end is not None:
        period_end_utc = (
            period_end if period_end.tzinfo else period_end.replace(tzinfo=timezone.utc)
        )
    else:
        period_end_utc = now + timedelta(days=duration_days)
    result = await db.execute(
        select(OrgSubscription).where(OrgSubscription.organization_id == org_id)
    )
    row = result.scalar_one_or_none()
    if row:
        row.plan_type = plan_type
        row.billing_interval = billing_interval
        row.status = "active"
        row.is_locked = False
        row.razorpay_subscription_id = None
        row.razorpay_payment_id = None
        row.current_period_start = now
        row.current_period_end = period_end_utc
        row.updated_at = now
    else:
        row = OrgSubscription(
            organization_id=org_id,
            plan_type=plan_type,
            billing_interval=billing_interval,
            status="active",
            is_locked=False,
            current_period_start=now,
            current_period_end=period_end_utc,
        )
        db.add(row)
    await db.flush()
    logger.info(
        "Granted subscription for org %s: %s/%s until %s",
        org_id,
        plan_type,
        billing_interval,
        period_end_utc,
    )
    return True


async def list_orgs_with_subscription_status(db: AsyncSession) -> list[dict]:
    """
    List all organizations with their subscription status (for Super Admin).
    Returns list of dicts with org id, name, slug, billing_email and subscription fields.
    """
    result = await db.execute(
        select(Organization, OrgSubscription)
        .outerjoin(OrgSubscription, Organization.id == OrgSubscription.organization_id)
        .order_by(Organization.name)
    )
    rows = result.all()
    out = []
    for org, sub in rows:
        if not org:
            continue
        if sub is None:
            out.append({
                "id": str(org.id),
                "name": org.name,
                "slug": org.slug,
                "billing_email": org.billing_email,
                "plan_type": "starter",
                "billing_interval": "monthly",
                "status": "inactive",
                "is_locked": False,
                "amount": None,
                "current_period_start": None,
                "current_period_end": None,
                "razorpay_subscription_id": None,
            })
        else:
            status = sub.status or "inactive"
            end_dt = sub.current_period_end
            if status == "active" and end_dt and not sub.razorpay_subscription_id:
                now_utc = datetime.now(timezone.utc)
                end_utc = end_dt if end_dt.tzinfo else end_dt.replace(tzinfo=timezone.utc)
                if end_utc < now_utc:
                    status = "expired"
            amount_float = float(sub.amount) if sub.amount is not None else None
            out.append({
                "id": str(org.id),
                "name": org.name,
                "slug": org.slug,
                "billing_email": org.billing_email,
                "plan_type": sub.plan_type or "starter",
                "billing_interval": sub.billing_interval or "monthly",
                "status": status,
                "is_locked": sub.is_locked or False,
                "amount": amount_float,
                "current_period_start": sub.current_period_start,
                "current_period_end": sub.current_period_end,
                "razorpay_subscription_id": sub.razorpay_subscription_id,
            })
    return out


async def revoke_org_subscription(db: AsyncSession, org_id: UUID) -> bool:
    """Super Admin revokes subscription (set status inactive, clear period)."""
    result = await db.execute(
        select(OrgSubscription).where(OrgSubscription.organization_id == org_id)
    )
    row = result.scalar_one_or_none()
    if not row:
        return True
    now = datetime.now(timezone.utc)
    row.status = "inactive"
    row.current_period_start = None
    row.current_period_end = None
    row.updated_at = now
    await db.flush()
    return True
