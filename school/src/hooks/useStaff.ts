import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { staffRepository, type ExtendedSalaryPayment } from '../lib/db/repositories';
import { staffRepositoryApi } from '../lib/db/api/staff';
import type { Staff, LeaveSummary } from '../types';

const QUERY_KEY = 'staff';

/** Invalidate session-scoped staff list. */
function invalidateSessionStaffList(queryClient: QueryClient, sessionId?: string | null) {
  if (sessionId) {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'bySession', sessionId] });
    queryClient.resetQueries({ queryKey: [QUERY_KEY, 'infinite', sessionId], exact: false });
  } else {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  }
}

/** Add one staff to session caches (bySession + infinite) without refetch. */
function addStaffToSessionCache(queryClient: QueryClient, sessionId: string, staff: Staff) {
  const stub: Staff = { ...staff, id: staff.id, sessionId, salaryPayments: staff.salaryPayments ?? [] };
  queryClient.setQueryData(
    [QUERY_KEY, 'bySession', sessionId],
    (old: Staff[] | undefined) => (old ? [stub, ...old] : [stub])
  );
  queryClient.setQueriesData<{ pages: { data: Staff[]; total: number }[] }>(
    { queryKey: [QUERY_KEY, 'infinite', sessionId], exact: false },
    (old) => {
      if (!old?.pages?.length) return old;
      const [first, ...rest] = old.pages;
      return {
        ...old,
        pages: [
          { ...first, data: [stub, ...(first.data ?? [])], total: (first.total ?? 0) + 1 },
          ...rest,
        ],
      };
    }
  );
}

/** Replace a temp-id staff with the real server staff in session caches. */
function replaceTempStaffInSessionCache(
  queryClient: QueryClient,
  sessionId: string,
  tempId: string,
  realStaff: Staff
) {
  const mergeInList = (list: Staff[] | undefined) =>
    Array.isArray(list) ? list.map((s) => (s.id === tempId ? realStaff : s)) : list;
  queryClient.setQueryData([QUERY_KEY, 'bySession', sessionId], mergeInList);
  queryClient.setQueriesData<{ pages: { data: Staff[]; total: number }[] }>(
    { queryKey: [QUERY_KEY, 'infinite', sessionId], exact: false },
    (old) => {
      if (!old?.pages?.length) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: mergeInList(page.data) ?? page.data,
        })),
      };
    }
  );
}

/** Remove one staff from session caches. */
function removeStaffFromSessionCache(queryClient: QueryClient, sessionId: string, staffId: string) {
  queryClient.setQueryData(
    [QUERY_KEY, 'bySession', sessionId],
    (old: Staff[] | undefined) => (old ? old.filter((s) => s.id !== staffId) : [])
  );
  queryClient.setQueriesData<{ pages: { data: Staff[]; total: number }[] }>(
    { queryKey: [QUERY_KEY, 'infinite', sessionId], exact: false },
    (old) => {
      if (!old?.pages?.length) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: (page.data ?? []).filter((s) => s.id !== staffId),
          total: Math.max(0, (page.total ?? 0) - (page.data?.some((s) => s.id === staffId) ? 1 : 0)),
        })),
      };
    }
  );
}

/** Prepend one staff to session caches (e.g. rollback after optimistic delete). */
function prependStaffToSessionCache(queryClient: QueryClient, sessionId: string, staff: Staff) {
  queryClient.setQueryData(
    [QUERY_KEY, 'bySession', sessionId],
    (old: Staff[] | undefined) => (old ? [staff, ...old] : [staff])
  );
  queryClient.setQueriesData<{ pages: { data: Staff[]; total: number }[] }>(
    { queryKey: [QUERY_KEY, 'infinite', sessionId], exact: false },
    (old) => {
      if (!old?.pages?.length) return old;
      const [first, ...rest] = old.pages;
      return {
        ...old,
        pages: [
          { ...first, data: [staff, ...(first.data ?? [])], total: (first.total ?? 0) + 1 },
          ...rest,
        ],
      };
    }
  );
}

/** Merge an updated staff into bySession and infinite caches. */
function mergeUpdatedStaffIntoSessionCache(queryClient: QueryClient, sessionId: string, staff: Staff) {
  const staffId = staff.id;
  const mergeInList = (list: Staff[] | undefined) =>
    Array.isArray(list) ? list.map((s) => (s.id === staffId ? staff : s)) : list;
  queryClient.setQueryData([QUERY_KEY, 'bySession', sessionId], mergeInList);
  queryClient.setQueriesData<{ pages: { data: Staff[]; total: number }[] }>(
    { queryKey: [QUERY_KEY, 'infinite', sessionId], exact: false },
    (old) => {
      if (!old?.pages?.length) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: mergeInList(page.data) ?? page.data,
        })),
      };
    }
  );
}

/**
 * After POST/PATCH/DELETE .../staff/:id/payments: fetch only that staff (GET /staff/:id) and merge into
 * list caches. We intentionally do NOT refetch the whole staff list (GET /staff?session_id=... or
 * paginated list) so the client stays fast.
 * Exported for use from AppContext.
 */
