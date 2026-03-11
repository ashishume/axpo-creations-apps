import { getSupabase } from '../supabase';
import type { Student, FeePayment, StudentPersonalDetails } from '../../../types';
import type { PaginatedResult } from './schools';

/** Legacy shape returned by Supabase repo (student + session + fees in one). Used only in this file. */
export type LegacyStudent = Student & {
  sessionId?: string;
  classId?: string;
  personalDetails?: {
    fatherName?: string;
    motherName?: string;
    guardianPhone?: string;
    currentAddress?: string;
    permanentAddress?: string;
    bloodGroup?: string;
    healthIssues?: string;
  };
  payments: FeePayment[];
  registrationFees?: number;
  annualFund?: number;
  monthlyFees?: number;
  transportFees?: number;
  registrationPaid?: boolean;
  annualFundPaid?: boolean;
  dueDayOfMonth?: number;
  lateFeeAmount?: number;
  lateFeeFrequency?: 'daily' | 'weekly';
  targetAmount?: number;
  finePerDay?: number;
  dueFrequency?: 'monthly' | 'quarterly';
};

/** Build FeePayment from DB row; legacy Supabase uses student_id so enrollmentId is empty. */
function toFeePayment(p: Record<string, unknown>): FeePayment {
  return {
    id: p.id as string,
    enrollmentId: (p.enrollment_id ?? p.enrollmentId ?? '') as string,
    date: p.date as string,
    amount: Number(p.amount),
    method: p.method as FeePayment['method'],
    receiptNumber: (p.receipt_number ?? '') as string,
    feeCategory: p.fee_category as FeePayment['feeCategory'],
    month: p.month as string | undefined,
    receiptPhotoUrl: p.receipt_photo_url != null ? String(p.receipt_photo_url) : undefined,
  };
}

// Helper to convert DB row to legacy Student shape (session + fees in one)
function dbRowToStudent(row: Record<string, unknown>, payments: FeePayment[] = []): LegacyStudent {
  const base: Student = {
    id: row.id as string,
    schoolId: (row.school_id ?? '') as string,
    name: row.name as string,
    studentId: row.student_id as string,
    feeType: (row.fee_type ?? 'Regular') as Student['feeType'],
    fatherName: row.father_name as string | undefined,
    motherName: row.mother_name as string | undefined,
    guardianPhone: row.guardian_phone as string | undefined,
    currentAddress: row.current_address as string | undefined,
    permanentAddress: row.permanent_address as string | undefined,
    bloodGroup: row.blood_group as Student['bloodGroup'],
    healthIssues: row.health_issues as string | undefined,
    photoUrl: row.photo_url as string | undefined,
    siblingId: row.sibling_id as string | undefined,
  };
  return {
    ...base,
    sessionId: row.session_id as string | undefined,
    classId: row.class_id as string | undefined,
    personalDetails: {
      fatherName: row.father_name as string | undefined,
      motherName: row.mother_name as string | undefined,
      guardianPhone: row.guardian_phone as string | undefined,
      currentAddress: row.current_address as string | undefined,
      permanentAddress: row.permanent_address as string | undefined,
      bloodGroup: row.blood_group as StudentPersonalDetails['bloodGroup'],
      healthIssues: row.health_issues as string | undefined,
    },
    payments,
    registrationFees: row.registration_fees != null ? Number(row.registration_fees) : undefined,
    annualFund: row.annual_fund != null ? Number(row.annual_fund) : undefined,
    monthlyFees: row.monthly_fees != null ? Number(row.monthly_fees) : undefined,
    transportFees: row.transport_fees != null ? Number(row.transport_fees) : undefined,
    registrationPaid: row.registration_paid as boolean | undefined,
    annualFundPaid: row.annual_fund_paid as boolean | undefined,
    dueDayOfMonth: row.due_day_of_month as number | undefined,
    lateFeeAmount: row.late_fee_amount != null ? Number(row.late_fee_amount) : undefined,
    lateFeeFrequency: row.late_fee_frequency as LegacyStudent['lateFeeFrequency'],
    targetAmount: row.target_amount != null ? Number(row.target_amount) : undefined,
    finePerDay: row.fine_per_day != null ? Number(row.fine_per_day) : undefined,
    dueFrequency: row.due_frequency as LegacyStudent['dueFrequency'],
  };
}

