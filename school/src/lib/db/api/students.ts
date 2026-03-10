import type { Student, StudentEnrollment, FeePayment } from '../../../types';
import type { PaginatedResult } from '../repositories/schools';
import { teachingFetch, teachingFetchJson } from '../../api/client';

function mapPayment(p: Record<string, unknown>): FeePayment {
  return {
    id: String(p.id),
    enrollmentId: String(p.enrollment_id ?? ''),
    date: String(p.date ?? ''),
    amount: Number(p.amount ?? 0),
    method: (p.method as FeePayment['method']) ?? 'Cash',
    receiptNumber: String(p.receipt_number ?? ''),
    feeCategory: (p.fee_category as FeePayment['feeCategory']) ?? 'other',
    month: p.month != null ? String(p.month) : undefined,
    receiptPhotoUrl: p.receipt_photo_url != null ? String(p.receipt_photo_url) : undefined,
  };
}

function mapStudent(r: Record<string, unknown>): Student {
  return {
    id: String(r.id),
    schoolId: String(r.school_id ?? ''),
    name: String(r.name ?? ''),
    studentId: String(r.student_id ?? ''),
    feeType: (r.fee_type as Student['feeType']) ?? 'Regular',
    fatherName: r.father_name != null ? String(r.father_name) : undefined,
    motherName: r.mother_name != null ? String(r.mother_name) : undefined,
    guardianPhone: r.guardian_phone != null ? String(r.guardian_phone) : undefined,
    currentAddress: r.current_address != null ? String(r.current_address) : undefined,
    permanentAddress: r.permanent_address != null ? String(r.permanent_address) : undefined,
    bloodGroup: (r.blood_group as Student['bloodGroup']) ?? undefined,
    healthIssues: r.health_issues != null ? String(r.health_issues) : undefined,
    photoUrl: r.photo_url != null ? String(r.photo_url) : undefined,
    siblingId: r.sibling_id != null ? String(r.sibling_id) : undefined,
  };
}

function mapEnrollment(r: Record<string, unknown>): StudentEnrollment {
  const paymentsRaw = r.payments;
  const payments: FeePayment[] = Array.isArray(paymentsRaw)
    ? paymentsRaw.map((p) => mapPayment(p as Record<string, unknown>))
    : [];
  
  const studentRaw = r.student;
  const student = studentRaw ? mapStudent(studentRaw as Record<string, unknown>) : undefined;
  
  return {
    id: String(r.id),
    studentId: String(r.student_id ?? ''),
    sessionId: String(r.session_id ?? ''),
    classId: r.class_id != null ? String(r.class_id) : undefined,
    registrationFees: r.registration_fees != null ? Number(r.registration_fees) : undefined,
    annualFund: r.annual_fund != null ? Number(r.annual_fund) : undefined,
    monthlyFees: r.monthly_fees != null ? Number(r.monthly_fees) : undefined,
    transportFees: r.transport_fees != null ? Number(r.transport_fees) : undefined,
    registrationPaid: r.registration_paid as boolean | undefined,
    annualFundPaid: r.annual_fund_paid as boolean | undefined,
    dueDayOfMonth: r.due_day_of_month != null ? Number(r.due_day_of_month) : undefined,
    lateFeeAmount: r.late_fee_amount != null ? Number(r.late_fee_amount) : undefined,
    lateFeeFrequency: r.late_fee_frequency as StudentEnrollment['lateFeeFrequency'] | undefined,
    payments,
    student,
  };
}

const LARGE_PAGE_SIZE = 10000;

