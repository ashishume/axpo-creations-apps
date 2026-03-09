import { createContext, useContext, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useOrgSubscriptionStatus } from "../hooks/useSubscription";

interface SubscriptionContextValue {
  /** Org has active subscription and is not locked (can use app). Super Admin always true. */
  isActive: boolean;
  /** Org is manually locked by Super Admin. */
  isLocked: boolean;
  status: string | undefined;
  planType: string | undefined;
  billingInterval: string | undefined;
  currentPeriodEnd: string | null | undefined;
  isLoading: boolean;
  refetch: () => void;
  /** Legacy: premium plan for feature gating (e.g. AI assistant). */
  isPremium: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const organizationId = user?.organizationId ?? null;
  const { data, isLoading, refetch } = useOrgSubscriptionStatus(organizationId);

  const value = useMemo<SubscriptionContextValue>(() => {
    const isSuperAdmin = user != null && organizationId == null;
    if (isSuperAdmin) {
      return {
        isActive: true,
        isLocked: false,
        status: "active",
        planType: "premium",
        billingInterval: undefined,
        currentPeriodEnd: undefined,
        isLoading,
        refetch: () => refetch(),
        isPremium: true,
      };
    }
    const active = data?.status === "active" && !data?.isLocked;
    return {
      isActive: active,
      isLocked: data?.isLocked ?? false,
      status: data?.status,
      planType: data?.planType,
      billingInterval: data?.billingInterval,
      currentPeriodEnd: data?.currentPeriodEnd,
      isLoading,
      refetch: () => refetch(),
      isPremium: data?.planType === "premium" && data?.status === "active",
    };
  }, [user, organizationId, data, isLoading, refetch]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    return {
      isActive: false,
      isLocked: false,
      status: undefined,
      planType: undefined,
      billingInterval: undefined,
      currentPeriodEnd: undefined,
      isLoading: false,
      refetch: () => {},
      isPremium: false,
    };
  }
  return ctx;
}
