import { useLocation, useNavigate } from "react-router-dom";
import { useSubscription } from "../providers/SubscriptionProvider";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";
import { AlertCircle, Lock } from "lucide-react";

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm"
      role="alert"
      aria-live="assertive"
    >
      <div className="mx-4 max-w-md rounded-xl border border-slate-700 bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center gap-4 text-center">
          {isLocked ? (
            <Lock className="h-14 w-14 text-amber-500" aria-hidden />
          ) : (
            <AlertCircle className="h-14 w-14 text-amber-500" aria-hidden />
          )}
          <h2 className="text-xl font-semibold text-slate-900">
            {isLocked ? "Organization suspended" : "Subscription required"}
          </h2>
          <p className="text-slate-600">{message}</p>
          {canManagePlans ? (
            <Button
              variant="primary"
              onClick={() => navigate("/subscription")}
            >
              Renew subscription
            </Button>
          ) : (
            <p className="text-sm text-slate-500">
              Contact your administrator to renew or activate your organization's subscription.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
