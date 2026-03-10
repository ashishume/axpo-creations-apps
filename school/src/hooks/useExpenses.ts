import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { expensesRepository } from '../lib/db/repositories';
import type { Expense } from '../types';

const QUERY_KEY = 'expenses';

const DEFAULT_PAGE_SIZE = 50;

export function useExpenses() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => expensesRepository.getAll(),
  });
}

export function useExpensesBySession(sessionId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'bySession', sessionId],
    queryFn: () => expensesRepository.getBySession(sessionId),
    enabled: !!sessionId,
  });
}

interface ExpenseFilters {
  sessionId?: string;
  category?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export function useExpensesPaginated(
  page: number = 1, 
  pageSize: number = 50, 
  filters?: ExpenseFilters
) {
  return useQuery({
    queryKey: [QUERY_KEY, 'paginated', page, pageSize, filters],
    queryFn: () => expensesRepository.getPaginated(page, pageSize, filters),
  });
}

/** Infinite list for Expenses list page: 50 per page. */
export function useExpensesBySessionInfinite(sessionId: string) {
  const pageSize = DEFAULT_PAGE_SIZE;
  const filters: ExpenseFilters = { sessionId };

  const q = useInfiniteQuery({
    queryKey: [QUERY_KEY, 'infinite', sessionId, pageSize],
    queryFn: async ({ pageParam }) => expensesRepository.getPaginated(pageParam, pageSize, filters),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: !!sessionId,
  });

  const expenses = q.data?.pages.flatMap((p) => p.data) ?? [];
  const total = q.data?.pages[0]?.total ?? 0;
  return {
    expenses,
    total,
    fetchNextPage: q.fetchNextPage,
    hasNextPage: q.hasNextPage,
    isFetchingNextPage: q.isFetchingNextPage,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
  };
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => expensesRepository.getById(id),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expense: Omit<Expense, 'id'>) => expensesRepository.create(expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Expense, 'id'>> }) =>
      expensesRepository.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expensesRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
