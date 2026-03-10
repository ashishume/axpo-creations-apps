import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { stocksRepository } from '../lib/db/repositories';
import type { Stock, StockTransaction } from '../types';

const QUERY_KEY = 'stocks';

const DEFAULT_PAGE_SIZE = 50;

export function useStocks() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => stocksRepository.getAll(),
  });
}

export function useStocksBySession(sessionId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'bySession', sessionId],
    queryFn: () => stocksRepository.getBySession(sessionId),
    enabled: !!sessionId,
  });
}

interface StockFilters {
  sessionId?: string;
  status?: string;
  search?: string;
}

export function useStocksPaginated(
  page: number = 1, 
  pageSize: number = 50, 
  filters?: StockFilters
) {
  return useQuery({
    queryKey: [QUERY_KEY, 'paginated', page, pageSize, filters],
    queryFn: () => stocksRepository.getPaginated(page, pageSize, filters),
  });
}

/** Infinite list for Stocks list page: 50 per page. */
export function useStocksBySessionInfinite(sessionId: string) {
  const pageSize = DEFAULT_PAGE_SIZE;
  const filters: StockFilters = { sessionId };

  const q = useInfiniteQuery({
    queryKey: [QUERY_KEY, 'infinite', sessionId, pageSize],
    queryFn: async ({ pageParam }) => stocksRepository.getPaginated(pageParam, pageSize, filters),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: !!sessionId,
  });

  const stocks = q.data?.pages.flatMap((p) => p.data) ?? [];
  const total = q.data?.pages[0]?.total ?? 0;
  return {
    stocks,
    total,
    fetchNextPage: q.fetchNextPage,
    hasNextPage: q.hasNextPage,
    isFetchingNextPage: q.isFetchingNextPage,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
  };
}

export function useStock(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => stocksRepository.getById(id),
    enabled: !!id,
  });
}

export function useCreateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stock: Omit<Stock, 'id' | 'transactions'>) => stocksRepository.create(stock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Stock, 'id' | 'transactions'>> }) =>
      stocksRepository.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

export function useDeleteStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => stocksRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useAddStockTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stockId, transaction }: { stockId: string; transaction: Omit<StockTransaction, 'id'> }) => {
      await stocksRepository.addTransaction(stockId, transaction);
    },
    onSuccess: (_, { stockId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, stockId] });
    },
  });
}

export function useDeleteStockTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stockId, transactionId }: { stockId: string; transactionId: string }) =>
      stocksRepository.deleteTransaction(stockId, transactionId),
    onSuccess: (_, { stockId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, stockId] });
    },
  });
}
