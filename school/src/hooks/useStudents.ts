import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { studentsRepository } from '../lib/db/repositories';
import type { Student, FeePayment } from '../types';

const QUERY_KEY = 'students';

const DEFAULT_PAGE_SIZE = 10;
const FILTERED_PAGE_SIZE = 50;

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

/** Infinite list for Students list page: default 10 per page, 50 when filters applied. */
export function useStudentsBySessionInfinite(
  sessionId: string,
  options?: { hasFilters?: boolean }
) {
  const pageSize = options?.hasFilters ? FILTERED_PAGE_SIZE : DEFAULT_PAGE_SIZE;
  const filters: StudentFilters = { sessionId };

  const q = useInfiniteQuery({
    queryKey: [QUERY_KEY, 'infinite', sessionId, pageSize, filters],
    queryFn: async ({ pageParam }) => {
      const result = await studentsRepository.getPaginated(pageParam, pageSize, filters);
      return result;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: !!sessionId,
  });

  const students = q.data?.pages.flatMap((p) => p.data) ?? [];
  const total = q.data?.pages[0]?.total ?? 0;
  return {
    students,
    total,
    fetchNextPage: q.fetchNextPage,
    hasNextPage: q.hasNextPage,
    isFetchingNextPage: q.isFetchingNextPage,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
  };
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

export function useCreateStudentsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (students: Omit<Student, 'id' | 'payments'>[]) => studentsRepository.createMany(students),
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

export function useTransferStudentsToSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentIds, newSessionId }: { studentIds: string[]; newSessionId: string }) =>
      studentsRepository.transferToSession(studentIds, newSessionId),
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
