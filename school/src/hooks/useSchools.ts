import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolsRepository } from '../lib/db/repositories';
import type { School } from '../types';

const QUERY_KEY = 'schools';

export function useSchools() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => schoolsRepository.getAll(),
  });
}

export function useSchoolsPaginated(page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: [QUERY_KEY, 'paginated', page, pageSize],
    queryFn: () => schoolsRepository.getPaginated(page, pageSize),
  });
}

export function useSchool(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => schoolsRepository.getById(id),
    enabled: !!id,
  });
}

export function useCreateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (school: Omit<School, 'id'>) => schoolsRepository.create(school),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<School, 'id'>> }) =>
      schoolsRepository.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

export function useDeleteSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => schoolsRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
