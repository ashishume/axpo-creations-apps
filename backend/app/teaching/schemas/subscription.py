"""Subscription (premium plan) request/response schemas for Teaching domain."""
from datetime import datetime

from pydantic import BaseModel, Field


class CreateSubscriptionResponse(BaseModel):
    """Response after creating a Razorpay subscription for checkout."""

    subscription_id: str = Field(..., description="Razorpay subscription ID for checkout")
    key_id: str = Field(..., description="Razorpay key_id for client checkout")


class VerifyPaymentRequest(BaseModel):
    """Request body for verifying payment after Razorpay checkout."""

    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str
    platform: str | None = Field(
        None,
        description="'apple' for iOS subscription; omit or 'default' for default Razorpay",
    )


class RedeemCouponRequest(BaseModel):
    """Request body for redeeming a Premium coupon."""

    code: str = Field(..., min_length=1, description="Coupon code to redeem")


class SubscriptionStatus(BaseModel):
    """Current subscription status for the user."""

    plan_type: str = Field(..., description="free | premium")
    status: str = Field(
        ...,
        description="active | inactive | cancelled | expired | pending",
    )
    amount: float | None = None
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    razorpay_subscription_id: str | None = None
    platform: str | None = Field(
        None,
        description="'razorpay' | 'apple' | None (coupon/free)",
    )


# --- Org-level subscription schemas ---


class OrgSubscriptionStatus(BaseModel):
    """Current org subscription status."""

    plan_type: str = Field(..., description="starter | premium")
    billing_interval: str = Field(..., description="monthly | quarterly | annual")
    status: str = Field(
        ...,
        description="active | inactive | cancelled | expired | pending | halted",
    )
    is_locked: bool = Field(False, description="Manually locked by Super Admin")
    amount: float | None = None
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    razorpay_subscription_id: str | None = None


class VerifyOrgPaymentRequest(BaseModel):
    """Request body for verifying org payment after Razorpay checkout."""

    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str


class CreateOrgSubscriptionRequest(BaseModel):
    """Request to create org subscription (plan + interval for checkout)."""

    plan_type: str = Field(..., description="starter | premium")
    billing_interval: str = Field(..., description="monthly | quarterly | annual")


class GrantOrgSubscriptionRequest(BaseModel):
    """Super Admin request to manually grant subscription."""

    plan_type: str = Field(..., description="starter | premium")
    billing_interval: str = Field(..., description="monthly | quarterly | annual")
    duration_days: int = Field(..., ge=1, le=3650, description="Days of access")
