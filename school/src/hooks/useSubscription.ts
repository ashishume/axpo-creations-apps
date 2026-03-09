import { useQuery } from "@tanstack/react-query";
import { isTeachingApiConfigured } from "../lib/api/client";
import { subscriptionApi } from "../lib/db/api/subscription";
import { orgSubscriptionApi } from "../lib/db/api/orgSubscription";

const QUERY_KEY_SUBSCRIPTION = "subscriptionStatus";
const QUERY_KEY_ORG_SUBSCRIPTION = "orgSubscriptionStatus";

export function useSubscriptionStatus(userId: string | null) {
  const enabled = !!userId && isTeachingApiConfigured();
  return useQuery({
    queryKey: [QUERY_KEY_SUBSCRIPTION, userId],
    queryFn: () => subscriptionApi.getStatus(),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

/** Org-level subscription status (for org users). Super Admin has no org so this is disabled. */
export function useOrgSubscriptionStatus(organizationId: string | null | undefined) {
  const enabled =
    Boolean(organizationId) && isTeachingApiConfigured();
  return useQuery({
    queryKey: [QUERY_KEY_ORG_SUBSCRIPTION, organizationId],
    queryFn: () => orgSubscriptionApi.getStatus(),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}
