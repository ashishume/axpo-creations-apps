import type { LeaveType, LeaveBalance, LeaveRequest } from '../../../types';
import { teachingFetch, teachingFetchJson } from '../../api/client';

function mapLeaveType(r: Record<string, unknown>): LeaveType {
  const maxDaysByRole = r.max_days_by_role as Record<string, number> | null | undefined;
  return {
    id: String(r.id),
    sessionId: String(r.session_id ?? ''),
    name: String(r.name ?? ''),
    code: String(r.code ?? ''),
    applicableTo: (r.applicable_to as LeaveType['applicableTo']) ?? 'both',
    maxDaysPerYear: r.max_days_per_year != null ? Number(r.max_days_per_year) : undefined,
    maxDaysByRole:
      maxDaysByRole && typeof maxDaysByRole === 'object' && !Array.isArray(maxDaysByRole)
        ? (Object.fromEntries(
            Object.entries(maxDaysByRole).filter(
              ([, v]) => typeof v === 'number' && Number.isInteger(v)
            )
          ) as Record<string, number>)
        : undefined,
    requiresDocument: Boolean(r.requires_document),
    isActive: Boolean(r.is_active),
    createdAt: r.created_at != null ? String(r.created_at) : undefined,
    updatedAt: r.updated_at != null ? String(r.updated_at) : undefined,
  };
}

function mapLeaveBalance(r: Record<string, unknown>): LeaveBalance {
  const leaveType = r.leave_type as Record<string, unknown> | undefined;
  return {
    id: String(r.id),
    staffId: String(r.staff_id ?? ''),
    leaveTypeId: String(r.leave_type_id ?? ''),
    leaveType: leaveType ? mapLeaveType(leaveType) : undefined,
    year: String(r.year ?? ''),
    totalDays: Number(r.total_days ?? 0),
    usedDays: Number(r.used_days ?? 0),
    createdAt: r.created_at != null ? String(r.created_at) : undefined,
    updatedAt: r.updated_at != null ? String(r.updated_at) : undefined,
  };
}

function mapLeaveRequest(r: Record<string, unknown>): LeaveRequest {
  const leaveType = r.leave_type as Record<string, unknown> | undefined;
  return {
    id: String(r.id),
    sessionId: String(r.session_id ?? ''),
    leaveTypeId: r.leave_type_id != null ? String(r.leave_type_id) : undefined,
    leaveType: leaveType ? mapLeaveType(leaveType) : undefined,
    applicantType: (r.applicant_type as LeaveRequest['applicantType']) ?? 'staff',
    staffId: r.staff_id != null ? String(r.staff_id) : undefined,
    studentId: r.student_id != null ? String(r.student_id) : undefined,
    fromDate: String(r.from_date ?? ''),
    toDate: String(r.to_date ?? ''),
    daysCount: Number(r.days_count ?? 0),
    reason: String(r.reason ?? ''),
    documentUrl: r.document_url != null ? String(r.document_url) : undefined,
    status: (r.status as LeaveRequest['status']) ?? 'pending',
    appliedAt: String(r.applied_at ?? ''),
    reviewedBy: r.reviewed_by != null ? String(r.reviewed_by) : undefined,
    reviewedAt: r.reviewed_at != null ? String(r.reviewed_at) : undefined,
    reviewerRemarks: r.reviewer_remarks != null ? String(r.reviewer_remarks) : undefined,
    createdAt: r.created_at != null ? String(r.created_at) : undefined,
    updatedAt: r.updated_at != null ? String(r.updated_at) : undefined,
  };
}

