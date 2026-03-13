import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { studentsRepository, enrollmentsRepository } from '../lib/db/repositories';
import type { Student, StudentEnrollment, FeePayment } from '../types';

const QUERY_KEY = 'students';
const ENROLLMENTS_QUERY_KEY = 'enrollments';

/** Invalidate session-scoped student list with minimal refetches: bySession once, infinite reset to page 1 then refetch once. */
function invalidateSessionStudentList(queryClient: QueryClient, sessionId?: string | null) {
  if (sessionId) {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'bySession', sessionId] });
    queryClient.resetQueries({ queryKey: [QUERY_KEY, 'infinite', sessionId], exact: false });
  } else {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  }
}

/** SessionStudent-like minimal for cache (add new student without refetch). */
type SessionStudentLike = Record<string, unknown> & { id: string; payments: unknown[] };

/** Enrollment/fee fields from create payload so stub shows "Not Paid" not "Fully Paid". */
type EnrollmentStubFields = {
  classId?: string;
  registrationFees?: number;
  annualFund?: number;
  monthlyFees?: number;
  transportFees?: number;
  registrationPaid?: boolean;
  annualFundPaid?: boolean;
  dueDayOfMonth?: number;
  lateFeeAmount?: number;
  lateFeeFrequency?: string;
};

/** Add one student to session caches (bySession + infinite) without refetch. */
function addStudentToSessionCache(
  queryClient: QueryClient,
  sessionId: string,
  student: Student,
  enrollmentFields?: EnrollmentStubFields
) {
  const stub: SessionStudentLike = {
    ...student,
    id: student.id,
    sessionId,
    payments: [],
    enrollmentId: undefined,
    classId: enrollmentFields?.classId,
    registrationFees: enrollmentFields?.registrationFees,
    annualFund: enrollmentFields?.annualFund,
    monthlyFees: enrollmentFields?.monthlyFees,
    transportFees: enrollmentFields?.transportFees,
    registrationPaid: enrollmentFields?.registrationPaid ?? false,
    annualFundPaid: enrollmentFields?.annualFundPaid ?? false,
    dueDayOfMonth: enrollmentFields?.dueDayOfMonth,
    lateFeeAmount: enrollmentFields?.lateFeeAmount,
    lateFeeFrequency: enrollmentFields?.lateFeeFrequency,
    personalDetails: student.fatherName || student.motherName ? {
      fatherName: student.fatherName,
      motherName: student.motherName,
      guardianPhone: student.guardianPhone,
      currentAddress: student.currentAddress,
      permanentAddress: student.permanentAddress,
      bloodGroup: student.bloodGroup,
      healthIssues: student.healthIssues,
    } : undefined,
  };

  queryClient.setQueryData(
    [QUERY_KEY, 'bySession', sessionId],
    (old: SessionStudentLike[] | undefined) => (old ? [...old, stub] : [stub])
  );

  queryClient.setQueriesData<{ pages: { data: SessionStudentLike[]; total: number }[] }>(
    { queryKey: [QUERY_KEY, 'infinite', sessionId], exact: false },
    (old) => {
      if (!old?.pages?.length) return old;
      const [first, ...rest] = old.pages;
      return {
        ...old,
        pages: [
          { ...first, data: [...(first.data ?? []), stub], total: (first.total ?? 0) + 1 },
          ...rest,
        ],
      };
    }
  );
}

/** Remove one student from session caches (bySession + infinite) without refetch. */
function removeStudentFromSessionCache(
  queryClient: QueryClient,
  sessionId: string,
  studentId: string
) {
  queryClient.setQueryData(
    [QUERY_KEY, 'bySession', sessionId],
    (old: SessionStudentLike[] | undefined) =>
      (old ? old.filter((s) => s.id !== studentId) : [])
  );

  queryClient.setQueriesData<{ pages: { data: SessionStudentLike[]; total: number }[] }>(
    { queryKey: [QUERY_KEY, 'infinite', sessionId], exact: false },
    (old) => {
      if (!old?.pages?.length) return old;
      const newPages = old.pages.map((p) => ({
        ...p,
        data: (p.data ?? []).filter((s) => s.id !== studentId),
      }));
      if (newPages[0]) {
        newPages[0] = {
          ...newPages[0],
          total: Math.max(0, (newPages[0].total ?? 0) - 1),
        };
      }
      return { ...old, pages: newPages };
    }
  );
}

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

