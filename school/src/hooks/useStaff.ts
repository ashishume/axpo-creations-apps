import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { staffRepository, type ExtendedSalaryPayment } from '../lib/db/repositories';
import { staffRepositoryApi } from '../lib/db/api/staff';
import type { Staff, LeaveSummary } from '../types';

const QUERY_KEY = 'staff';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
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
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Staff, 'id' | 'salaryPayments'>> }) =>
      staffRepository.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => staffRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
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
