/**
 * Subscription (Razorpay premium) API client for Teaching backend.
 */
import { teachingFetchJson } from "../../api/client";

export interface SubscriptionStatusDto {
  plan_type: string;
  status: string;
  amount?: number | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  razorpay_subscription_id?: string | null;
  platform?: string | null;
}

export interface CreateSubscriptionResponseDto {
  subscription_id: string;
  key_id: string;
}

export interface SubscriptionStatus {
  planType: string;
  status: string;
  amount?: number | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  razorpaySubscriptionId?: string | null;
  platform?: string | null;
}

function mapStatus(dto: SubscriptionStatusDto): SubscriptionStatus {
  return {
    planType: dto.plan_type ?? "free",
    status: dto.status ?? "inactive",
    amount: dto.amount,
    currentPeriodStart: dto.current_period_start,
    currentPeriodEnd: dto.current_period_end,
    razorpaySubscriptionId: dto.razorpay_subscription_id,
    platform: dto.platform,
  };
}

export const subscriptionApi = {
  async getStatus(): Promise<SubscriptionStatus> {
    const dto = await teachingFetchJson<SubscriptionStatusDto>("/subscription/status");
    return mapStatus(dto);
  },

  async create(platform: string = "default"): Promise<{ subscriptionId: string; keyId: string }> {
    const url = `/subscription/create${platform !== "default" ? `?platform=${encodeURIComponent(platform)}` : ""}`;
    const dto = await teachingFetchJson<CreateSubscriptionResponseDto>(url, {
      method: "POST",
      body: "{}",
    });
    return {
      subscriptionId: dto.subscription_id,
      keyId: dto.key_id,
    };
  },

  async verify(payload: {
    razorpayPaymentId: string;
    razorpaySubscriptionId: string;
    razorpaySignature: string;
    platform?: string;
  }): Promise<{ success: boolean; plan_type: string }> {
    return teachingFetchJson("/subscription/verify", {
      method: "POST",
      body: JSON.stringify({
        razorpay_payment_id: payload.razorpayPaymentId,
        razorpay_subscription_id: payload.razorpaySubscriptionId,
        razorpay_signature: payload.razorpaySignature,
        platform: payload.platform ?? "default",
      }),
    });
  },

  async cancel(): Promise<{ success: boolean }> {
    return teachingFetchJson("/subscription/cancel", { method: "POST", body: JSON.stringify({}) });
  },

  async redeemCoupon(code: string): Promise<{ success: boolean; plan_type: string; message?: string }> {
    return teachingFetchJson("/subscription/redeem-coupon", {
      method: "POST",
      body: JSON.stringify({ code: code.trim() }),
    });
  },
};