export async function refetchStaffAndMergeIntoCache(queryClient: ReturnType<typeof useQueryClient>, staffId: string) {
  const updatedStaff = await staffRepository.getById(staffId);
  if (!updatedStaff) return;
  const sessionId = updatedStaff.sessionId;

  const mergeStaffInList = (list: Staff[] | undefined) =>
    Array.isArray(list) ? list.map((s) => (s.id === staffId ? updatedStaff : s)) : list;

  queryClient.setQueryData([QUERY_KEY, staffId], updatedStaff);

  queryClient.setQueriesData<Staff[]>(
    { queryKey: [QUERY_KEY, 'bySession'], predicate: (q) => q.queryKey[1] === 'bySession' && q.queryKey[2] === sessionId },
    mergeStaffInList
  );

  queryClient.setQueriesData<{ pages: { data: Staff[] }[]; pageParams: unknown[] }>(
    { queryKey: [QUERY_KEY, 'infinite'], predicate: (q) => q.queryKey[1] === 'infinite' && q.queryKey[2] === sessionId },
    (old) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: mergeStaffInList(page.data) ?? page.data,
        })),
      };
    }
  );

  queryClient.setQueriesData<{ data: Staff[] }>(
    {
      queryKey: [QUERY_KEY, 'paginated'],
      predicate: (query) =>
        query.queryKey[1] === 'paginated' && (query.queryKey[4] as { sessionId?: string } | undefined)?.sessionId === sessionId,
    },
    (old) => (old?.data ? { ...old, data: mergeStaffInList(old.data)! } : old)
  );
}

const DEFAULT_PAGE_SIZE = 10;
const FILTERED_PAGE_SIZE = 50;

export function useStaff() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => staffRepository.getAll(),
  });
}

export function useStaffBySession(sessionId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'bySession', sessionId],
    queryFn: () => staffRepository.getBySession(sessionId),
    enabled: !!sessionId,
  });
}

interface StaffFilters {
  sessionId?: string;
  role?: string;
  search?: string;
}

export function useStaffPaginated(
  page: number = 1, 
  pageSize: number = 10, 
  filters?: StaffFilters
) {
  return useQuery({
    queryKey: [QUERY_KEY, 'paginated', page, pageSize, filters],
    queryFn: () => staffRepository.getPaginated(page, pageSize, filters),
  });
}

/** Infinite list for Staff list page: default 10 per page, 50 when filters applied. Search and role are sent to backend. */
export function useStaffBySessionInfinite(
  sessionId: string,
  options?: { hasFilters?: boolean; search?: string; role?: string }
) {
  const pageSize = options?.hasFilters ? FILTERED_PAGE_SIZE : DEFAULT_PAGE_SIZE;
  const filters: StaffFilters = {
    sessionId,
    search: options?.search?.trim() || undefined,
    role: options?.role || undefined,
  };

  const q = useInfiniteQuery({
    queryKey: [QUERY_KEY, 'infinite', sessionId, pageSize, filters],
    queryFn: async ({ pageParam }) => staffRepository.getPaginated(pageParam, pageSize, filters),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: !!sessionId,
    placeholderData: keepPreviousData,
  });

  const staffList = q.data?.pages.flatMap((p) => p.data) ?? [];
  const total = q.data?.pages[0]?.total ?? 0;
  return {
    staffList,
    total,
    fetchNextPage: q.fetchNextPage,
    hasNextPage: q.hasNextPage,
    isFetchingNextPage: q.isFetchingNextPage,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
  };
}

export function useStaffMember(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => staffRepository.getById(id),
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (staffMember: Omit<Staff, 'id' | 'salaryPayments'>) => staffRepository.create(staffMember),
    onMutate: async (payload) => {
      if (!payload.sessionId) return {};
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const stub: Staff = {
        ...payload,
        id: tempId,
        sessionId: payload.sessionId,
        salaryPayments: [],
      };
      addStaffToSessionCache(queryClient, payload.sessionId, stub);
      return { tempId };
    },
    onSuccess: (data, payload, context) => {
      if (payload.sessionId) {
        if (context?.tempId && data && typeof data === 'object' && 'id' in data) {
          replaceTempStaffInSessionCache(queryClient, payload.sessionId, context.tempId, data as Staff);
          queryClient.setQueryData([QUERY_KEY, data.id], data);
        } else if (!context?.tempId && data) {
          addStaffToSessionCache(queryClient, payload.sessionId, data as Staff);
        }
      } else {
        invalidateSessionStaffList(queryClient, null);
      }
    },
    onError: (_err, payload, context) => {
      if (payload.sessionId && context?.tempId) {
        removeStaffFromSessionCache(queryClient, payload.sessionId, context.tempId);
      }
    },
  });
}

