import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { SkeletonList } from "../components/ui/Skeleton";
import { adminSubscriptionsApi, type OrgWithSubscription } from "../lib/db/api/adminSubscriptions";
import { SUBSCRIPTION_PLANS, BILLING_INTERVALS, type BillingInterval } from "../lib/plans";
import { useAuth } from "../context/AuthContext";
import { isTeachingApiConfigured } from "../lib/api/client";
import { Lock, Unlock, Gift, RotateCcw, Building2 } from "lucide-react";

const QUERY_KEY_ADMIN_ORG_SUBS = "adminOrgSubscriptions";

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

function StatusBadge({ status, isLocked }: { status: string; isLocked: boolean }) {
  if (isLocked) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-800">
        Locked
      </span>
    );
  }
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    pending: "bg-amber-100 text-amber-800",
    halted: "bg-red-100 text-red-800",
    cancelled: "bg-slate-100 text-slate-600",
    expired: "bg-slate-100 text-slate-600",
    inactive: "bg-slate-100 text-slate-500",
  };
  const className = styles[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {status}
    </span>
  );
}

export function OrgSubscriptionsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [grantModal, setGrantModal] = useState<{ org: OrgWithSubscription } | null>(null);
  const [grantPlan, setGrantPlan] = useState<string>("starter");
  const [grantInterval, setGrantInterval] = useState<BillingInterval>("monthly");
  const [grantDays, setGrantDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  const { data: list = [], isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEY_ADMIN_ORG_SUBS],
    queryFn: () => adminSubscriptionsApi.list(),
    enabled: isTeachingApiConfigured(),
    staleTime: 60 * 1000,
  });

  const canManage = hasPermission("schools:create");

  const handleLock = async (orgId: string) => {
    setSubmitting(true);
    try {
      await adminSubscriptionsApi.lock(orgId);
      await refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlock = async (orgId: string) => {
    setSubmitting(true);
    try {
      await adminSubscriptionsApi.unlock(orgId);
      await refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrant = async () => {
    if (!grantModal) return;
    setSubmitting(true);
    try {
      await adminSubscriptionsApi.grant(
        grantModal.org.id,
        grantPlan,
        grantInterval,
        grantDays
      );
      setGrantModal(null);
      await refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (orgId: string) => {
    if (!window.confirm("Revoke this organization's subscription? They will lose access.")) return;
    setSubmitting(true);
    try {
      await adminSubscriptionsApi.revoke(orgId);
      await refetch();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Org subscriptions</h2>
        <p className="text-slate-600">
          View all organizations and their subscription status. Lock, unlock, grant, or revoke access.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Organizations</CardTitle>
          <Button size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonList items={5} />
          ) : list.length === 0 ? (
            <p className="text-sm text-slate-500">No organizations yet.</p>
          ) : (
            <ul className="space-y-3">
              {list.map((org) => (
                <li
                  key={org.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900">{org.name}</p>
                      <p className="text-xs text-slate-500">
                        {org.slug ?? org.id.slice(0, 8)} · {org.planType} / {org.billingInterval} · Renews{" "}
                        {formatDate(org.currentPeriodEnd)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={org.status} isLocked={org.isLocked} />
                    {canManage && (
                      <div className="flex gap-1">
                        {org.isLocked ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnlock(org.id)}
                            disabled={submitting}
                            aria-label="Unlock"
                          >
                            <Unlock className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLock(org.id)}
                            disabled={submitting}
                            aria-label="Lock"
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setGrantModal({ org })}
                          disabled={submitting}
                          aria-label="Grant"
                        >
                          <Gift className="h-4 w-4" />
                        </Button>
                        {org.status !== "inactive" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleRevoke(org.id)}
                            disabled={submitting}
                            aria-label="Revoke"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {grantModal && (
        <Modal
          open={!!grantModal}
          onClose={() => setGrantModal(null)}
          title="Grant subscription"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Grant manual subscription to <strong>{grantModal.org.name}</strong> (no Razorpay).
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700">Plan</label>
              <select
                value={grantPlan}
                onChange={(e) => setGrantPlan(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
              >
                {SUBSCRIPTION_PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Interval</label>
              <select
                value={grantInterval}
                onChange={(e) => setGrantInterval(e.target.value as BillingInterval)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
              >
                {BILLING_INTERVALS.map((i) => (
                  <option key={i} value={i}>
                    {i.charAt(0).toUpperCase() + i.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Duration (days)</label>
              <input
                type="number"
                min={1}
                max={3650}
                value={grantDays}
                onChange={(e) => setGrantDays(Number(e.target.value) || 30)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setGrantModal(null)}>
                Cancel
              </Button>
              <Button onClick={handleGrant} disabled={submitting}>
                {submitting ? "Granting…" : "Grant"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
