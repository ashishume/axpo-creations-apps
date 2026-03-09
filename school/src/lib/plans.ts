import type { SubscriptionPlanInfo } from "../types";

// Annual plan disabled for now; uncomment "annual" to enable.
export const BILLING_INTERVALS = ["monthly", "quarterly" /* , "annual" */] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const SUBSCRIPTION_PLANS: SubscriptionPlanInfo[] = [
  {
    id: "starter",
    name: "Starter",
    price: 2000,
    pricing: { monthly: 2000, quarterly: 5500 /* , annual: 19200 */ },
    features: [
      "Dashboard & reports",
      "Students & fees",
      "Staff & salary",
      "Expenses & stocks",
      "Year-end report",
      "Up to 2 users",
    ],
  },
  {
    id: "premium",
    name: "Axpo Assistant",
    price: 2500,
    pricing: { monthly: 2500, quarterly: 6900 /* , annual: 24000 */ },
    features: [
      "Everything in Starter",
      "Axpo Assistant (AI chat)",
      "Natural language CRUD",
      "Session-scoped chat history",
      "AI powered",
      "Priority support",
    ],
  },
];

export const PLAN_IDS = SUBSCRIPTION_PLANS.map((p) => p.id) as readonly string[];

/** Whether the plan includes the Axpo Assistant premium feature. */
export function planIncludesAssistant(planId: string): boolean {
  return planId === "premium" || planId === "ai_assistant";
}

/** Get price for a plan and billing interval. */
export function getPlanPrice(planId: string, interval: BillingInterval): number {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  if (!plan) return 0;
  const pricing = (plan as SubscriptionPlanInfo & { pricing?: Record<BillingInterval, number> }).pricing;
  return pricing?.[interval] ?? plan.price;
}
