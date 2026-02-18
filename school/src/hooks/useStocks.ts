import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stocksRepository } from '../lib/db/repositories';
import type { Stock, StockTransaction } from '../types';

const QUERY_KEY = 'stocks';

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
  pageSize: number = 10, 
  filters?: StockFilters
) {
  return useQuery({
    queryKey: [QUERY_KEY, 'paginated', page, pageSize, filters],
    queryFn: () => stocksRepository.getPaginated(page, pageSize, filters),
  });
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
