
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { subscriptionRepository } from "@/lib/db";

export function SubscriptionPage() {
  const { user } = useAuth();
  const {
    subscription: currentSubscription,
    plans,
    loading,
    disabledUntilRenewal,
    effectivePlanId,
    refetchSubscription,
  } = useSubscription();
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (!user) return;

    setSubscribing(planId);
    try {
      await subscriptionRepository.subscribe(user.id, planId);
      await refetchSubscription();
    } catch (error) {
      console.error("Failed to subscribe:", error);
      alert("Failed to subscribe. Please try again.");
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    if (!currentSubscription) return;

    if (!confirm("Are you sure you want to cancel your subscription?")) return;

    try {
      await subscriptionRepository.cancel(currentSubscription.id);
      await refetchSubscription();
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      alert("Failed to cancel subscription. Please try again.");
    }
  };

  const currentPlanId = effectivePlanId;

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
          Subscription Plans
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-96 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Subscription Plans
          </h1>
          <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
            Choose a plan that fits your business needs
          </p>
        </div>
        <Link to="/" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      {(currentSubscription || disabledUntilRenewal) && (
        <div
          className="card mb-8 p-4 flex items-center justify-between"
          style={{
            borderColor: disabledUntilRenewal ? "var(--warning-text)" : "var(--success)",
            borderWidth: 2,
          }}
        >
          <div>
            {disabledUntilRenewal ? (
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                <span style={{ color: "var(--warning-text)" }}>Plan disabled until renewal</span>
                <span className="block text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  Your subscription could not be validated or has expired. Please renew to restore access.
                </span>
              </p>
            ) : (
              <>
                <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                  Current Plan: <span style={{ color: "var(--success)" }}>{plans.find((p) => p.id === currentPlanId)?.name || "Free"}</span>
                </p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Valid until: {currentSubscription ? new Date(currentSubscription.endsAt).toLocaleDateString() : "—"}
                </p>
              </>
            )}
          </div>
          {currentSubscription && currentPlanId !== "free" && !disabledUntilRenewal && (
            <button onClick={handleCancel} className="btn btn-secondary text-sm">
              Cancel Subscription
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const isPopular = plan.id === "pro";

          return (
            <div
              key={plan.id}
              className={`card relative transition-all duration-300 hover:shadow-lg ${isPopular ? "ring-2" : ""}`}
              style={{
                borderColor: isPopular ? "var(--btn-primary-bg)" : undefined,
              }}
            >
              {isPopular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}
                >
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {plan.name}
                </h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {plan.price === 0 ? "Free" : `₹${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      /month
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span style={{ color: "var(--success)" }}>✓</span>
                    <span style={{ color: "var(--text-primary)" }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrentPlan || subscribing === plan.id}
                className={`btn w-full ${isCurrentPlan ? "btn-secondary" : "btn-primary"}`}
              >
                {subscribing === plan.id ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : isCurrentPlan ? (
                  "Current Plan"
                ) : (
                  `Choose ${plan.name}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center" style={{ color: "var(--text-secondary)" }}>
        <p className="text-sm">
          All plans include GST. Prices are in Indian Rupees (INR).
        </p>
        <p className="text-sm mt-1">
          Need help? Contact us at support@billing.local
        </p>
      </div>
    </div>
  );
}
