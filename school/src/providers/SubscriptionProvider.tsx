import { createContext, useContext, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useSubscriptionStatus } from "../hooks/useSubscription";

interface SubscriptionContextValue {
  isPremium: boolean;
  status: string | undefined;
  planType: string | undefined;
  isLoading: boolean;
  refetch: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { data, isLoading, refetch } = useSubscriptionStatus(userId);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      isPremium: data?.planType === "premium" && data?.status === "active",
      status: data?.status,
      planType: data?.planType,
      isLoading,
      refetch: () => refetch(),
    }),
    [data?.planType, data?.status, isLoading, refetch]
  );

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
      isPremium: false,
      status: undefined,
      planType: undefined,
      isLoading: false,
      refetch: () => {},
    };
  }
  return ctx;
}