export const studentsRepository = {
  async getAll(): Promise<LegacyStudent[]> {
    const supabase = getSupabase();
      const { data, error } = await supabase
        .from('school_xx_students')
        .select('*')
        .order('name');

      if (error) throw new Error('Failed to fetch students');

      // Get all payments
      const studentIds = (data || []).map(s => s.id);
      const { data: paymentsData } = await supabase
        .from('school_xx_fee_payments')
        .select('*')
        .in('student_id', studentIds);

      const paymentsByStudent: Record<string, FeePayment[]> = {};
      (paymentsData || []).forEach((p: Record<string, unknown>) => {
        const sid = p.student_id as string;
        if (!paymentsByStudent[sid]) paymentsByStudent[sid] = [];
        paymentsByStudent[sid].push(toFeePayment(p));
      });

    return (data || []).map((row: Record<string, unknown>) => dbRowToStudent(row, paymentsByStudent[row.id as string] || []));
  },

  async getBySession(sessionId: string): Promise<LegacyStudent[]> {
    const supabase = getSupabase();
      const { data, error } = await supabase
        .from('school_xx_students')
        .select('*')
        .eq('session_id', sessionId)
        .order('name');

      if (error) throw new Error('Failed to fetch students');

      const studentIds = (data || []).map(s => s.id);
      const { data: paymentsData } = await supabase
        .from('school_xx_fee_payments')
        .select('*')
        .in('student_id', studentIds);

      const paymentsByStudent: Record<string, FeePayment[]> = {};
      (paymentsData || []).forEach((p: Record<string, unknown>) => {
        const sid = p.student_id as string;
        if (!paymentsByStudent[sid]) paymentsByStudent[sid] = [];
        paymentsByStudent[sid].push(toFeePayment(p));
      });

    return (data || []).map((row: Record<string, unknown>) => dbRowToStudent(row, paymentsByStudent[row.id as string] || []));
  },

  async getPaginated(
    page: number = 1, 
    pageSize: number = 10, 
    filters?: { sessionId?: string; classId?: string; search?: string }
  ): Promise<PaginatedResult<LegacyStudent>> {
    const supabase = getSupabase();
    const offset = (page - 1) * pageSize;
      let query = supabase
        .from('school_xx_students')
        .select('*', { count: 'exact' })
        .order('name');

      if (filters?.sessionId) {
        query = query.eq('session_id', filters.sessionId);
      }
      if (filters?.classId) {
        query = query.eq('class_id', filters.classId);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,student_id.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query.range(offset, offset + pageSize - 1);

      if (error) throw new Error('Failed to fetch students');

      const studentIds = (data || []).map(s => s.id);
      const { data: paymentsData } = studentIds.length > 0 
        ? await supabase.from('school_xx_fee_payments').select('*').in('student_id', studentIds)
        : { data: [] };

      const paymentsByStudent: Record<string, FeePayment[]> = {};
      (paymentsData || []).forEach((p: Record<string, unknown>) => {
        const sid = p.student_id as string;
        if (!paymentsByStudent[sid]) paymentsByStudent[sid] = [];
        paymentsByStudent[sid].push(toFeePayment(p));
      });

      const students = (data || []).map((row: Record<string, unknown>) => dbRowToStudent(row, paymentsByStudent[row.id as string] || []));

    return {
      data: students,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  async getById(id: string): Promise<LegacyStudent | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_students')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    const { data: paymentsData } = await supabase
      .from('school_xx_fee_payments')
      .select('*')
      .eq('student_id', id);

    const payments: FeePayment[] = (paymentsData || []).map((p: Record<string, unknown>) => toFeePayment(p));

    return dbRowToStudent(data as Record<string, unknown>, payments);
  },

  async create(student: Partial<LegacyStudent> & Pick<LegacyStudent, 'name' | 'studentId'>): Promise<LegacyStudent> {
    const supabase = getSupabase();
    const id = crypto.randomUUID();
    const s = student as LegacyStudent;
    const { data, error } = await supabase
        .from('school_xx_students')
        .insert({
          id,
          session_id: s.sessionId,
          class_id: s.classId,
          name: student.name,
          student_id: student.studentId,
          fee_type: student.feeType ?? 'Regular',
          father_name: s.personalDetails?.fatherName,
          mother_name: s.personalDetails?.motherName,
          guardian_phone: s.personalDetails?.guardianPhone,
          current_address: s.personalDetails?.currentAddress,
          permanent_address: s.personalDetails?.permanentAddress,
          blood_group: s.personalDetails?.bloodGroup,
          health_issues: s.personalDetails?.healthIssues,
          registration_fees: s.registrationFees,
          annual_fund: s.annualFund,
          monthly_fees: s.monthlyFees,
          transport_fees: s.transportFees,
          registration_paid: s.registrationPaid,
          annual_fund_paid: s.annualFundPaid,
          due_day_of_month: s.dueDayOfMonth,
          late_fee_amount: s.lateFeeAmount,
          late_fee_frequency: s.lateFeeFrequency,
          target_amount: s.targetAmount,
          fine_per_day: s.finePerDay,
          due_frequency: s.dueFrequency,
          photo_url: student.photoUrl,
          sibling_id: student.siblingId,
        })
        .select()
        .single();

    if (error) throw new Error('Failed to create student');

    return dbRowToStudent(data as Record<string, unknown>, []);
  },

  async createMany(students: (Partial<LegacyStudent> & Pick<LegacyStudent, 'name' | 'studentId'>)[]): Promise<LegacyStudent[]> {
    if (students.length === 0) return [];
    const supabase = getSupabase();
    const rows = students.map((s) => ({
      id: crypto.randomUUID(),
      session_id: (s as LegacyStudent).sessionId,
      class_id: (s as LegacyStudent).classId,
      name: s.name,
      student_id: s.studentId,
      fee_type: s.feeType,
      father_name: s.personalDetails?.fatherName,
      mother_name: s.personalDetails?.motherName,
      guardian_phone: s.personalDetails?.guardianPhone,
      current_address: s.personalDetails?.currentAddress,
      permanent_address: s.personalDetails?.permanentAddress,
      blood_group: s.personalDetails?.bloodGroup,
      health_issues: s.personalDetails?.healthIssues,
      registration_fees: s.registrationFees,
      annual_fund: s.annualFund,
      monthly_fees: s.monthlyFees,
      transport_fees: s.transportFees,
      registration_paid: s.registrationPaid,
      annual_fund_paid: s.annualFundPaid,
      due_day_of_month: s.dueDayOfMonth,
      late_fee_amount: s.lateFeeAmount,
      late_fee_frequency: s.lateFeeFrequency,
      target_amount: s.targetAmount,
      fine_per_day: s.finePerDay,
      due_frequency: s.dueFrequency,
      photo_url: s.photoUrl,
      sibling_id: s.siblingId,
    }));
    const { data, error } = await supabase.from('school_xx_students').insert(rows).select();
    if (error) throw new Error('Failed to create students');
    return (data || []).map((row) => dbRowToStudent(row, []));
  },

  async update(id: string, updates: Partial<LegacyStudent>): Promise<LegacyStudent> {
    const supabase = getSupabase();
      const dbUpdates: Record<string, unknown> = {};
      if (updates.sessionId !== undefined) dbUpdates.session_id = updates.sessionId;
      if (updates.classId !== undefined) dbUpdates.class_id = updates.classId ?? null;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.studentId !== undefined) dbUpdates.student_id = updates.studentId;
      if (updates.feeType !== undefined) dbUpdates.fee_type = updates.feeType;
      if (updates.personalDetails?.fatherName !== undefined) dbUpdates.father_name = updates.personalDetails.fatherName;
      if (updates.personalDetails?.motherName !== undefined) dbUpdates.mother_name = updates.personalDetails.motherName;
      if (updates.personalDetails?.guardianPhone !== undefined) dbUpdates.guardian_phone = updates.personalDetails.guardianPhone;
      if (updates.personalDetails?.currentAddress !== undefined) dbUpdates.current_address = updates.personalDetails.currentAddress;
      if (updates.personalDetails?.permanentAddress !== undefined) dbUpdates.permanent_address = updates.personalDetails.permanentAddress;
      if (updates.personalDetails?.bloodGroup !== undefined) dbUpdates.blood_group = updates.personalDetails.bloodGroup;
      if (updates.personalDetails?.healthIssues !== undefined) dbUpdates.health_issues = updates.personalDetails.healthIssues;
      if (updates.registrationFees !== undefined) dbUpdates.registration_fees = updates.registrationFees;
      if (updates.annualFund !== undefined) dbUpdates.annual_fund = updates.annualFund;
      if (updates.monthlyFees !== undefined) dbUpdates.monthly_fees = updates.monthlyFees;
      if (updates.transportFees !== undefined) dbUpdates.transport_fees = updates.transportFees;
      if (updates.registrationPaid !== undefined) dbUpdates.registration_paid = updates.registrationPaid;
      if (updates.annualFundPaid !== undefined) dbUpdates.annual_fund_paid = updates.annualFundPaid;
      if (updates.dueDayOfMonth !== undefined) dbUpdates.due_day_of_month = updates.dueDayOfMonth;
      if (updates.lateFeeAmount !== undefined) dbUpdates.late_fee_amount = updates.lateFeeAmount;
      if (updates.lateFeeFrequency !== undefined) dbUpdates.late_fee_frequency = updates.lateFeeFrequency;
      if (updates.photoUrl !== undefined) dbUpdates.photo_url = updates.photoUrl;
      if (updates.siblingId !== undefined) dbUpdates.sibling_id = updates.siblingId;

      const { data, error } = await supabase
        .from('school_xx_students')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error('Failed to update student');

      const { data: paymentsData } = await supabase
        .from('school_xx_fee_payments')
        .select('*')
        .eq('student_id', id);

      const payments: FeePayment[] = (paymentsData || []).map((p: Record<string, unknown>) => toFeePayment(p));

    return dbRowToStudent(data as Record<string, unknown>, payments);
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('school_xx_students')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete student');
  },

  async deleteAllBySession(_sessionId: string): Promise<number> {
    throw new Error('Delete all by session is only supported when using the Teaching API');
  },

  /** Bulk transfer students to a new session (single API call). Clears classId. Returns count updated. */
  async transferToSession(studentIds: string[], newSessionId: string): Promise<number> {
    if (studentIds.length === 0) return 0;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_students')
      .update({ session_id: newSessionId, class_id: null })
      .in('id', studentIds)
      .select('id');
    if (error) throw new Error('Failed to transfer students');
    return data?.length ?? 0;
  },

  async addPayment(studentId: string, payment: Omit<FeePayment, 'id'>, _enrollmentId?: string): Promise<FeePayment> {
    const supabase = getSupabase();
    const id = crypto.randomUUID();
    const { data, error } = await supabase
      .from('school_xx_fee_payments')
      .insert({
        id,
        student_id: studentId,
        date: payment.date,
        amount: payment.amount,
        method: payment.method,
        receipt_number: payment.receiptNumber,
        fee_category: payment.feeCategory,
        month: payment.month,
        receipt_photo_url: payment.receiptPhotoUrl ?? null,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to add payment');

    return toFeePayment(data as Record<string, unknown>);
  },

  async deletePayment(_studentId: string, paymentId: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('school_xx_fee_payments')
      .delete()
      .eq('id', paymentId);

    if (error) throw new Error('Failed to delete payment');
  },
};

// Placeholder enrollmentsRepository - will be fully implemented after migration
export const enrollmentsRepository = {
  async getBySession(_sessionId: string) {
    // TODO: Implement after migration
    return [];
  },
  async getByStudent(_studentId: string) {
    // TODO: Implement after migration
    return [];
  },
  async getById(_id: string) {
    // TODO: Implement after migration
    return null;
  },
  async create(_data: unknown) {
    // TODO: Implement after migration
    throw new Error('Not implemented yet - run migration first');
  },
  async createBulk(_data: unknown) {
    // TODO: Implement after migration
    throw new Error('Not implemented yet - run migration first');
  },
  async update(_id: string, _updates: unknown) {
    // TODO: Implement after migration
    throw new Error('Not implemented yet - run migration first');
  },
  async delete(_id: string) {
    // TODO: Implement after migration
    throw new Error('Not implemented yet - run migration first');
  },
  async addPayment(_enrollmentId: string, _payment: unknown) {
    // TODO: Implement after migration
    throw new Error('Not implemented yet - run migration first');
  },
  async deletePayment(_enrollmentId: string, _paymentId: string) {
    // TODO: Implement after migration
    throw new Error('Not implemented yet - run migration first');
  },
  async getPaginated(_page: number, _pageSize: number, _filters?: unknown) {
    // TODO: Implement after migration
    return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
  },
};
