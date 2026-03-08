import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leavesRepository } from '../lib/db/repositories';
import type { LeaveType, LeaveBalance, LeaveRequest } from '../types';

const QUERY_KEY_LEAVE_TYPES = 'leaveTypes';
const QUERY_KEY_LEAVE_REQUESTS = 'leaveRequests';
const QUERY_KEY_LEAVE_BALANCES = 'leaveBalances';

export function useLeaveTypes(sessionId: string, applicableTo?: string) {
  return useQuery({
    queryKey: [QUERY_KEY_LEAVE_TYPES, sessionId, applicableTo],
    queryFn: () => leavesRepository.getLeaveTypes(sessionId, applicableTo),
    enabled: !!sessionId,
  });
}

export function useLeaveRequests(
  sessionId: string,
  filters?: { status?: string; applicantType?: string; staffId?: string; studentId?: string }
) {
  return useQuery({
    queryKey: [QUERY_KEY_LEAVE_REQUESTS, sessionId, filters],
    queryFn: () => leavesRepository.getLeaveRequests(sessionId, filters),
    enabled: !!sessionId,
  });
}

export function useLeaveRequest(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY_LEAVE_REQUESTS, id],
    queryFn: () => leavesRepository.getLeaveRequest(id),
    enabled: !!id,
  });
}

export function useLeaveBalances(staffId: string, year?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [QUERY_KEY_LEAVE_BALANCES, staffId, year],
    queryFn: () => leavesRepository.getLeaveBalances(staffId, year),
    enabled: options?.enabled !== false && !!staffId,
  });
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<LeaveType, 'id' | 'createdAt' | 'updatedAt'>) =>
      leavesRepository.createLeaveType(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_TYPES, variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_TYPES] });
    },
  });
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeaveType> }) =>
      leavesRepository.updateLeaveType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_TYPES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_REQUESTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_BALANCES] });
    },
  });
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leavesRepository.deleteLeaveType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_TYPES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_REQUESTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_BALANCES] });
    },
  });
}

type ApplyLeaveData = Omit<
  LeaveRequest,
  'id' | 'status' | 'appliedAt' | 'reviewedBy' | 'reviewedAt' | 'reviewerRemarks' | 'createdAt' | 'updatedAt'
>;

export function useApplyLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplyLeaveData) => leavesRepository.applyLeave(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_REQUESTS, variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_REQUESTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_BALANCES] });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      remarks,
      reviewedBy,
    }: {
      id: string;
      remarks?: string;
      reviewedBy?: string;
    }) => leavesRepository.approveLeave(id, remarks, reviewedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_REQUESTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_BALANCES] });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      remarks,
      reviewedBy,
    }: {
      id: string;
      remarks: string;
      reviewedBy?: string;
    }) => leavesRepository.rejectLeave(id, remarks, reviewedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_REQUESTS] });
    },
  });
}

export function useCancelLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leavesRepository.cancelLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_REQUESTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_BALANCES] });
    },
  });
}

export function useInitializeLeaveBalances() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      staffId,
      sessionId,
      year,
    }: {
      staffId: string;
      sessionId: string;
      year: string;
    }) => leavesRepository.initializeBalances(staffId, sessionId, year),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY_LEAVE_BALANCES, variables.staffId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_LEAVE_BALANCES] });
    },
  });
}
