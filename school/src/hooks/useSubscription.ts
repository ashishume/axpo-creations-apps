import { useQuery } from "@tanstack/react-query";
import { isTeachingApiConfigured } from "../lib/api/client";
import { subscriptionApi } from "../lib/db/api/subscription";

const QUERY_KEY = "subscriptionStatus";

export function useSubscriptionStatus(userId: string | null) {
  const enabled = !!userId && isTeachingApiConfigured();
  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: () => subscriptionApi.getStatus(),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}
