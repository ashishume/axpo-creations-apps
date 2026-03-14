import type { Student, StudentEnrollment, FeePayment } from '../../../types';
import type { PaginatedResult } from '../repositories/schools';
import { teachingFetch, teachingFetchJson } from '../../api/client';
import { fetchAllPages } from '../../api/pagination';

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
    admissionNumber: r.admission_number != null ? String(r.admission_number) : undefined,
    feeType: (r.fee_type as Student['feeType']) ?? 'Regular',
    fatherName: r.father_name != null ? String(r.father_name) : undefined,
    motherName: r.mother_name != null ? String(r.mother_name) : undefined,
    guardianPhone: r.guardian_phone != null ? String(r.guardian_phone) : undefined,
    currentAddress: r.current_address != null ? String(r.current_address) : undefined,
    permanentAddress: r.permanent_address != null ? String(r.permanent_address) : undefined,
    bloodGroup: (r.blood_group as Student['bloodGroup']) ?? undefined,
    healthIssues: r.health_issues != null ? String(r.health_issues) : undefined,
    aadhaarNumber: r.aadhaar_number != null ? String(r.aadhaar_number) : undefined,
    dateOfBirth: r.date_of_birth != null ? String(r.date_of_birth) : undefined,
    photoUrl: r.photo_url != null ? String(r.photo_url) : undefined,
    siblingId: r.sibling_id != null ? String(r.sibling_id) : undefined,
    hasSiblingDiscount: r.has_sibling_discount as boolean | undefined,
    isFrozen: r.is_frozen as boolean | undefined,
    frozenAt: r.frozen_at != null ? String(r.frozen_at) : undefined,
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
    targetAmount: r.target_amount != null ? Number(r.target_amount) : undefined,
    finePerDay: r.fine_per_day != null ? Number(r.fine_per_day) : undefined,
    dueFrequency: r.due_frequency as 'monthly' | 'quarterly' | undefined,
  };
}

/**
 * Flatten an enrollment into a student-like object for UI compatibility.
 * id = student identity ID (for delete/update) — always from e.studentId so delete works even if nested student is missing.
 * enrollmentId = enrollment ID (for payments).
 * Includes personalDetails nested object for StudentDetailsModal.
 * Exported for use in useStudents cache merge after payment.
 */
export function flattenEnrollmentToStudentLike(e: StudentEnrollment): Record<string, unknown> {
  const s = e.student;
  const studentId = e.studentId;
  return {
    ...s,
    id: studentId,
    enrollmentId: e.id,
    sessionId: e.sessionId,
    classId: e.classId,
    registrationFees: e.registrationFees,
    annualFund: e.annualFund,
    monthlyFees: e.monthlyFees,
    transportFees: e.transportFees,
    registrationPaid: e.registrationPaid,
    annualFundPaid: e.annualFundPaid,
    dueDayOfMonth: e.dueDayOfMonth,
    lateFeeAmount: e.lateFeeAmount,
    lateFeeFrequency: e.lateFeeFrequency,
    payments: e.payments,
    targetAmount: e.targetAmount,
    finePerDay: e.finePerDay,
    dueFrequency: e.dueFrequency,
    personalDetails: s
      ? {
          fatherName: s.fatherName,
          motherName: s.motherName,
          guardianPhone: s.guardianPhone,
          currentAddress: s.currentAddress,
          permanentAddress: s.permanentAddress,
          bloodGroup: s.bloodGroup,
          healthIssues: s.healthIssues,
          aadhaarNumber: s.aadhaarNumber,
          dateOfBirth: s.dateOfBirth,
        }
      : undefined,
  };
}