/** Infinite list for Students list page: default 10 per page, 50 when filters applied. Search is sent to backend. */
export function useStudentsBySessionInfinite(
  sessionId: string,
  options?: { hasFilters?: boolean; search?: string }
) {
  const pageSize = options?.hasFilters ? FILTERED_PAGE_SIZE : DEFAULT_PAGE_SIZE;
  const filters: StudentFilters = {
    sessionId,
    search: options?.search?.trim() || undefined,
  };

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
    placeholderData: keepPreviousData,
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
    mutationFn: (payload: Omit<Student, 'id' | 'payments'> & { sessionId?: string }) =>
      studentsRepository.create(payload as Omit<Student, 'id' | 'payments'>),
    onSuccess: (data, payload) => {
      if (payload.sessionId) {
        const p = payload as Record<string, unknown>;
        const enrollmentFields: EnrollmentStubFields | undefined =
          (p.registrationFees !== undefined || p.monthlyFees !== undefined || p.classId !== undefined)
            ? {
                classId: p.classId as string | undefined,
                registrationFees: p.registrationFees as number | undefined,
                annualFund: p.annualFund as number | undefined,
                monthlyFees: p.monthlyFees as number | undefined,
                transportFees: p.transportFees as number | undefined,
                registrationPaid: (p.registrationPaid as boolean | undefined) ?? false,
                annualFundPaid: (p.annualFundPaid as boolean | undefined) ?? false,
                dueDayOfMonth: p.dueDayOfMonth as number | undefined,
                lateFeeAmount: p.lateFeeAmount as number | undefined,
                lateFeeFrequency: p.lateFeeFrequency as string | undefined,
              }
            : undefined;
        addStudentToSessionCache(queryClient, payload.sessionId, data, enrollmentFields);
      } else {
        invalidateSessionStudentList(queryClient, null);
      }
    },
  });
}

export function useCreateStudentsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (students: (Omit<Student, 'id' | 'payments'> & { sessionId?: string })[]) =>
      studentsRepository.createMany(students as Omit<Student, 'id' | 'payments'>[]).then(() => students[0]?.sessionId),
    onSuccess: (sessionId) => {
      invalidateSessionStudentList(queryClient, sessionId);
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
      sessionId,
    }: {
      id: string;
      updates: Partial<Omit<Student, 'id' | 'payments'>>;
      sessionId?: string;
    }) => studentsRepository.update(id, updates),
    onSuccess: (_, { id, sessionId }) => {
      invalidateSessionStudentList(queryClient, sessionId);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: string | { id: string; sessionId?: string }) => {
      const id = typeof payload === 'string' ? payload : payload.id;
      return studentsRepository.delete(id);
    },
    onSuccess: (_, payload) => {
      const id = typeof payload === 'string' ? payload : payload.id;
      const sessionId = typeof payload === 'string' ? undefined : payload.sessionId;
      if (sessionId) {
        removeStudentFromSessionCache(queryClient, sessionId, id);
      } else {
        invalidateSessionStudentList(queryClient, null);
      }
      queryClient.removeQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

export function useDeleteAllStudentsBySession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => studentsRepository.deleteAllBySession(sessionId),
    onSuccess: (_, sessionId) => {
      invalidateSessionStudentList(queryClient, sessionId);
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
    mutationFn: ({
      studentId,
      payment,
      enrollmentId,
      sessionId,
    }: {
      studentId: string;
      payment: Omit<FeePayment, 'id' | 'enrollmentId'>;
      enrollmentId?: string;
      sessionId?: string;
    }) => (studentsRepository as { addPayment: (id: string, p: typeof payment, enrollmentId?: string) => Promise<FeePayment> }).addPayment(studentId, payment, enrollmentId),
    onSuccess: (_, { studentId, sessionId }) => {
      invalidateSessionStudentList(queryClient, sessionId);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, studentId] });
    },
  });
}

