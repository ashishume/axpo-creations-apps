import { useLocation, useNavigate } from "react-router-dom";
import { useSubscription } from "../providers/SubscriptionProvider";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";
import { SUBSCRIPTION_PLANS } from "../lib/plans";
import { AlertCircle, Lock, CreditCard } from "lucide-react";

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SubscriptionExpiredOverlay() {
  const { isActive, isLocked, isLoading } = useSubscription();
  const { hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading || isActive) return null;
  if (location.pathname.replace(/^\//, "").startsWith("subscription")) return null;

  const canManagePlans = hasPermission("plans:manage");
  const message = isLocked
    ? "Your organization has been suspended. Please contact support."
    : "Your organization's subscription has expired or is inactive.";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-sm"
      role="alert"
      aria-live="assertive"
    >
      <div className="mx-4 max-w-md rounded-xl border border-slate-700 dark:border-slate-600 bg-white dark:bg-slate-900 p-8 shadow-xl">
        <div className="flex flex-col items-center gap-4 text-center">
          {isLocked ? (
            <Lock className="h-14 w-14 text-amber-500 dark:text-amber-400" aria-hidden />
          ) : (
            <AlertCircle className="h-14 w-14 text-amber-500 dark:text-amber-400" aria-hidden />
          )}
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            {isLocked ? "Organization suspended" : "Subscription required"}
          </h2>
          <p className="text-slate-600 dark:text-slate-300">{message}</p>

          {!isLocked && (
            <div className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-4 text-left">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <CreditCard className="h-4 w-4" />
                Payment details
              </p>
              <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const monthly = plan.pricing?.monthly ?? plan.price;
                  return (
                    <li key={plan.id} className="flex justify-between gap-2">
                      <span>{plan.name}</span>
                      <span className="font-medium tabular-nums text-slate-800 dark:text-slate-100">
                        {formatPrice(monthly)}/month
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Payment via Razorpay (card, UPI, net banking)
              </p>
            </div>
          )}

          {canManagePlans ? (
            <Button
              variant="primary"
              onClick={() => navigate("/subscription")}
            >
              Payment
            </Button>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Contact your administrator to renew or activate your organization's subscription.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
