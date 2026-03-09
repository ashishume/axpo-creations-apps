import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fixedCostsRepository } from '../lib/db/repositories';
import type { FixedMonthlyCost } from '../types';

const QUERY_KEY = 'fixedCosts';

export function useFixedCosts() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => fixedCostsRepository.getAll(),
  });
}

export function useFixedCostsBySession(sessionId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'bySession', sessionId],
    queryFn: () => fixedCostsRepository.getBySession(sessionId),
    enabled: !!sessionId,
  });
}

export function useCreateFixedCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cost: Omit<FixedMonthlyCost, 'id'>) => fixedCostsRepository.create(cost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateFixedCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<FixedMonthlyCost, 'id'>> }) =>
      fixedCostsRepository.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteFixedCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fixedCostsRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
