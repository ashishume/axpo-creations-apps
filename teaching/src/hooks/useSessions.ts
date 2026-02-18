import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsRepository } from '../lib/db/repositories';
import type { Session } from '../types';

const QUERY_KEY = 'sessions';

export function useSessions() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => sessionsRepository.getAll(),
  });
}

export function useSessionsBySchool(schoolId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'bySchool', schoolId],
    queryFn: () => sessionsRepository.getBySchool(schoolId),
    enabled: !!schoolId,
  });
}

export function useSessionsPaginated(page: number = 1, pageSize: number = 10, schoolId?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'paginated', page, pageSize, schoolId],
    queryFn: () => sessionsRepository.getPaginated(page, pageSize, schoolId),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => sessionsRepository.getById(id),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (session: Omit<Session, 'id'>) => sessionsRepository.create(session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Session, 'id'>> }) =>
      sessionsRepository.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sessionsRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