export const leavesRepositoryApi = {
  async getLeaveTypes(sessionId: string, applicableTo?: string): Promise<LeaveType[]> {
    let path = `/leaves/leave-types?session_id=${sessionId}`;
    if (applicableTo) path += `&applicable_to=${encodeURIComponent(applicableTo)}`;
    const list = await teachingFetchJson<Record<string, unknown>[]>(path);
    return Array.isArray(list) ? list.map(mapLeaveType) : [];
  },

  async createLeaveType(data: Omit<LeaveType, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeaveType> {
    const body = {
      session_id: data.sessionId,
      name: data.name,
      code: data.code,
      applicable_to: data.applicableTo,
      max_days_per_year: data.maxDaysPerYear ?? null,
      max_days_by_role: data.maxDaysByRole ?? null,
      requires_document: data.requiresDocument ?? false,
      is_active: data.isActive ?? true,
    };
    const r = await teachingFetchJson<Record<string, unknown>>('/leaves/leave-types', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapLeaveType(r);
  },

  async updateLeaveType(id: string, data: Partial<LeaveType>): Promise<LeaveType> {
    const body: Record<string, unknown> = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.code !== undefined) body.code = data.code;
    if (data.applicableTo !== undefined) body.applicable_to = data.applicableTo;
    if (data.maxDaysPerYear !== undefined) body.max_days_per_year = data.maxDaysPerYear;
    if (data.maxDaysByRole !== undefined) body.max_days_by_role = data.maxDaysByRole;
    if (data.requiresDocument !== undefined) body.requires_document = data.requiresDocument;
    if (data.isActive !== undefined) body.is_active = data.isActive;
    const r = await teachingFetchJson<Record<string, unknown>>(`/leaves/leave-types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return mapLeaveType(r);
  },

  async deleteLeaveType(id: string): Promise<void> {
    await teachingFetch(`/leaves/leave-types/${id}`, { method: 'DELETE' });
  },

  async getLeaveRequests(
    sessionId: string,
    filters?: { status?: string; applicantType?: string; staffId?: string; studentId?: string }
  ): Promise<LeaveRequest[]> {
    const limit = 10000;
    const params = new URLSearchParams({ session_id: sessionId, limit: String(limit), offset: '0' });
    if (filters?.status) params.set('status', filters.status);
    if (filters?.applicantType) params.set('applicant_type', filters.applicantType);
    if (filters?.staffId) params.set('staff_id', filters.staffId);
    if (filters?.studentId) params.set('student_id', filters.studentId);
    const res = await teachingFetchJson<{ items: Record<string, unknown>[] }>(`/leaves/leave-requests?${params.toString()}`);
    const list = res?.items ?? [];
    return Array.isArray(list) ? list.map(mapLeaveRequest) : [];
  },

  async getLeaveRequestsPaginated(
    sessionId: string,
    page: number = 1,
    pageSize: number = 50,
    filters?: { status?: string; applicantType?: string; staffId?: string; studentId?: string }
  ): Promise<{ data: LeaveRequest[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const offset = (page - 1) * pageSize;
    const params = new URLSearchParams({ session_id: sessionId, limit: String(pageSize), offset: String(offset) });
    if (filters?.status) params.set('status', filters.status);
    if (filters?.applicantType) params.set('applicant_type', filters.applicantType);
    if (filters?.staffId) params.set('staff_id', filters.staffId);
    if (filters?.studentId) params.set('student_id', filters.studentId);
    const res = await teachingFetchJson<{ items: Record<string, unknown>[]; total: number }>(`/leaves/leave-requests?${params.toString()}`);
    const items = res?.items ?? [];
    const total = res?.total ?? 0;
    return {
      data: Array.isArray(items) ? items.map(mapLeaveRequest) : [],
      total,
      page,
      pageSize,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    };
  },

  async getLeaveRequest(id: string): Promise<LeaveRequest | null> {
    try {
      const r = await teachingFetchJson<Record<string, unknown>>(`/leaves/leave-requests/${id}`);
      return mapLeaveRequest(r);
    } catch {
      return null;
    }
  },

  async applyLeave(data: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt' | 'reviewedBy' | 'reviewedAt' | 'reviewerRemarks' | 'createdAt' | 'updatedAt'>): Promise<LeaveRequest> {
    const body = {
      session_id: data.sessionId,
      leave_type_id: data.leaveTypeId ?? null,
      applicant_type: data.applicantType,
      staff_id: data.staffId ?? null,
      student_id: data.studentId ?? null,
      from_date: data.fromDate,
      to_date: data.toDate,
      days_count: data.daysCount,
      reason: data.reason,
      document_url: data.documentUrl ?? null,
    };
    const r = await teachingFetchJson<Record<string, unknown>>('/leaves/leave-requests', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapLeaveRequest(r);
  },

  async approveLeave(id: string, remarks?: string, _reviewedBy?: string): Promise<LeaveRequest> {
    const r = await teachingFetchJson<Record<string, unknown>>(`/leaves/leave-requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(remarks != null ? { remarks } : {}),
    });
    return mapLeaveRequest(r);
  },

  async rejectLeave(id: string, remarks: string, _reviewedBy?: string): Promise<LeaveRequest> {
    const r = await teachingFetchJson<Record<string, unknown>>(`/leaves/leave-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
    return mapLeaveRequest(r);
  },

  async cancelLeave(id: string): Promise<LeaveRequest> {
    const r = await teachingFetchJson<Record<string, unknown>>(`/leaves/leave-requests/${id}/cancel`, {
      method: 'POST',
    });
    return mapLeaveRequest(r);
  },

  async getLeaveBalances(staffId: string, year?: string): Promise<LeaveBalance[]> {
    let path = `/leaves/leave-balances?staff_id=${staffId}`;
    if (year) path += `&year=${encodeURIComponent(year)}`;
    const list = await teachingFetchJson<Record<string, unknown>[]>(path);
    return Array.isArray(list) ? list.map(mapLeaveBalance) : [];
  },

  async initializeBalances(staffId: string, sessionId: string, year: string): Promise<LeaveBalance[]> {
    const path = `/leaves/leave-balances/initialize?staff_id=${staffId}&session_id=${sessionId}&year=${encodeURIComponent(year)}`;
    const list = await teachingFetchJson<Record<string, unknown>[]>(path, { method: 'POST' });
    return Array.isArray(list) ? list.map(mapLeaveBalance) : [];
  },
};
