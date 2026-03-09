import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../providers/SubscriptionProvider";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { SUBSCRIPTION_PLANS } from "../lib/plans";
import { subscriptionApi } from "../lib/db/api/subscription";
import { isTeachingApiConfigured } from "../lib/api/client";
import type { PlanId } from "../types";
import { DEFAULT_ROLE_IDS } from "../types/auth";
import { CreditCard, Check, Crown, X } from "lucide-react";

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

export function SubscriptionPage() {
  const { schools, selectedSchoolId, updateSchool, toast } = useApp();
  const { user, hasPermission } = useAuth();
  const { isPremium, status, planType, refetch } = useSubscription();
  const [subscribing, setSubscribing] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const isSuperAdmin = user?.roleId === DEFAULT_ROLE_IDS.SUPER_ADMIN;
  const canManagePlans = hasPermission("plans:manage") || isSuperAdmin;
  const showRazorpay = isTeachingApiConfigured();

  const selectedSchool = selectedSchoolId
    ? schools.find((s) => s.id === selectedSchoolId)
    : null;
  const currentPlanId: PlanId = selectedSchool?.planId ?? "starter";

  const handleChangePlan = async (planId: PlanId) => {
    if (!selectedSchoolId || currentPlanId === planId) return;
    try {
      await updateSchool(selectedSchoolId, { planId });
      toast(`Plan updated to ${SUBSCRIPTION_PLANS.find((p) => p.id === planId)?.name ?? planId}`);
    } catch (e) {
      toast(String(e), "error");
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;
    setSubscribing(true);
    try {
      const result = await subscriptionApi.create("web");
      await loadRazorpay();
      if (!window.Razorpay) {
        toast("Payment provider could not be loaded.", "error");
        return;
      }
      const rzp = new window.Razorpay({
        key: result.keyId,
        subscription_id: result.subscriptionId,
        name: "Axpo School",
        description: "Premium subscription",
        prefill: { name: user.name ?? undefined, email: user.email ?? undefined },
        handler: async (res) => {
          try {
            await subscriptionApi.verify({
              razorpayPaymentId: res.razorpay_payment_id,
              razorpaySubscriptionId: res.razorpay_subscription_id,
              razorpaySignature: res.razorpay_signature,
              platform: "web",
            });
            toast("Premium activated!", "success");
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
      setSubscribing(false);
    }
  };

  const handleRedeemCoupon = async () => {
    const code = coupon.trim();
    if (!code) return;
    setRedeeming(true);
    try {
      await subscriptionApi.redeemCoupon(code);
      toast("Coupon applied. You now have Premium.", "success");
      setCoupon("");
      refetch();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Invalid or expired coupon", "error");
    } finally {
      setRedeeming(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel your Premium subscription?")) return;
    try {
      await subscriptionApi.cancel();
      toast("Subscription cancelled.", "success");
      refetch();
    } catch {
      toast("Failed to cancel", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Subscription & Plan</h2>
        <p className="text-slate-600">
          View and manage the subscription plan for this school.
        </p>
      </div>

      {!selectedSchool ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-slate-600">
              Select a school from the header dropdown to see and manage its plan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-indigo-200 bg-indigo-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                Current school & plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-slate-900">{selectedSchool.name}</p>
              <p className="mt-1 text-sm text-slate-600">
                Active plan:{" "}
                <span className="font-semibold text-indigo-700">
                  {SUBSCRIPTION_PLANS.find((p) => p.id === currentPlanId)?.name ?? "Free"}
                </span>
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              return (
                <Card
                  key={plan.id}
                  className={`relative transition-shadow ${isCurrent ? "ring-2 ring-indigo-500 shadow-md" : ""
                    }`}
                >
                  {isCurrent && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                      <Check className="h-3 w-3" /> Current
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <p className="text-2xl font-bold text-slate-900">
                      {plan.price === 0 ? "Free" : `₹${plan.price}`}
                      {plan.price > 0 && (
                        <span className="text-sm font-normal text-slate-500">/month</span>
                      )}
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
                    {canManagePlans && (
                      <Button
                        size="sm"
                        variant={isCurrent ? "secondary" : "primary"}
                        className="mt-2 w-full"
                        onClick={() => handleChangePlan(plan.id)}
                        disabled={isCurrent}
                      >
                        {isCurrent ? "Current plan" : `Set as ${plan.name}`}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {canManagePlans && (
            <p className="text-sm text-slate-500">
              As Super Admin, you can change the plan for the selected school above. Other users can only view the current plan.
            </p>
          )}

          {showRazorpay && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="h-5 w-5 text-amber-600" />
                  Premium (Razorpay)
                </CardTitle>
                {isPremium ? (
                  <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    <Check className="h-4 w-4" /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    <X className="h-4 w-4" /> {planType ?? "Free"}
                  </span>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Plan: {planType ?? "free"} · Status: {status ?? "—"}
                </p>
                {!isPremium && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleSubscribe}
                      disabled={subscribing}
                      className="gap-2"
                    >
                      <Crown className="h-4 w-4" />
                      {subscribing ? "Opening checkout…" : "Subscribe with Razorpay"}
                    </Button>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Coupon code"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        disabled={redeeming}
                        className="max-w-[200px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleRedeemCoupon}
                        disabled={!coupon.trim() || redeeming}
                      >
                        {redeeming ? "Redeeming…" : "Redeem"}
                      </Button>
                    </div>
                  </>
                )}
                {isPremium && (
                  <Button size="sm" variant="secondary" onClick={handleCancel}>
                    Cancel subscription
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