/** Resolve enrollment ID from student ID when not provided (uses first enrollment for backward compatibility). */
async function resolveEnrollmentIdFromStudent(studentId: string): Promise<string> {
  const enrollments = await enrollmentsRepositoryApi.getByStudent(studentId);
  if (enrollments.length === 0) {
    throw new Error('Student has no enrollments');
  }
  return enrollments[0].id;
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
    return fetchAllPages<Record<string, unknown>, Student>('/students', mapStudent);
  },

  async getById(id: string): Promise<Student | null> {
    try {
      const r = await teachingFetchJson<Record<string, unknown>>(`/students/${id}`);
      return mapStudent(r);
    } catch {
      return null;
    }
  },

  async create(data: any): Promise<Student & { enrollmentId?: string }> {
    // When sessionId is provided, create student and enroll in one backend call.
    if (data.sessionId) {
      const personalDetails = data.personalDetails || {};
      const body = {
        session_id: data.sessionId,
        name: data.name,
        student_id: data.studentId,
        admission_number: data.admissionNumber || null,
        fee_type: data.feeType || 'Regular',
        father_name: personalDetails.fatherName || data.fatherName || null,
        mother_name: personalDetails.motherName || data.motherName || null,
        guardian_phone: personalDetails.guardianPhone || data.guardianPhone || null,
        current_address: personalDetails.currentAddress || data.currentAddress || null,
        permanent_address: personalDetails.permanentAddress || data.permanentAddress || null,
        blood_group: personalDetails.bloodGroup || data.bloodGroup || null,
        health_issues: personalDetails.healthIssues || data.healthIssues || null,
        aadhaar_number: personalDetails.aadhaarNumber || data.aadhaarNumber || null,
        date_of_birth: personalDetails.dateOfBirth || data.dateOfBirth || null,
        photo_url: data.photoUrl || null,
        sibling_id: data.siblingId || null,
        has_sibling_discount: data.hasSiblingDiscount ?? false,
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
      const r = await teachingFetchJson<{ student: Record<string, unknown>; enrollment: Record<string, unknown> }>(
        '/students/with-enrollment',
        { method: 'POST', body: JSON.stringify(body) }
      );
      const student = mapStudent(r.student);
      const enrollmentId = r.enrollment?.id != null ? String(r.enrollment.id) : undefined;
      return { ...student, enrollmentId };
    }

    // New format without sessionId
    const body = {
      school_id: data.schoolId,
      name: data.name,
      student_id: data.studentId,
      admission_number: data.admissionNumber ?? null,
      fee_type: data.feeType,
      father_name: data.fatherName ?? null,
      mother_name: data.motherName ?? null,
      guardian_phone: data.guardianPhone ?? null,
      current_address: data.currentAddress ?? null,
      permanent_address: data.permanentAddress ?? null,
      blood_group: data.bloodGroup ?? null,
      health_issues: data.healthIssues ?? null,
      aadhaar_number: data.aadhaarNumber ?? null,
      date_of_birth: data.dateOfBirth ?? null,
      photo_url: data.photoUrl ?? null,
      sibling_id: data.siblingId ?? null,
      has_sibling_discount: data.hasSiblingDiscount ?? false,
    };
    const r = await teachingFetchJson<Record<string, unknown>>('/students', { method: 'POST', body: JSON.stringify(body) });
    return mapStudent(r);
  },

  async update(id: string, updates: any): Promise<Student> {
    // Handle backward compatibility for updates
    // If sessionId or fee fields are provided, we need to update the enrollment too

    const studentUpdates: Record<string, unknown> = {};
    const enrollmentUpdates: Record<string, unknown> = {};

    // Separate student identity updates from enrollment updates
    if (updates.name !== undefined) studentUpdates.name = updates.name;
    if (updates.studentId !== undefined) studentUpdates.student_id = updates.studentId;
    if (updates.admissionNumber !== undefined) studentUpdates.admission_number = updates.admissionNumber;
    if (updates.feeType !== undefined) studentUpdates.fee_type = updates.feeType;
    if (updates.fatherName !== undefined) studentUpdates.father_name = updates.fatherName;
    if (updates.motherName !== undefined) studentUpdates.mother_name = updates.motherName;
    if (updates.guardianPhone !== undefined) studentUpdates.guardian_phone = updates.guardianPhone;
    if (updates.currentAddress !== undefined) studentUpdates.current_address = updates.currentAddress;
    if (updates.permanentAddress !== undefined) studentUpdates.permanent_address = updates.permanentAddress;
    if (updates.bloodGroup !== undefined) studentUpdates.blood_group = updates.bloodGroup;
    if (updates.healthIssues !== undefined) studentUpdates.health_issues = updates.healthIssues;
    if (updates.aadhaarNumber !== undefined) studentUpdates.aadhaar_number = updates.aadhaarNumber;
    if (updates.dateOfBirth !== undefined) studentUpdates.date_of_birth = updates.dateOfBirth;
    if (updates.photoUrl !== undefined) studentUpdates.photo_url = updates.photoUrl;
    if (updates.siblingId !== undefined) studentUpdates.sibling_id = updates.siblingId;
    if (updates.hasSiblingDiscount !== undefined) studentUpdates.has_sibling_discount = updates.hasSiblingDiscount;
    if (updates.isFrozen !== undefined) studentUpdates.is_frozen = updates.isFrozen;
    if (updates.frozenAt !== undefined) studentUpdates.frozen_at = updates.frozenAt;

    // Handle old personalDetails structure
    if (updates.personalDetails) {
      studentUpdates.father_name = updates.personalDetails.fatherName;
      studentUpdates.mother_name = updates.personalDetails.motherName;
      studentUpdates.guardian_phone = updates.personalDetails.guardianPhone;
      studentUpdates.current_address = updates.personalDetails.currentAddress;
      studentUpdates.permanent_address = updates.personalDetails.permanentAddress;
      studentUpdates.blood_group = updates.personalDetails.bloodGroup;
      studentUpdates.health_issues = updates.personalDetails.healthIssues;
      if (updates.personalDetails.aadhaarNumber !== undefined) studentUpdates.aadhaar_number = updates.personalDetails.aadhaarNumber;
      if (updates.personalDetails.dateOfBirth !== undefined) studentUpdates.date_of_birth = updates.personalDetails.dateOfBirth;
    }

    // Enrollment-specific updates
    if (updates.classId !== undefined) enrollmentUpdates.class_id = updates.classId;
    if (updates.registrationFees !== undefined) enrollmentUpdates.registration_fees = updates.registrationFees;
    if (updates.annualFund !== undefined) enrollmentUpdates.annual_fund = updates.annualFund;
    if (updates.monthlyFees !== undefined) enrollmentUpdates.monthly_fees = updates.monthlyFees;
    if (updates.transportFees !== undefined) enrollmentUpdates.transport_fees = updates.transportFees;
    if (updates.registrationPaid !== undefined) enrollmentUpdates.registration_paid = updates.registrationPaid;
    if (updates.annualFundPaid !== undefined) enrollmentUpdates.annual_fund_paid = updates.annualFundPaid;
    if (updates.dueDayOfMonth !== undefined) enrollmentUpdates.due_day_of_month = updates.dueDayOfMonth;
    if (updates.lateFeeAmount !== undefined) enrollmentUpdates.late_fee_amount = updates.lateFeeAmount;
    if (updates.lateFeeFrequency !== undefined) enrollmentUpdates.late_fee_frequency = updates.lateFeeFrequency;

    // Update student identity if there are student-specific changes
    if (Object.keys(studentUpdates).length > 0) {
      const r = await teachingFetchJson<Record<string, unknown>>(`/students/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(studentUpdates)
      });
    }

    // Update enrollment if there are enrollment-specific changes
    if (Object.keys(enrollmentUpdates).length > 0) {
      const enrollmentId =
        updates.enrollmentId ??
        (updates.sessionId
          ? (await enrollmentsRepositoryApi.getByStudent(id)).find((e) => e.sessionId === updates.sessionId)?.id
          : undefined);
      if (enrollmentId) {
        await teachingFetchJson<Record<string, unknown>>(`/students/enrollments/${enrollmentId}`, {
          method: 'PATCH',
          body: JSON.stringify(enrollmentUpdates),
        });
      }
    }

    // Fetch and return the updated student
    const r = await teachingFetchJson<Record<string, unknown>>(`/students/${id}`);
    return mapStudent(r);
  },

  async delete(id: string): Promise<void> {
    await teachingFetch(`/students/${id}`, { method: 'DELETE' });
  },

  /** Delete all students enrolled in the given session. Returns number deleted. */
  async deleteAllBySession(sessionId: string): Promise<number> {
    const res = await teachingFetchJson<{ deleted: number }>(
      `/students?session_id=${encodeURIComponent(sessionId)}`,
      { method: 'DELETE' }
    );
    return res?.deleted ?? 0;
  },

  // Backward-compatible bulk import: 1x session, 1x students/bulk, 1x enrollments/bulk
  async createMany(studentsWithEnrollment: any[]): Promise<Student[]> {
    if (studentsWithEnrollment.length === 0) return [];

    // 1) Get schoolId from session (one call)
    let schoolId: string | undefined;
    if (studentsWithEnrollment[0]?.sessionId) {
      try {
        const sessionRes = await teachingFetchJson<any>(`/sessions/${studentsWithEnrollment[0].sessionId}`);
        schoolId = sessionRes?.school_id || sessionRes?.schoolId;
      } catch (err) {
        console.error('Failed to fetch session for schoolId:', err);
      }
    }
    if (!schoolId) {
      throw new Error('Cannot determine schoolId from session');
    }

    // 2) Build and send bulk student payload (one call)
    const personalDetailsList = studentsWithEnrollment.map((d) => d.personalDetails || {});
    const studentsPayload = studentsWithEnrollment.map((data, i) => {
      const pd = personalDetailsList[i];
      return {
        school_id: schoolId,
        name: data.name,
        student_id: data.studentId,
        admission_number: data.admissionNumber ?? null,
        fee_type: data.feeType || 'Regular',
        father_name: pd.fatherName ?? data.fatherName ?? null,
        mother_name: pd.motherName ?? data.motherName ?? null,
        guardian_phone: pd.guardianPhone ?? data.guardianPhone ?? null,
        current_address: pd.currentAddress ?? data.currentAddress ?? null,
        permanent_address: pd.permanentAddress ?? data.permanentAddress ?? null,
        blood_group: pd.bloodGroup ?? data.bloodGroup ?? null,
        health_issues: pd.healthIssues ?? data.healthIssues ?? null,
        aadhaar_number: pd.aadhaarNumber ?? data.aadhaarNumber ?? null,
        date_of_birth: pd.dateOfBirth ?? data.dateOfBirth ?? null,
        photo_url: data.photoUrl ?? null,
        sibling_id: data.siblingId ?? null,
        has_sibling_discount: data.hasSiblingDiscount ?? false,
      };
    });

    const bulkStudentsRes = await teachingFetchJson<{ students: Record<string, unknown>[] }>('/students/bulk', {
      method: 'POST',
      body: JSON.stringify({ students: studentsPayload }),
    });
    const createdStudentsList = (bulkStudentsRes?.students ?? []).map(mapStudent);

    // 3) Bulk enroll with per-row fee structure (one call)
    const hasSession = Boolean(studentsWithEnrollment[0]?.sessionId);
    if (hasSession && createdStudentsList.length > 0) {
      const enrollmentsPayload = createdStudentsList.map((student, i) => {
        const data = studentsWithEnrollment[i];
        return {
          student_id: student.id,
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
      });
      await teachingFetchJson<{ enrollments: unknown[] }>('/students/enrollments/bulk', {
        method: 'POST',
        body: JSON.stringify({ enrollments: enrollmentsPayload }),
      });
    }

    return createdStudentsList;
  },

  // Backward-compatible methods for existing code
  async getBySession(sessionId: string): Promise<any[]> {
    const enrollments = await enrollmentsRepositoryApi.getBySession(sessionId);
    return enrollments.map((e) => flattenEnrollmentToStudentLike(e));
  },

  async addPayment(studentIdOrEnrollmentId: string, payment: any, enrollmentId?: string): Promise<FeePayment> {
    const targetEnrollmentId = enrollmentId ?? (await resolveEnrollmentIdFromStudent(studentIdOrEnrollmentId));
    return await enrollmentsRepositoryApi.addPayment(targetEnrollmentId, payment);
  },

  async deletePayment(studentIdOrEnrollmentId: string, paymentId: string, enrollmentId?: string): Promise<void> {
    const targetEnrollmentId = enrollmentId ?? (await resolveEnrollmentIdFromStudent(studentIdOrEnrollmentId));
    return await enrollmentsRepositoryApi.deletePayment(targetEnrollmentId, paymentId);
  },

  async getPaginated(
    page: number = 1,
    pageSize: number = 10,
    filters?: { sessionId?: string; classId?: string; search?: string }
  ): Promise<PaginatedResult<any>> {
    // If sessionId filter, return enrollments flattened to student-like shape (id = studentId, enrollmentId set)
    if (filters?.sessionId) {
      const result = await enrollmentsRepositoryApi.getPaginated(page, pageSize, filters);
      return {
        ...result,
        data: result.data.map((e) => flattenEnrollmentToStudentLike(e)),
      };
    }
    // Otherwise return students
    const offset = (page - 1) * pageSize;
    const students = await this.getAll();
    const total = students.length;
    const data = students.slice(offset, offset + pageSize);
    return {
      data,
      total,
      page,
      pageSize,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    };
  },

  async transferToSession(params: {
    fromSessionId: string;
    studentIds: string[];
    toSessionId: string;
  }): Promise<number> {
    const { fromSessionId, studentIds, toSessionId } = params;
    if (studentIds.length === 0) return 0;
    const res = await teachingFetchJson<{ transferred: number }>('/students/transfer', {
      method: 'POST',
      body: JSON.stringify({
        from_session_id: fromSessionId,
        to_session_id: toSessionId,
        student_ids: studentIds,
      }),
    });
    return res?.transferred ?? 0;
  },

  async addFeePayment(studentId: string, payment: any): Promise<void> {
    await this.addPayment(studentId, payment);
  },
};

// ============================================
// Enrollments API (Session-specific)
// ============================================
export const enrollmentsRepositoryApi = {
  async getBySession(sessionId: string): Promise<StudentEnrollment[]> {
    return fetchAllPages<Record<string, unknown>, StudentEnrollment>(
      `/students/enrollments?session_id=${sessionId}`,
      mapEnrollment
    );
  },

  async getByStudent(studentId: string): Promise<StudentEnrollment[]> {
    return fetchAllPages<Record<string, unknown>, StudentEnrollment>(
      `/students/enrollments?student_id=${studentId}`,
      mapEnrollment
    );
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
    if (filters?.search?.trim()) params.set('search', filters.search.trim());
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
