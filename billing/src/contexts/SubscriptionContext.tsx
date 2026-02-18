"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscriptionRepository, type SubscriptionPlan, type UserSubscription } from "@/lib/db";

const SUB_VALIDATED_KEY = "billing-subscription-validated";
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const QUARTER_MS = 3 * MONTH_MS;

interface SubscriptionContextType {
  /** Current subscription if valid and active; null if free or invalid/expired. */
  subscription: UserSubscription | null;
  /** Plans list for display. */
  plans: SubscriptionPlan[];
  loading: boolean;
  /** True when user had a paid plan but it is now invalid/expired (disabled until renewal). */
  disabledUntilRenewal: boolean;
  /** Effective plan id to use for limits: "free" when subscription is null or disabled. */
  effectivePlanId: string;
  refetchSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

function getValidationIntervalMs(planId: string, plans: SubscriptionPlan[]): number {
  if (planId === "free") return 0;
  const plan = plans.find((p) => p.id === planId);
  return plan?.billingInterval === "quarterly" ? QUARTER_MS : MONTH_MS;
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [disabledUntilRenewal, setDisabledUntilRenewal] = useState(false);

  const fetchPlans = useCallback(async () => {
    const data = await subscriptionRepository.getPlans();
    setPlans(data);
    return data;
  }, []);

  const validateAndSetSubscription = useCallback(
    async (userId: string, _plansData: SubscriptionPlan[]) => {
      const raw = await subscriptionRepository.getUserSubscription(userId);
      const now = Date.now();
      const storageKey = `${SUB_VALIDATED_KEY}-${userId}`;

      if (!raw) {
        try {
          const last = localStorage.getItem(storageKey);
          if (last) setDisabledUntilRenewal(true);
        } catch {
          /* ignore */
        }
        setSubscription(null);
        return;
      }

      setSubscription(raw);
      setDisabledUntilRenewal(false);
      try {
        localStorage.setItem(storageKey, String(now));
      } catch {
        /* ignore */
      }
    },
    []
  );

  const refetchSubscription = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const plansData = await fetchPlans();
      await validateAndSetSubscription(user.id, plansData);
    } catch (e) {
      console.error("Subscription refetch failed:", e);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user, fetchPlans, validateAndSetSubscription]);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setPlans([]);
      setDisabledUntilRenewal(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const plansData = await fetchPlans();
        if (cancelled) return;
        const sub = await subscriptionRepository.getUserSubscription(user.id);
        if (cancelled) return;
        if (sub) {
          setSubscription(sub);
          setDisabledUntilRenewal(false);
          const intervalMs = getValidationIntervalMs(sub.planId, plansData);
          const storageKey = `${SUB_VALIDATED_KEY}-${user.id}`;
          try {
            const lastValidated = localStorage.getItem(storageKey);
            if (lastValidated) {
              const last = parseInt(lastValidated, 10);
              const now = Date.now();
              if (!Number.isNaN(last) && now - last >= intervalMs) {
                const revalid = await subscriptionRepository.getUserSubscription(user.id);
                if (cancelled) return;
                if (!revalid) {
                  setSubscription(null);
                  setDisabledUntilRenewal(true);
                } else {
                  setSubscription(revalid);
                  localStorage.setItem(storageKey, String(now));
                }
              }
            } else {
              localStorage.setItem(storageKey, String(Date.now()));
            }
          } catch {
            /* ignore */
          }
        } else {
          setSubscription(null);
          try {
            const storageKey = `${SUB_VALIDATED_KEY}-${user.id}`;
            if (localStorage.getItem(storageKey)) setDisabledUntilRenewal(true);
          } catch {
            /* ignore */
          }
        }
      } catch (e) {
        if (!cancelled) console.error("Subscription load failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, fetchPlans]);

  // Re-validate paid subscription on an interval while app is open (hourly check)
  useEffect(() => {
    if (!user || !subscription || subscription.planId === "free" || disabledUntilRenewal) return;
    const intervalMs = getValidationIntervalMs(subscription.planId, plans);
    if (intervalMs <= 0) return;
    const storageKey = `${SUB_VALIDATED_KEY}-${user.id}`;
    const check = async () => {
      try {
        const last = localStorage.getItem(storageKey);
        if (!last) return;
        const lastTs = parseInt(last, 10);
        if (Number.isNaN(lastTs) || Date.now() - lastTs < intervalMs) return;
        const sub = await subscriptionRepository.getUserSubscription(user.id);
        if (sub) {
          setSubscription(sub);
          localStorage.setItem(storageKey, String(Date.now()));
        } else {
          setSubscription(null);
          setDisabledUntilRenewal(true);
        }
      } catch {
        /* ignore */
      }
    };
    const id = setInterval(check, 60 * 60 * 1000);
    check();
    return () => clearInterval(id);
  }, [user?.id, subscription?.planId, subscription?.id, disabledUntilRenewal, plans]);

  const effectivePlanId = subscription && !disabledUntilRenewal ? subscription.planId : "free";

  const value: SubscriptionContextType = {
    subscription,
    plans,
    loading,
    disabledUntilRenewal,
    effectivePlanId,
    refetchSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (ctx === undefined) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}
