import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authRepository } from '../lib/db/repositories';
import type { CreateUserRequest, UpdateUserRequest } from '../types/auth';

const QUERY_KEY = 'users';

export function useUsers(page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: [QUERY_KEY, page, pageSize],
    queryFn: () => authRepository.getUsers(page, pageSize),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateUserRequest) => authRepository.createUser(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateUserRequest }) =>
      authRepository.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => authRepository.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      authRepository.resetPassword(userId, newPassword),
  });
}