export function useCreateStaffBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (staffMembers: Omit<Staff, 'id' | 'salaryPayments'>[]) => staffRepository.createMany(staffMembers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useAddSalaryPaymentsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payments: { staffId: string; payment: Omit<ExtendedSalaryPayment, 'id' | 'lateDays'> }[]) =>
      staffRepository.addSalaryPaymentsBatch(payments),
    onSuccess: async (_, payments) => {
      const staffIds = [...new Set(payments.map((p) => p.staffId))];
      for (const staffId of staffIds) {
        await refetchStaffAndMergeIntoCache(queryClient, staffId);
      }
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
      sessionId,
    }: {
      id: string;
      updates: Partial<Omit<Staff, 'id' | 'salaryPayments'>>;
      sessionId?: string;
    }) => staffRepository.update(id, updates),
    onMutate: async (variables) => {
      if (!variables.sessionId) return {};
      const list = queryClient.getQueryData<Staff[]>([QUERY_KEY, 'bySession', variables.sessionId]);
      const previous = list?.find((s) => s.id === variables.id);
      if (!previous) return {};
      const optimistic: Staff = { ...previous, ...variables.updates };
      mergeUpdatedStaffIntoSessionCache(queryClient, variables.sessionId, optimistic);
      return { previousStaff: previous };
    },
    onSuccess: (data, { id, sessionId }) => {
      if (sessionId && data && typeof data === 'object' && 'id' in data) {
        mergeUpdatedStaffIntoSessionCache(queryClient, sessionId, data as Staff);
        queryClient.setQueryData([QUERY_KEY, id], data);
      } else {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        if (data) queryClient.setQueryData([QUERY_KEY, id], data);
        else queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
      }
    },
    onError: (_err, variables, context) => {
      if (variables.sessionId && context?.previousStaff) {
        mergeUpdatedStaffIntoSessionCache(
          queryClient,
          variables.sessionId,
          context.previousStaff
        );
      }
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: string | { id: string; sessionId?: string }) => {
      const id = typeof payload === 'string' ? payload : payload.id;
      return staffRepository.delete(id);
    },
    onMutate: async (payload) => {
      const id = typeof payload === 'string' ? payload : payload.id;
      const sessionId = typeof payload === 'string' ? undefined : payload.sessionId;
      if (!sessionId) return {};
      const list = queryClient.getQueryData<Staff[]>([QUERY_KEY, 'bySession', sessionId]);
      const previous = list?.find((s) => s.id === id);
      if (!previous) return {};
      removeStaffFromSessionCache(queryClient, sessionId, id);
      return { previousStaff: previous, sessionId };
    },
    onSuccess: (_, payload) => {
      const id = typeof payload === 'string' ? payload : payload.id;
      const sessionId = typeof payload === 'string' ? undefined : payload.sessionId;
      if (!sessionId) invalidateSessionStaffList(queryClient, null);
      queryClient.removeQueries({ queryKey: [QUERY_KEY, id] });
    },
    onError: (_err, payload, context) => {
      if (context?.previousStaff && context?.sessionId) {
        prependStaffToSessionCache(queryClient, context.sessionId, context.previousStaff);
      }
    },
  });
}

export function useDeleteAllStaffBySession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => staffRepository.deleteAllBySession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useTransferStaffToSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      fromSessionId,
      staffIds,
      toSessionId,
    }: {
      fromSessionId: string;
      staffIds: string[];
      toSessionId: string;
    }) =>
      staffRepository.transferToSession({
        fromSessionId,
        staffIds,
        toSessionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useAddSalaryPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, payment }: { staffId: string; payment: Omit<ExtendedSalaryPayment, 'id' | 'lateDays'> }) =>
      staffRepository.addSalaryPayment(staffId, payment),
    onSuccess: async (_, { staffId }) => {
      await refetchStaffAndMergeIntoCache(queryClient, staffId);
    },
  });
}

export function useUpdateSalaryPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, paymentId, updates }: { staffId: string; paymentId: string; updates: Partial<ExtendedSalaryPayment> }) =>
      staffRepository.updateSalaryPayment(staffId, paymentId, updates),
    onSuccess: async (_, { staffId }) => {
      await refetchStaffAndMergeIntoCache(queryClient, staffId);
    },
  });
}

export function useDeleteSalaryPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, paymentId }: { staffId: string; paymentId: string }) =>
      staffRepository.deleteSalaryPayment(staffId, paymentId),
    onSuccess: async (_, { staffId }) => {
      await refetchStaffAndMergeIntoCache(queryClient, staffId);
    },
  });
}

export function useStaffLastPaidDate(staffId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, staffId, 'lastPaid'],
    queryFn: () => staffRepository.getLastPaidDate(staffId),
    enabled: !!staffId,
  });
}

export function useStaffSalaryStatus(staffId: string, month: string) {
  return useQuery({
    queryKey: [QUERY_KEY, staffId, 'salary', month],
    queryFn: () => staffRepository.getSalaryStatus(staffId, month),
    enabled: !!staffId && !!month,
  });
}

export function useLeaveSummary(staffId: string, month: string) {
  return useQuery<LeaveSummary>({
    queryKey: [QUERY_KEY, staffId, 'leaveSummary', month],
    queryFn: () => staffRepositoryApi.getLeaveSummary(staffId, month),
    enabled: !!staffId && !!month,
  });
}
