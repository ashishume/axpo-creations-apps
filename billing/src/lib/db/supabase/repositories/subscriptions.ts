import { supabase } from "../client";
import type { SubscriptionRepository, SubscriptionPlan, UserSubscription, BillingInterval } from "../../repository";

// Default plans (will be synced to database)
const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: [
      "Up to 50 invoices/month",
      "Up to 10 products",
      "Up to 20 customers",
      "Basic reports",
    ],
    limits: {
      invoicesPerMonth: 50,
      productsLimit: 10,
      customersLimit: 20,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "pro",
    name: "Pro",
    price: 999,
    billingInterval: "monthly",
    features: [
      "Unlimited invoices",
      "Unlimited products",
      "Unlimited customers",
      "All reports",
      "Priority support",
      "Data export",
    ],
    limits: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 2999,
    billingInterval: "quarterly",
    features: [
      "Everything in Pro",
      "Multi-user access",
      "Custom branding",
      "API access",
      "Dedicated support",
      "Custom integrations",
    ],
    limits: {},
    createdAt: new Date().toISOString(),
  },
];

export const subscriptionRepository: SubscriptionRepository = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price", { ascending: true });

      if (error || !data || data.length === 0) {
        // Return default plans if DB not set up
        return DEFAULT_PLANS;
      }

      return data.map(mapPlanFromDb);
    } catch {
      return DEFAULT_PLANS;
    }
  },

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (error || !data) return null;
      const sub = mapSubscriptionFromDb(data);
      if (new Date(sub.endsAt) < new Date()) return null;
      return sub;
    } catch {
      return null;
    }
  },

  async subscribe(userId: string, planId: string): Promise<UserSubscription> {
    const plans = await this.getPlans();
    const plan = plans.find((p) => p.id === planId);
    const interval: BillingInterval = plan?.billingInterval ?? "monthly";
    const now = new Date();
    const endsAt = new Date(now);
    if (interval === "quarterly") {
      endsAt.setMonth(endsAt.getMonth() + 3);
    } else {
      endsAt.setMonth(endsAt.getMonth() + 1);
    }

    const { data, error } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        plan_id: planId,
        status: "active",
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapSubscriptionFromDb(data);
  },

  async cancel(subscriptionId: string): Promise<void> {
    const { error } = await supabase
      .from("user_subscriptions")
      .update({ status: "cancelled" })
      .eq("id", subscriptionId);

    if (error) throw new Error(error.message);
  },
};

function mapPlanFromDb(data: Record<string, unknown>): SubscriptionPlan {
  const interval = data.billing_interval as string | undefined;
  return {
    id: data.id as string,
    name: data.name as string,
    price: data.price as number,
    billingInterval: interval === "quarterly" ? "quarterly" : interval === "monthly" ? "monthly" : undefined,
    features: (data.features as string[]) || [],
    limits: (data.limits as SubscriptionPlan["limits"]) || {},
    createdAt: data.created_at as string,
  };
}

function mapSubscriptionFromDb(data: Record<string, unknown>): UserSubscription {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    planId: data.plan_id as string,
    status: data.status as UserSubscription["status"],
    startsAt: data.starts_at as string,
    endsAt: data.ends_at as string,
    createdAt: data.created_at as string,
  };
}