interface PaginatedApiResponse {
  items: Record<string, unknown>[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ============================================
// Students API (Identity)
// ============================================
export const studentsRepositoryApi = {
  async getAll(): Promise<Student[]> {
    const res = await teachingFetchJson<PaginatedApiResponse>(`/students?limit=${LARGE_PAGE_SIZE}&offset=0`);
    const list = res?.items ?? [];
    return Array.isArray(list) ? list.map(mapStudent) : [];
  },

  async getById(id: string): Promise<Student | null> {
    try {
      const r = await teachingFetchJson<Record<string, unknown>>(`/students/${id}`);
      return mapStudent(r);
    } catch {
      return null;
    }
  },

  async create(data: Omit<Student, 'id'>): Promise<Student> {
    const body = {
      school_id: data.schoolId,
      name: data.name,
      student_id: data.studentId,
      fee_type: data.feeType,
      father_name: data.fatherName ?? null,
      mother_name: data.motherName ?? null,
      guardian_phone: data.guardianPhone ?? null,
      current_address: data.currentAddress ?? null,
      permanent_address: data.permanentAddress ?? null,
      blood_group: data.bloodGroup ?? null,
      health_issues: data.healthIssues ?? null,
      photo_url: data.photoUrl ?? null,
      sibling_id: data.siblingId ?? null,
    };
    const r = await teachingFetchJson<Record<string, unknown>>('/students', { method: 'POST', body: JSON.stringify(body) });
    return mapStudent(r);
  },

  async update(id: string, updates: Partial<Student>): Promise<Student> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.studentId !== undefined) body.student_id = updates.studentId;
    if (updates.feeType !== undefined) body.fee_type = updates.feeType;
    if (updates.fatherName !== undefined) body.father_name = updates.fatherName;
    if (updates.motherName !== undefined) body.mother_name = updates.motherName;
    if (updates.guardianPhone !== undefined) body.guardian_phone = updates.guardianPhone;
    if (updates.currentAddress !== undefined) body.current_address = updates.currentAddress;
    if (updates.permanentAddress !== undefined) body.permanent_address = updates.permanentAddress;
    if (updates.bloodGroup !== undefined) body.blood_group = updates.bloodGroup;
    if (updates.healthIssues !== undefined) body.health_issues = updates.healthIssues;
    if (updates.photoUrl !== undefined) body.photo_url = updates.photoUrl;
    if (updates.siblingId !== undefined) body.sibling_id = updates.siblingId;
    const r = await teachingFetchJson<Record<string, unknown>>(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    return mapStudent(r);
  },

  async delete(id: string): Promise<void> {
    await teachingFetch(`/students/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// Enrollments API (Session-specific)
// ============================================
export const enrollmentsRepositoryApi = {
  async getBySession(sessionId: string): Promise<StudentEnrollment[]> {
    const res = await teachingFetchJson<PaginatedApiResponse>(
      `/students/enrollments?session_id=${sessionId}&limit=${LARGE_PAGE_SIZE}&offset=0`
    );
    const list = res?.items ?? [];
    return Array.isArray(list) ? list.map(mapEnrollment) : [];
  },

  async getByStudent(studentId: string): Promise<StudentEnrollment[]> {
    const res = await teachingFetchJson<PaginatedApiResponse>(
      `/students/enrollments?student_id=${studentId}&limit=${LARGE_PAGE_SIZE}&offset=0`
    );
    const list = res?.items ?? [];
    return Array.isArray(list) ? list.map(mapEnrollment) : [];
  },

  async getById(id: string): Promise<StudentEnrollment | null> {
    try {
      const r = await teachingFetchJson<Record<string, unknown>>(`/students/enrollments/${id}`);
      return mapEnrollment(r);
    } catch {
      return null;
    }
  },

  async create(data: Omit<StudentEnrollment, 'id' | 'payments' | 'student'>): Promise<StudentEnrollment> {
    const body = {
      student_id: data.studentId,
      session_id: data.sessionId,
      class_id: data.classId ?? null,
      registration_fees: data.registrationFees ?? null,
      annual_fund: data.annualFund ?? null,
      monthly_fees: data.monthlyFees ?? null,
      transport_fees: data.transportFees ?? null,
      registration_paid: data.registrationPaid ?? false,
      annual_fund_paid: data.annualFundPaid ?? false,
      due_day_of_month: data.dueDayOfMonth ?? null,
      late_fee_amount: data.lateFeeAmount ?? null,
      late_fee_frequency: data.lateFeeFrequency ?? null,
    };
    const r = await teachingFetchJson<Record<string, unknown>>('/students/enroll', { method: 'POST', body: JSON.stringify(body) });
    return mapEnrollment(r);
  },

  async createBulk(data: {
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
  }): Promise<StudentEnrollment[]> {
    const body = {
      student_ids: data.studentIds,
      session_id: data.sessionId,
      class_id: data.classId ?? null,
      registration_fees: data.registrationFees ?? null,
      annual_fund: data.annualFund ?? null,
      monthly_fees: data.monthlyFees ?? null,
      transport_fees: data.transportFees ?? null,
      due_day_of_month: data.dueDayOfMonth ?? null,
      late_fee_amount: data.lateFeeAmount ?? null,
      late_fee_frequency: data.lateFeeFrequency ?? null,
    };
    const res = await teachingFetchJson<{ enrolled: number; enrollments: Record<string, unknown>[] }>(
      '/students/enroll-bulk',
      { method: 'POST', body: JSON.stringify(body) }
    );
    const list = res?.enrollments ?? [];
    return Array.isArray(list) ? list.map(mapEnrollment) : [];
  },

  async update(id: string, updates: Partial<StudentEnrollment>): Promise<StudentEnrollment> {
    const body: Record<string, unknown> = {};
    if (updates.classId !== undefined) body.class_id = updates.classId;
    if (updates.registrationFees !== undefined) body.registration_fees = updates.registrationFees;
    if (updates.annualFund !== undefined) body.annual_fund = updates.annualFund;
    if (updates.monthlyFees !== undefined) body.monthly_fees = updates.monthlyFees;
    if (updates.transportFees !== undefined) body.transport_fees = updates.transportFees;
    if (updates.registrationPaid !== undefined) body.registration_paid = updates.registrationPaid;
    if (updates.annualFundPaid !== undefined) body.annual_fund_paid = updates.annualFundPaid;
    if (updates.dueDayOfMonth !== undefined) body.due_day_of_month = updates.dueDayOfMonth;
    if (updates.lateFeeAmount !== undefined) body.late_fee_amount = updates.lateFeeAmount;
    if (updates.lateFeeFrequency !== undefined) body.late_fee_frequency = updates.lateFeeFrequency;
    const r = await teachingFetchJson<Record<string, unknown>>(`/students/enrollments/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    return mapEnrollment(r);
  },

  async delete(id: string): Promise<void> {
    await teachingFetch(`/students/enrollments/${id}`, { method: 'DELETE' });
  },

  async addPayment(
    enrollmentId: string,
    payment: { date: string; amount: number; method: string; receiptNumber: string; feeCategory: string; month?: string; receiptPhotoUrl?: string }
  ): Promise<FeePayment> {
    const body = {
      date: payment.date,
      amount: payment.amount,
      method: payment.method,
      receipt_number: payment.receiptNumber ?? null,
      fee_category: payment.feeCategory,
      month: payment.month ?? null,
      receipt_photo_url: payment.receiptPhotoUrl ?? null,
    };
    const r = await teachingFetchJson<Record<string, unknown>>(`/students/enrollments/${enrollmentId}/payments`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapPayment(r);
  },

  async deletePayment(enrollmentId: string, paymentId: string): Promise<void> {
    await teachingFetch(`/students/enrollments/${enrollmentId}/payments/${paymentId}`, { method: 'DELETE' });
  },

  async getPaginated(
    page: number = 1,
    pageSize: number = 10,
    filters?: { sessionId?: string; studentId?: string; classId?: string; search?: string }
  ): Promise<PaginatedResult<StudentEnrollment>> {
    const hasFilters = !!(filters?.classId ?? filters?.search);
    const offset = (page - 1) * pageSize;
    const params = new URLSearchParams();
    if (filters?.sessionId) params.set('session_id', filters.sessionId);
    if (filters?.studentId) params.set('student_id', filters.studentId);
    params.set('limit', String(pageSize));
    params.set('offset', String(offset));
    params.set('has_filters', String(hasFilters));
    const res = await teachingFetchJson<PaginatedApiResponse>(`/students/enrollments?${params.toString()}`);
    const items = res?.items ?? [];
    const total = res?.total ?? 0;
    return {
      data: Array.isArray(items) ? items.map(mapEnrollment) : [],
      total,
      page,
      pageSize,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    };
  },
};
