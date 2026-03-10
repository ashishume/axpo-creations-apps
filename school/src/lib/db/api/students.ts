import type { Student, StudentPersonalDetails, FeePayment } from '../../../types';
import type { PaginatedResult } from '../repositories/schools';
import { teachingFetch, teachingFetchJson } from '../../api/client';

function mapPayment(p: Record<string, unknown>): FeePayment {
  return {
    id: String(p.id),
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
  const paymentsRaw = r.payments;
  const payments: FeePayment[] = Array.isArray(paymentsRaw)
    ? paymentsRaw.map((p) => mapPayment(p as Record<string, unknown>))
    : [];
  return {
    id: String(r.id),
    sessionId: String(r.session_id ?? ''),
    classId: r.class_id != null ? String(r.class_id) : undefined,
    name: String(r.name ?? ''),
    studentId: String(r.student_id ?? ''),
    feeType: (r.fee_type as Student['feeType']) ?? 'Regular',
    personalDetails: {
      fatherName: r.father_name != null ? String(r.father_name) : undefined,
      motherName: r.mother_name != null ? String(r.mother_name) : undefined,
      guardianPhone: r.guardian_phone != null ? String(r.guardian_phone) : undefined,
      currentAddress: r.current_address != null ? String(r.current_address) : undefined,
      permanentAddress: r.permanent_address != null ? String(r.permanent_address) : undefined,
      bloodGroup: (r.blood_group as StudentPersonalDetails['bloodGroup']) ?? undefined,
      healthIssues: r.health_issues != null ? String(r.health_issues) : undefined,
    },
    registrationFees: r.registration_fees != null ? Number(r.registration_fees) : undefined,
    admissionFees: r.admission_fees != null ? Number(r.admission_fees) : undefined,
    annualFund: r.annual_fund != null ? Number(r.annual_fund) : undefined,
    monthlyFees: r.monthly_fees != null ? Number(r.monthly_fees) : undefined,
    transportFees: r.transport_fees != null ? Number(r.transport_fees) : undefined,
    registrationPaid: r.registration_paid as boolean | undefined,
    admissionPaid: r.admission_paid as boolean | undefined,
    annualFundPaid: r.annual_fund_paid as boolean | undefined,
    dueDayOfMonth: r.due_day_of_month != null ? Number(r.due_day_of_month) : undefined,
    lateFeeAmount: r.late_fee_amount != null ? Number(r.late_fee_amount) : undefined,
    lateFeeFrequency: r.late_fee_frequency as Student['lateFeeFrequency'] | undefined,
    payments,
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

export const studentsRepositoryApi = {
  async getAll(): Promise<Student[]> {
    const res = await teachingFetchJson<PaginatedApiResponse>(`/students?limit=${LARGE_PAGE_SIZE}&offset=0`);
    const list = res?.items ?? [];
    return Array.isArray(list) ? list.map(mapStudent) : [];
  },

  async getBySession(sessionId: string): Promise<Student[]> {
    const res = await teachingFetchJson<PaginatedApiResponse>(
      `/students?session_id=${sessionId}&limit=${LARGE_PAGE_SIZE}&offset=0`
    );
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

  async create(data: Omit<Student, 'id' | 'payments'>): Promise<Student> {
    const body = {
      session_id: data.sessionId,
      class_id: data.classId ?? null,
      name: data.name,
      student_id: data.studentId,
      fee_type: data.feeType,
      father_name: data.personalDetails?.fatherName ?? null,
      mother_name: data.personalDetails?.motherName ?? null,
      guardian_phone: data.personalDetails?.guardianPhone ?? null,
      current_address: data.personalDetails?.currentAddress ?? null,
      permanent_address: data.personalDetails?.permanentAddress ?? null,
      blood_group: data.personalDetails?.bloodGroup ?? null,
      health_issues: data.personalDetails?.healthIssues ?? null,
      registration_fees: data.registrationFees ?? null,
      admission_fees: data.admissionFees ?? null,
      annual_fund: data.annualFund ?? null,
      monthly_fees: data.monthlyFees ?? null,
      transport_fees: data.transportFees ?? null,
      registration_paid: data.registrationPaid ?? false,
      admission_paid: data.admissionPaid ?? false,
      annual_fund_paid: data.annualFundPaid ?? false,
      due_day_of_month: data.dueDayOfMonth ?? null,
      late_fee_amount: data.lateFeeAmount ?? null,
      late_fee_frequency: data.lateFeeFrequency ?? null,
    };
    const r = await teachingFetchJson<Record<string, unknown>>('/students', { method: 'POST', body: JSON.stringify(body) });
    return mapStudent(r);
  },

  async update(id: string, updates: Partial<Student>): Promise<Student> {
    const body: Record<string, unknown> = {};
    if (updates.classId !== undefined) body.class_id = updates.classId;
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.studentId !== undefined) body.student_id = updates.studentId;
    if (updates.feeType !== undefined) body.fee_type = updates.feeType;
    if (updates.personalDetails) {
      body.father_name = updates.personalDetails.fatherName;
      body.mother_name = updates.personalDetails.motherName;
      body.guardian_phone = updates.personalDetails.guardianPhone;
      body.current_address = updates.personalDetails.currentAddress;
      body.permanent_address = updates.personalDetails.permanentAddress;
      body.blood_group = updates.personalDetails.bloodGroup;
      body.health_issues = updates.personalDetails.healthIssues;
    }
    if (updates.registrationFees !== undefined) body.registration_fees = updates.registrationFees;
    if (updates.admissionFees !== undefined) body.admission_fees = updates.admissionFees;
    if (updates.annualFund !== undefined) body.annual_fund = updates.annualFund;
    if (updates.monthlyFees !== undefined) body.monthly_fees = updates.monthlyFees;
    if (updates.transportFees !== undefined) body.transport_fees = updates.transportFees;
    if (updates.registrationPaid !== undefined) body.registration_paid = updates.registrationPaid;
    if (updates.admissionPaid !== undefined) body.admission_paid = updates.admissionPaid;
    if (updates.annualFundPaid !== undefined) body.annual_fund_paid = updates.annualFundPaid;
    if (updates.dueDayOfMonth !== undefined) body.due_day_of_month = updates.dueDayOfMonth;
    if (updates.lateFeeAmount !== undefined) body.late_fee_amount = updates.lateFeeAmount;
    if (updates.lateFeeFrequency !== undefined) body.late_fee_frequency = updates.lateFeeFrequency;
    const r = await teachingFetchJson<Record<string, unknown>>(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    return mapStudent(r);
  },

  async delete(id: string): Promise<void> {
    await teachingFetch(`/students/${id}`, { method: 'DELETE' });
  },

  async addFeePayment(studentId: string, payment: { date: string; amount: number; method: string; receiptNumber: string; feeCategory: string; month?: string; receiptPhotoUrl?: string }): Promise<void> {
    await this.addPayment(studentId, payment);
  },

  async createMany(students: Omit<Student, 'id' | 'payments'>[]): Promise<Student[]> {
    if (students.length === 0) return [];
    const body = students.map((data) => ({
      session_id: data.sessionId,
      class_id: data.classId ?? null,
      name: data.name,
      student_id: data.studentId,
      fee_type: data.feeType,
      father_name: data.personalDetails?.fatherName ?? null,
      mother_name: data.personalDetails?.motherName ?? null,
      guardian_phone: data.personalDetails?.guardianPhone ?? null,
      current_address: data.personalDetails?.currentAddress ?? null,
      permanent_address: data.personalDetails?.permanentAddress ?? null,
      blood_group: data.personalDetails?.bloodGroup ?? null,
      health_issues: data.personalDetails?.healthIssues ?? null,
      registration_fees: data.registrationFees ?? null,
      admission_fees: data.admissionFees ?? null,
      annual_fund: data.annualFund ?? null,
      monthly_fees: data.monthlyFees ?? null,
      transport_fees: data.transportFees ?? null,
      registration_paid: data.registrationPaid ?? false,
      admission_paid: data.admissionPaid ?? false,
      annual_fund_paid: data.annualFundPaid ?? false,
      due_day_of_month: data.dueDayOfMonth ?? null,
      late_fee_amount: data.lateFeeAmount ?? null,
      late_fee_frequency: data.lateFeeFrequency ?? null,
    }));
    const list = await teachingFetchJson<Record<string, unknown>[]>('/students/bulk', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return Array.isArray(list) ? list.map(mapStudent) : [];
  },

  async addPayment(
    studentId: string,
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
    const r = await teachingFetchJson<Record<string, unknown>>(`/students/${studentId}/payments`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapPayment(r);
  },

  async getPaginated(
    page: number = 1,
    pageSize: number = 10,
    filters?: { sessionId?: string; classId?: string; search?: string }
  ): Promise<PaginatedResult<Student>> {
    const hasFilters = !!(filters?.classId ?? filters?.search);
    const sessionId = filters?.sessionId ?? '';
    const offset = (page - 1) * pageSize;
    const params = new URLSearchParams();
    if (sessionId) params.set('session_id', sessionId);
    params.set('limit', String(pageSize));
    params.set('offset', String(offset));
    params.set('has_filters', String(hasFilters));
    const res = await teachingFetchJson<PaginatedApiResponse>(`/students?${params.toString()}`);
    const items = res?.items ?? [];
    const total = res?.total ?? 0;
    return {
      data: Array.isArray(items) ? items.map(mapStudent) : [],
      total,
      page,
      pageSize,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    };
  },

  async deletePayment(studentId: string, paymentId: string): Promise<void> {
    await teachingFetch(`/students/${studentId}/payments/${paymentId}`, { method: 'DELETE' });
  },
};
