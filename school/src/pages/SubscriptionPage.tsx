import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { SUBSCRIPTION_PLANS } from "../lib/plans";
import type { PlanId } from "../types";
import { DEFAULT_ROLE_IDS } from "../types/auth";
import { CreditCard, Check } from "lucide-react";

export function SubscriptionPage() {
  const { schools, selectedSchoolId, updateSchool, toast } = useApp();
  const { user, hasPermission } = useAuth();
  const isSuperAdmin = user?.roleId === DEFAULT_ROLE_IDS.SUPER_ADMIN;
  const canManagePlans = hasPermission("plans:manage") || isSuperAdmin;

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
        </>
      )}
    </div>
  );
}
