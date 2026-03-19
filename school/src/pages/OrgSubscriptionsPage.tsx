import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { FormField } from "../components/ui/FormField";
import { Modal } from "../components/ui/Modal";
import { SkeletonList } from "../components/ui/Skeleton";
import { adminSubscriptionsApi, type OrgWithSubscription } from "../lib/db/api/adminSubscriptions";
import { SUBSCRIPTION_PLANS, BILLING_INTERVALS, type BillingInterval } from "../lib/plans";
import { useAuth } from "../context/AuthContext";
import { isTeachingApiConfigured } from "../lib/api/client";
import { Lock, Unlock, Gift, RotateCcw, Building2, Calendar } from "lucide-react";

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
      <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-600 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200">
        Locked
      </span>
    );
  }
  const styles: Record<string, string> = {
    active: "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300",
    pending: "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300",
    halted: "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300",
    cancelled: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    expired: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    inactive: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400",
  };
  const className = styles[status] ?? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
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
  const [grantExpiryDate, setGrantExpiryDate] = useState<string>("");
  const [expiryModal, setExpiryModal] = useState<{ org: OrgWithSubscription } | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>("");
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
      let periodEnd: string | undefined;
      if (grantExpiryDate.trim()) {
        const d = new Date(grantExpiryDate.trim());
        d.setHours(23, 59, 59, 999);
        periodEnd = d.toISOString();
      }
      await adminSubscriptionsApi.grant(
        grantModal.org.id,
        grantPlan,
        grantInterval,
        grantDays,
        periodEnd
      );
      setGrantModal(null);
      setGrantExpiryDate("");
      await refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetExpiry = async () => {
    if (!expiryModal || !expiryDate.trim()) return;
    setSubmitting(true);
    try {
      const end = new Date(expiryDate.trim());
      end.setHours(23, 59, 59, 999);
      await adminSubscriptionsApi.updatePeriod(expiryModal.org.id, {
        currentPeriodEnd: end.toISOString(),
      });
      setExpiryModal(null);
      setExpiryDate("");
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
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Org subscriptions</h2>
        <p className="text-slate-600 dark:text-slate-400">
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
            <p className="text-sm text-slate-500 dark:text-slate-400">No organizations yet.</p>
          ) : (
            <ul className="space-y-3">
              {list.map((org) => (
                <li
                  key={org.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-slate-400 dark:text-slate-300" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{org.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
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
                            <Unlock className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLock(org.id)}
                            disabled={submitting}
                            aria-label="Lock"
                          >
                            <Lock className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setGrantModal({ org })}
                          disabled={submitting}
                          aria-label="Grant"
                        >
                          <Gift className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setExpiryModal({ org });
                            setExpiryDate(
                              org.currentPeriodEnd
                                ? org.currentPeriodEnd.slice(0, 10)
                                : ""
                            );
                          }}
                          disabled={submitting}
                          title="Set expiry date"
                          aria-label="Set expiry date"
                        >
                          <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </Button>
                        {org.status !== "inactive" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                            onClick={() => handleRevoke(org.id)}
                            disabled={submitting}
                            aria-label="Revoke"
                          >
                            <RotateCcw className="h-4 w-4 text-slate-600 dark:text-slate-300" />
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
          onClose={() => { setGrantModal(null); setGrantExpiryDate(""); }}
          title="Grant subscription"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Grant manual subscription to <strong>{grantModal.org.name}</strong> (no Razorpay).
            </p>
            <FormField label="Plan">
              <Select
                value={grantPlan}
                onChange={(e) => setGrantPlan(e.target.value)}
              >
                {SUBSCRIPTION_PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Interval">
              <Select
                value={grantInterval}
                onChange={(e) => setGrantInterval(e.target.value as BillingInterval)}
              >
                {BILLING_INTERVALS.map((i) => (
                  <option key={i} value={i}>
                    {i.charAt(0).toUpperCase() + i.slice(1)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Duration (days)">
              <Input
                type="number"
                min={1}
                max={3650}
                value={grantDays}
                onChange={(e) => setGrantDays(Number(e.target.value) || 30)}
              />
            </FormField>
            <FormField label="Expiry date (optional)" helperText="Override duration with exact last date of expiry">
              <Input
                type="date"
                value={grantExpiryDate}
                onChange={(e) => setGrantExpiryDate(e.target.value)}
              />
            </FormField>
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

      {expiryModal && (
        <Modal
          open={!!expiryModal}
          onClose={() => { setExpiryModal(null); setExpiryDate(""); }}
          title="Set expiry date"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Set last date of expiry for <strong>{expiryModal.org.name}</strong>.
            </p>
            <FormField label="Expiry date">
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => { setExpiryModal(null); setExpiryDate(""); }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSetExpiry}
                disabled={submitting || !expiryDate.trim()}
              >
                {submitting ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
