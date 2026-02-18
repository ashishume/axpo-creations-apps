import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesRepository } from '../lib/db/repositories';
import type { StudentClass } from '../types';

const QUERY_KEY = 'classes';

export function useClasses() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => classesRepository.getAll(),
  });
}

export function useClassesBySession(sessionId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'bySession', sessionId],
    queryFn: () => classesRepository.getBySession(sessionId),
    enabled: !!sessionId,
  });
}

export function useClassesPaginated(page: number = 1, pageSize: number = 10, sessionId?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'paginated', page, pageSize, sessionId],
    queryFn: () => classesRepository.getPaginated(page, pageSize, sessionId),
  });
}

export function useClass(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => classesRepository.getById(id),
    enabled: !!id,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentClass: Omit<StudentClass, 'id'>) => classesRepository.create(studentClass),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<StudentClass, 'id'>> }) =>
      classesRepository.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => classesRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
