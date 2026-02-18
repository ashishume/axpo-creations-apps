import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsRepository } from '../lib/db/repositories';
import type { Student, FeePayment } from '../types';

const QUERY_KEY = 'students';

export function useStudents() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => studentsRepository.getAll(),
  });
}

export function useStudentsBySession(sessionId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'bySession', sessionId],
    queryFn: () => studentsRepository.getBySession(sessionId),
    enabled: !!sessionId,
  });
}

interface StudentFilters {
  sessionId?: string;
  classId?: string;
  search?: string;
}

export function useStudentsPaginated(
  page: number = 1, 
  pageSize: number = 10, 
  filters?: StudentFilters
) {
  return useQuery({
    queryKey: [QUERY_KEY, 'paginated', page, pageSize, filters],
    queryFn: () => studentsRepository.getPaginated(page, pageSize, filters),
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => studentsRepository.getById(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (student: Omit<Student, 'id' | 'payments'>) => studentsRepository.create(student),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Student, 'id' | 'payments'>> }) =>
      studentsRepository.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => studentsRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useAddStudentPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, payment }: { studentId: string; payment: Omit<FeePayment, 'id'> }) =>
      studentsRepository.addPayment(studentId, payment),
    onSuccess: (_, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, studentId] });
    },
  });
}

export function useDeleteStudentPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, paymentId }: { studentId: string; paymentId: string }) =>
      studentsRepository.deletePayment(studentId, paymentId),
    onSuccess: (_, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, studentId] });
    },
  });
}
