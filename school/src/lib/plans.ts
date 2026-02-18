import type { SubscriptionPlanInfo } from "../types";

export const SUBSCRIPTION_PLANS: SubscriptionPlanInfo[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
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
    id: "ai_assistant",
    name: "Axpo Assistant",
    price: 999,
    features: [
      "Everything in Starter",
      "Axpo Assistant (AI chat)",
      "Natural language CRUD",
      "Session-scoped chat history",
      "OpenAI or Gemini powered",
      "Priority support",
    ],
  },
];

export const PLAN_IDS = SUBSCRIPTION_PLANS.map((p) => p.id) as readonly string[];

/** Whether the plan includes the Axpo Assistant premium feature. */
export function planIncludesAssistant(planId: string): boolean {
  return planId === "ai_assistant";
}
