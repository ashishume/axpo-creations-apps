import type {
  SubscriptionRepository,
  SubscriptionPlan,
  UserSubscription,
} from "../../repository";

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
    limits: { invoicesPerMonth: 50, productsLimit: 10, customersLimit: 20 },
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

export const subscriptionRepositoryApi: SubscriptionRepository = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    return DEFAULT_PLANS;
  },

  async getUserSubscription(_userId: string): Promise<UserSubscription | null> {
    return null;
  },

  async subscribe(_userId: string, _planId: string): Promise<UserSubscription> {
    throw new Error("Subscription not implemented via API yet");
  },

  async cancel(_subscriptionId: string): Promise<void> {
    // no-op
  },
};
