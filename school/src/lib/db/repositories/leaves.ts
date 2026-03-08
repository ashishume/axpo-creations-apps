import { getSupabase } from '../supabase';
import type { LeaveType, LeaveBalance, LeaveRequest } from '../../types';

function mapLeaveType(row: Record<string, unknown>): LeaveType {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    name: row.name as string,
    code: row.code as string,
    applicableTo: (row.applicable_to as LeaveType['applicableTo']) ?? 'both',
    maxDaysPerYear: row.max_days_per_year != null ? Number(row.max_days_per_year) : undefined,
    requiresDocument: Boolean(row.requires_document),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

function mapLeaveBalance(row: Record<string, unknown>, leaveType?: LeaveType): LeaveBalance {
  return {
    id: row.id as string,
    staffId: row.staff_id as string,
    leaveTypeId: row.leave_type_id as string,
    leaveType,
    year: row.year as string,
    totalDays: Number(row.total_days ?? 0),
    usedDays: Number(row.used_days ?? 0),
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

function mapLeaveRequest(row: Record<string, unknown>, leaveType?: LeaveType): LeaveRequest {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    leaveTypeId: row.leave_type_id != null ? (row.leave_type_id as string) : undefined,
    leaveType,
    applicantType: (row.applicant_type as LeaveRequest['applicantType']) ?? 'staff',
    staffId: row.staff_id != null ? (row.staff_id as string) : undefined,
    studentId: row.student_id != null ? (row.student_id as string) : undefined,
    fromDate: String(row.from_date ?? ''),
    toDate: String(row.to_date ?? ''),
    daysCount: Number(row.days_count ?? 0),
    reason: String(row.reason ?? ''),
    documentUrl: row.document_url != null ? (row.document_url as string) : undefined,
    status: (row.status as LeaveRequest['status']) ?? 'pending',
    appliedAt: String(row.applied_at ?? ''),
    reviewedBy: row.reviewed_by != null ? (row.reviewed_by as string) : undefined,
    reviewedAt: row.reviewed_at != null ? (row.reviewed_at as string) : undefined,
    reviewerRemarks: row.reviewer_remarks != null ? (row.reviewer_remarks as string) : undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export const leavesRepositorySupabase = {
  async getLeaveTypes(sessionId: string, applicableTo?: string): Promise<LeaveType[]> {
    const supabase = getSupabase();
    let q = supabase
      .from('school_xx_leave_types')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .order('name');
    if (applicableTo) {
      q = q.or(`applicable_to.eq.${applicableTo},applicable_to.eq.both`);
    }
    const { data, error } = await q;
    if (error) throw new Error('Failed to fetch leave types');
    return (data || []).map(mapLeaveType);
  },

  async createLeaveType(data: Omit<LeaveType, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeaveType> {
    const supabase = getSupabase();
    const { data: row, error } = await supabase
      .from('school_xx_leave_types')
      .insert({
        session_id: data.sessionId,
        name: data.name,
        code: data.code,
        applicable_to: data.applicableTo,
        max_days_per_year: data.maxDaysPerYear ?? null,
        requires_document: data.requiresDocument ?? false,
        is_active: data.isActive ?? true,
      })
      .select('*')
      .single();
    if (error) throw new Error('Failed to create leave type');
    return mapLeaveType(row);
  },

  async updateLeaveType(id: string, data: Partial<LeaveType>): Promise<LeaveType> {
    const supabase = getSupabase();
    const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) body.name = data.name;
    if (data.code !== undefined) body.code = data.code;
    if (data.applicableTo !== undefined) body.applicable_to = data.applicableTo;
    if (data.maxDaysPerYear !== undefined) body.max_days_per_year = data.maxDaysPerYear;
    if (data.requiresDocument !== undefined) body.requires_document = data.requiresDocument;
    if (data.isActive !== undefined) body.is_active = data.isActive;
    const { data: row, error } = await supabase
      .from('school_xx_leave_types')
      .update(body)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error('Failed to update leave type');
    return mapLeaveType(row);
  },

  async deleteLeaveType(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase.from('school_xx_leave_types').delete().eq('id', id);
    if (error) throw new Error('Failed to delete leave type');
  },

  async getLeaveRequests(
    sessionId: string,
    filters?: { status?: string; applicantType?: string; staffId?: string; studentId?: string }
  ): Promise<LeaveRequest[]> {
    const supabase = getSupabase();
    let q = supabase
      .from('school_xx_leave_requests')
      .select('*')
      .eq('session_id', sessionId)
      .order('applied_at', { ascending: false });
    if (filters?.status) q = q.eq('status', filters.status);
    if (filters?.applicantType) q = q.eq('applicant_type', filters.applicantType);
    if (filters?.staffId) q = q.eq('staff_id', filters.staffId);
    if (filters?.studentId) q = q.eq('student_id', filters.studentId);
    const { data, error } = await q;
    if (error) throw new Error('Failed to fetch leave requests');
    const typeIds = [...new Set((data || []).map((r: Record<string, unknown>) => r.leave_type_id).filter(Boolean))];
    const typesMap: Record<string, LeaveType> = {};
    if (typeIds.length > 0) {
      const { data: types } = await supabase
        .from('school_xx_leave_types')
        .select('*')
        .in('id', typeIds);
      (types || []).forEach((t: Record<string, unknown>) => {
        typesMap[t.id as string] = mapLeaveType(t);
      });
    }
    return (data || []).map((r: Record<string, unknown>) =>
      mapLeaveRequest(r, r.leave_type_id ? typesMap[r.leave_type_id as string] : undefined)
    );
  },

  async getLeaveRequest(id: string): Promise<LeaveRequest | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_leave_requests')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    let leaveType: LeaveType | undefined;
    if (data.leave_type_id) {
      const { data: lt } = await supabase
        .from('school_xx_leave_types')
        .select('*')
        .eq('id', data.leave_type_id)
        .single();
      if (lt) leaveType = mapLeaveType(lt);
    }
    return mapLeaveRequest(data, leaveType);
  },

  async applyLeave(data: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt' | 'reviewedBy' | 'reviewedAt' | 'reviewerRemarks' | 'createdAt' | 'updatedAt'>): Promise<LeaveRequest> {
    const supabase = getSupabase();
    const daysCount = data.daysCount;
    const { data: row, error } = await supabase
      .from('school_xx_leave_requests')
      .insert({
        session_id: data.sessionId,
        leave_type_id: data.leaveTypeId ?? null,
        applicant_type: data.applicantType,
        staff_id: data.staffId ?? null,
        student_id: data.studentId ?? null,
        from_date: data.fromDate,
        to_date: data.toDate,
        days_count: daysCount,
        reason: data.reason,
        document_url: data.documentUrl ?? null,
        status: 'pending',
      })
      .select('*')
      .single();
    if (error) throw new Error('Failed to apply for leave');
    let leaveType: LeaveType | undefined;
    if (row.leave_type_id) {
      const { data: lt } = await supabase
        .from('school_xx_leave_types')
        .select('*')
        .eq('id', row.leave_type_id)
        .single();
      if (lt) leaveType = mapLeaveType(lt);
    }
    return mapLeaveRequest(row, leaveType);
  },

  async approveLeave(id: string, remarks?: string, reviewedBy?: string): Promise<LeaveRequest> {
    const supabase = getSupabase();
    const { data: req, error: fetchErr } = await supabase
      .from('school_xx_leave_requests')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchErr || !req) throw new Error('Leave request not found');
    const { data: row, error } = await supabase
      .from('school_xx_leave_requests')
      .update({
        status: 'approved',
        reviewed_by: reviewedBy ?? null,
        reviewed_at: new Date().toISOString(),
        reviewer_remarks: remarks ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error('Failed to approve leave');
    if (req.staff_id && req.leave_type_id && req.session_id) {
      const { data: session } = await supabase
        .from('school_xx_sessions')
        .select('year')
        .eq('id', req.session_id)
        .single();
      const year = session?.year as string | undefined;
      if (year) {
        const { data: bal } = await supabase
          .from('school_xx_leave_balances')
          .select('id, used_days')
          .eq('staff_id', req.staff_id)
          .eq('leave_type_id', req.leave_type_id)
          .eq('year', year)
          .single();
        if (bal) {
          await supabase
            .from('school_xx_leave_balances')
            .update({
              used_days: Number(bal.used_days ?? 0) + Number(req.days_count ?? 0),
              updated_at: new Date().toISOString(),
            })
            .eq('id', bal.id);
        }
      }
    }
    return mapLeaveRequest(row);
  },

  async rejectLeave(id: string, remarks: string, reviewedBy?: string): Promise<LeaveRequest> {
    const supabase = getSupabase();
    const { data: row, error } = await supabase
      .from('school_xx_leave_requests')
      .update({
        status: 'rejected',
        reviewed_by: reviewedBy ?? null,
        reviewed_at: new Date().toISOString(),
        reviewer_remarks: remarks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error('Failed to reject leave');
    return mapLeaveRequest(row);
  },

  async cancelLeave(id: string): Promise<LeaveRequest> {
    const supabase = getSupabase();
    const { data: row, error } = await supabase
      .from('school_xx_leave_requests')
      .update({
        status: 'cancelled',
        reviewed_by: null,
        reviewed_at: null,
        reviewer_remarks: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error('Failed to cancel leave');
    return mapLeaveRequest(row);
  },

  async getLeaveBalances(staffId: string, year?: string): Promise<LeaveBalance[]> {
    const supabase = getSupabase();
    let q = supabase
      .from('school_xx_leave_balances')
      .select('*')
      .eq('staff_id', staffId)
      .order('year', { ascending: false });
    if (year) q = q.eq('year', year);
    const { data, error } = await q;
    if (error) throw new Error('Failed to fetch leave balances');
    const typeIds = [...new Set((data || []).map((r: Record<string, unknown>) => r.leave_type_id))];
    const typesMap: Record<string, LeaveType> = {};
    if (typeIds.length > 0) {
      const { data: types } = await supabase
        .from('school_xx_leave_types')
        .select('*')
        .in('id', typeIds);
      (types || []).forEach((t: Record<string, unknown>) => {
        typesMap[t.id as string] = mapLeaveType(t);
      });
    }
    return (data || []).map((r: Record<string, unknown>) =>
      mapLeaveBalance(r, typesMap[r.leave_type_id as string])
    );
  },

  async initializeBalances(staffId: string, sessionId: string, year: string): Promise<LeaveBalance[]> {
    const types = await this.getLeaveTypes(sessionId, 'staff');
    const supabase = getSupabase();
    const results: LeaveBalance[] = [];
    for (const lt of types) {
      const { data: existing } = await supabase
        .from('school_xx_leave_balances')
        .select('id')
        .eq('staff_id', staffId)
        .eq('leave_type_id', lt.id)
        .eq('year', year)
        .single();
      if (existing) continue;
      const { data: row, error } = await supabase
        .from('school_xx_leave_balances')
        .insert({
          staff_id: staffId,
          leave_type_id: lt.id,
          year,
          total_days: lt.maxDaysPerYear ?? 0,
          used_days: 0,
        })
        .select('*')
        .single();
      if (!error && row) results.push(mapLeaveBalance(row, lt));
    }
    return results;
  },
};
