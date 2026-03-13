import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useSubscription } from "../providers/SubscriptionProvider";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import {
  SUBSCRIPTION_PLANS,
  BILLING_INTERVALS,
  getPlanPrice,
  type BillingInterval,
} from "../lib/plans";
import { orgSubscriptionApi } from "../lib/db/api/orgSubscription";
import { isTeachingApiConfigured } from "../lib/api/client";
import { DEFAULT_ROLE_IDS } from "../types/auth";
import { CreditCard, Check, Crown, Settings, Loader2 } from "lucide-react";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      subscription_id: string;
      name?: string;
      description?: string;
      prefill?: { name?: string; email?: string; contact?: string };
      handler: (res: {
        razorpay_payment_id: string;
        razorpay_subscription_id: string;
        razorpay_signature: string;
      }) => void;
    }) => { open: () => void };
  }
}

function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return s;
  }
}

export function SubscriptionPage() {
  const navigate = useNavigate();
  const { toast } = useApp();
  const { user, hasPermission } = useAuth();
  const {
    isActive,
    status,
    planType,
    billingInterval,
    currentPeriodEnd,
    refetch,
  } = useSubscription();
  const [billingIntervalChoice, setBillingIntervalChoice] = useState<BillingInterval>("monthly");
  /** Plan id currently in checkout flow; only that button shows loading. */
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const isSuperAdmin = user?.roleId === DEFAULT_ROLE_IDS.SUPER_ADMIN;
  const canManagePlans = hasPermission("plans:manage") || isSuperAdmin;
  const showRazorpay = isTeachingApiConfigured();

  const handleSubscribe = async (planId: string, interval: BillingInterval) => {
    if (!user) return;
    setSubscribingPlanId(planId);
    try {
      const result = await orgSubscriptionApi.create(planId, interval);
      await loadRazorpay();
      if (!window.Razorpay) {
        return;
      }
      const rzp = new window.Razorpay({
        key: result.keyId,
        subscription_id: result.subscriptionId,
        name: "Axpo School",
        description: `Subscription (${planId}, ${interval})`,
        prefill: { name: user.name ?? undefined, email: user.email ?? undefined },
        handler: async (res) => {
          try {
            await orgSubscriptionApi.verify({
              razorpayPaymentId: res.razorpay_payment_id,
              razorpaySubscriptionId: res.razorpay_subscription_id,
              razorpaySignature: res.razorpay_signature,
            });
            toast("Subscription activated!", "success");
            refetch();
          } catch {
            toast("Verification failed. Contact support if charged.", "error");
          }
        },
      });
      rzp.open();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not start checkout", "error");
    } finally {
      setSubscribingPlanId(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel your organization's subscription?")) return;
    try {
      await orgSubscriptionApi.cancel();
      toast("Subscription cancelled.", "success");
      refetch();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to cancel", "error");
    }
  };

  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Subscription & Plans</h2>
          <p className="text-slate-600">
            As Super Admin, manage all organizations and their subscriptions from the admin panel.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="primary"
              onClick={() => navigate("/org-subscriptions")}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Manage org subscriptions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Organization subscription</h2>
        <p className="text-slate-600">
          View and manage your organization's subscription plan.
        </p>
      </div>

      <Card className="border-indigo-200 bg-indigo-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-indigo-600" />
            Current subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-medium text-slate-900">
            Plan: {SUBSCRIPTION_PLANS.find((p) => p.id === planType)?.name ?? planType}
            {billingInterval && ` · ${billingInterval}`}
          </p>
          <p className="text-sm text-slate-600">
            Status: <span className="font-medium">{status ?? "inactive"}</span>
            {currentPeriodEnd && isActive && (
              <> · Renews: {formatDate(currentPeriodEnd)}</>
            )}
          </p>
        </CardContent>
      </Card>

      {showRazorpay && canManagePlans && (
        <>
          <div className="flex flex-wrap gap-2">
            {BILLING_INTERVALS.map((interval) => (
              <Button
                key={interval}
                size="sm"
                variant={billingIntervalChoice === interval ? "primary" : "secondary"}
                onClick={() => setBillingIntervalChoice(interval)}
              >
                {interval.charAt(0).toUpperCase() + interval.slice(1)}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const price = getPlanPrice(plan.id, billingIntervalChoice);
              const isCurrent =
                planType === plan.id && billingInterval === billingIntervalChoice && isActive;
              return (
                <Card
                  key={plan.id}
                  className={`relative transition-shadow ${
                    isCurrent ? "ring-2 ring-indigo-500 shadow-md" : ""
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                      <Check className="h-3 w-3" /> Current
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      ₹{price}
                      <span className="text-sm font-normal text-slate-500">
                        /{billingIntervalChoice === "monthly" ? "month" : billingIntervalChoice === "quarterly" ? "3 months" : "year"}
                      </span>
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-1.5 text-sm text-slate-600">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {!isCurrent && (
                      <Button
                        size="sm"
                        className="mt-2 w-full gap-2"
                        onClick={() => handleSubscribe(plan.id, billingIntervalChoice)}
                        disabled={subscribingPlanId !== null}
                      >
                        {subscribingPlanId === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Crown className="h-4 w-4" />
                        )}
                        {subscribingPlanId === plan.id ? "Opening checkout…" : `Subscribe ${plan.name}`}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {isActive && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardContent className="pt-6">
                <Button size="sm" variant="secondary" onClick={handleCancel}>
                  Cancel subscription
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!showRazorpay && canManagePlans && (
        <p className="text-sm text-slate-500">
          Payment is not configured. Contact your administrator to activate your organization's subscription.
        </p>
      )}
    </div>
  );
}
