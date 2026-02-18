import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesRepository } from '../lib/db/repositories';
import type { Permission } from '../types/auth';

const QUERY_KEY = 'roles';

export function useRoles() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => rolesRepository.getAll(),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => rolesRepository.getById(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (role: { name: string; description?: string; permissions: Permission[] }) =>
      rolesRepository.create(role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; description?: string; permissions?: Permission[] } }) =>
      rolesRepository.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rolesRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useAllPermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => rolesRepository.getAllPermissions(),
  });
}
