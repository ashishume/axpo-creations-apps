import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { staffRepository, type ExtendedSalaryPayment } from '../lib/db/repositories';
import { staffRepositoryApi } from '../lib/db/api/staff';
import type { Staff, LeaveSummary } from '../types';

const QUERY_KEY = 'staff';

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

/** Infinite list for Staff list page: default 10 per page, 50 when filters applied. */
export function useStaffBySessionInfinite(
  sessionId: string,
  options?: { hasFilters?: boolean }
) {
  const pageSize = options?.hasFilters ? FILTERED_PAGE_SIZE : DEFAULT_PAGE_SIZE;
  const filters: StaffFilters = { sessionId };

  const q = useInfiniteQuery({
    queryKey: [QUERY_KEY, 'infinite', sessionId, pageSize, filters],
    queryFn: async ({ pageParam }) => staffRepository.getPaginated(pageParam, pageSize, filters),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: !!sessionId,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
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

export function useAddSalaryPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, payment }: { staffId: string; payment: Omit<ExtendedSalaryPayment, 'id' | 'lateDays'> }) =>
      staffRepository.addSalaryPayment(staffId, payment),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, staffId] });
    },
  });
}

export function useUpdateSalaryPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, paymentId, updates }: { staffId: string; paymentId: string; updates: Partial<ExtendedSalaryPayment> }) =>
      staffRepository.updateSalaryPayment(staffId, paymentId, updates),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, staffId] });
    },
  });
}

export function useDeleteSalaryPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffId, paymentId }: { staffId: string; paymentId: string }) =>
      staffRepository.deleteSalaryPayment(staffId, paymentId),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, staffId] });
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
