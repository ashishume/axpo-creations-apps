/**
 * Super Admin org subscription management API.
 */
import { teachingFetchJson } from "../../api/client";

export interface OrgWithSubscriptionDto {
  id: string;
  name: string;
  slug?: string | null;
  billing_email?: string | null;
  plan_type: string;
  billing_interval: string;
  status: string;
  is_locked: boolean;
  amount?: number | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  razorpay_subscription_id?: string | null;
}

export interface OrgWithSubscription {
  id: string;
  name: string;
  slug?: string | null;
  billingEmail?: string | null;
  planType: string;
  billingInterval: string;
  status: string;
  isLocked: boolean;
  amount?: number | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  razorpaySubscriptionId?: string | null;
}

function mapItem(dto: OrgWithSubscriptionDto): OrgWithSubscription {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    billingEmail: dto.billing_email,
    planType: dto.plan_type,
    billingInterval: dto.billing_interval,
    status: dto.status,
    isLocked: dto.is_locked,
    amount: dto.amount,
    currentPeriodStart: dto.current_period_start,
    currentPeriodEnd: dto.current_period_end,
    razorpaySubscriptionId: dto.razorpay_subscription_id,
  };
}

export const adminSubscriptionsApi = {
  async list(): Promise<OrgWithSubscription[]> {
    const list = await teachingFetchJson<OrgWithSubscriptionDto[]>("/admin/subscriptions");
    return list.map(mapItem);
  },

  async get(orgId: string): Promise<OrgWithSubscription> {
    const dto = await teachingFetchJson<OrgWithSubscriptionDto>(`/admin/subscriptions/${orgId}`);
    return mapItem(dto);
  },

  async lock(orgId: string): Promise<void> {
    await teachingFetchJson(`/admin/subscriptions/${orgId}/lock`, { method: "POST", body: "{}" });
  },

  async unlock(orgId: string): Promise<void> {
    await teachingFetchJson(`/admin/subscriptions/${orgId}/unlock`, { method: "POST", body: "{}" });
  },

  async grant(
    orgId: string,
    planType: string,
    billingInterval: string,
    durationDays: number,
    periodEnd?: string | null
  ): Promise<void> {
    const body: Record<string, unknown> = {
      plan_type: planType,
      billing_interval: billingInterval,
      duration_days: durationDays,
    };
    if (periodEnd) body.period_end = periodEnd;
    await teachingFetchJson(`/admin/subscriptions/${orgId}/grant`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async updatePeriod(
    orgId: string,
    params: { currentPeriodEnd?: string | null; currentPeriodStart?: string | null }
  ): Promise<void> {
    const body: Record<string, string> = {};
    if (params.currentPeriodEnd != null) body.current_period_end = params.currentPeriodEnd;
    if (params.currentPeriodStart != null) body.current_period_start = params.currentPeriodStart;
    if (Object.keys(body).length === 0) return;
    await teachingFetchJson(`/admin/subscriptions/${orgId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  async revoke(orgId: string): Promise<void> {
    await teachingFetchJson(`/admin/subscriptions/${orgId}/revoke`, { method: "POST", body: "{}" });
  },
};
