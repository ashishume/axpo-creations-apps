/**
 * Org-level subscription API client for Teaching backend.
 */
import { teachingFetchJson } from "../../api/client";

export interface OrgSubscriptionStatusDto {
  plan_type: string;
  billing_interval: string;
  status: string;
  is_locked: boolean;
  amount?: number | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  razorpay_subscription_id?: string | null;
}

export interface OrgSubscriptionStatus {
  planType: string;
  billingInterval: string;
  status: string;
  isLocked: boolean;
  amount?: number | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  razorpaySubscriptionId?: string | null;
}

function mapOrgStatus(dto: OrgSubscriptionStatusDto): OrgSubscriptionStatus {
  return {
    planType: dto.plan_type ?? "starter",
    billingInterval: dto.billing_interval ?? "monthly",
    status: dto.status ?? "inactive",
    isLocked: dto.is_locked ?? false,
    amount: dto.amount,
    currentPeriodStart: dto.current_period_start,
    currentPeriodEnd: dto.current_period_end,
    razorpaySubscriptionId: dto.razorpay_subscription_id,
  };
}

export const orgSubscriptionApi = {
  async getStatus(): Promise<OrgSubscriptionStatus> {
    const dto = await teachingFetchJson<OrgSubscriptionStatusDto>("/org-subscription/status");
    return mapOrgStatus(dto);
  },

  async create(planType: string, billingInterval: string): Promise<{ subscriptionId: string; keyId: string }> {
    const dto = await teachingFetchJson<{ subscription_id: string; key_id: string }>(
      "/org-subscription/create",
      {
        method: "POST",
        body: JSON.stringify({
          plan_type: planType,
          billing_interval: billingInterval,
        }),
      }
    );
    return {
      subscriptionId: dto.subscription_id,
      keyId: dto.key_id,
    };
  },

  async verify(payload: {
    razorpayPaymentId: string;
    razorpaySubscriptionId: string;
    razorpaySignature: string;
  }): Promise<{ success: boolean }> {
    return teachingFetchJson("/org-subscription/verify", {
      method: "POST",
      body: JSON.stringify({
        razorpay_payment_id: payload.razorpayPaymentId,
        razorpay_subscription_id: payload.razorpaySubscriptionId,
        razorpay_signature: payload.razorpaySignature,
      }),
    });
  },

  async cancel(): Promise<{ success: boolean }> {
    return teachingFetchJson("/org-subscription/cancel", { method: "POST", body: "{}" });
  },
};