export function useDeleteStudentPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      paymentId,
      enrollmentId,
      sessionId,
    }: {
      studentId: string;
      paymentId: string;
      enrollmentId?: string;
      sessionId?: string;
    }) => studentsRepository.deletePayment(studentId, paymentId, enrollmentId),
    onSuccess: (_, { studentId, sessionId }) => {
      invalidateSessionStudentList(queryClient, sessionId);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, studentId] });
    },
  });
}

// ============================================
// Enrollment Hooks
// ============================================

interface EnrollmentFilters {
  sessionId?: string;
  studentId?: string;
  classId?: string;
  search?: string;
}

export function useEnrollmentsBySession(sessionId: string) {
  return useQuery({
    queryKey: [ENROLLMENTS_QUERY_KEY, 'bySession', sessionId],
    queryFn: () => enrollmentsRepository.getBySession(sessionId),
    enabled: !!sessionId,
  });
}

export function useEnrollmentsByStudent(studentId: string) {
  return useQuery({
    queryKey: [ENROLLMENTS_QUERY_KEY, 'byStudent', studentId],
    queryFn: () => enrollmentsRepository.getByStudent(studentId),
    enabled: !!studentId,
  });
}

export function useEnrollment(id: string) {
  return useQuery({
    queryKey: [ENROLLMENTS_QUERY_KEY, id],
    queryFn: () => enrollmentsRepository.getById(id),
    enabled: !!id,
  });
}

export function useEnrollmentsBySessionInfinite(
  sessionId: string,
  options?: { hasFilters?: boolean }
) {
  const pageSize = options?.hasFilters ? FILTERED_PAGE_SIZE : DEFAULT_PAGE_SIZE;
  const filters: EnrollmentFilters = { sessionId };

  const q = useInfiniteQuery({
    queryKey: [ENROLLMENTS_QUERY_KEY, 'infinite', sessionId, pageSize, filters],
    queryFn: async ({ pageParam }) => {
      const result = await enrollmentsRepository.getPaginated(pageParam, pageSize, filters);
      return result;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: !!sessionId,
  });

  const enrollments = q.data?.pages.flatMap((p) => p.data) ?? [];
  const total = q.data?.pages[0]?.total ?? 0;
  return {
    enrollments,
    total,
    fetchNextPage: q.fetchNextPage,
    hasNextPage: q.hasNextPage,
    isFetchingNextPage: q.isFetchingNextPage,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
  };
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enrollment: Omit<StudentEnrollment, 'id' | 'payments' | 'student'>) => 
      enrollmentsRepository.create(enrollment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useCreateEnrollmentsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      studentIds: string[];
      sessionId: string;
      classId?: string;
      registrationFees?: number;
      annualFund?: number;
      monthlyFees?: number;
      transportFees?: number;
      dueDayOfMonth?: number;
      lateFeeAmount?: number;
      lateFeeFrequency?: string;
    }) => enrollmentsRepository.createBulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<StudentEnrollment> }) =>
      enrollmentsRepository.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => enrollmentsRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useAddEnrollmentPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ enrollmentId, payment }: { enrollmentId: string; payment: Omit<FeePayment, 'id' | 'enrollmentId'> }) =>
      enrollmentsRepository.addPayment(enrollmentId, payment),
    onSuccess: (_, { enrollmentId }) => {
      queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY, enrollmentId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteEnrollmentPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ enrollmentId, paymentId }: { enrollmentId: string; paymentId: string }) =>
      enrollmentsRepository.deletePayment(enrollmentId, paymentId),
    onSuccess: (_, { enrollmentId }) => {
      queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ENROLLMENTS_QUERY_KEY, enrollmentId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
