import { getSupabase } from '../supabase';
import type { Staff, SalaryPayment, PaymentMethod, ClassSubject } from '../../../types';
import type { PaginatedResult } from './schools';

type SalaryStatus = SalaryPayment['status'];

export interface ExtendedSalaryPayment extends SalaryPayment {
  expectedAmount?: number;
  lateDays?: number;
}

function mapClassesSubjects(raw: unknown): ClassSubject[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((item: Record<string, unknown>) => ({
    className: String(item.class_name ?? item.className ?? ''),
    subjects: Array.isArray(item.subjects) ? item.subjects.map(String) : [],
  }));
}

function dbRowToStaff(row: Record<string, unknown>, salaryPayments: ExtendedSalaryPayment[] = []): Staff {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    name: row.name as string,
    employeeId: row.employee_id as string,
    role: row.role as Staff['role'],
    monthlySalary: Number(row.monthly_salary) || 0,
    subjectOrGrade: row.subject_or_grade as string | undefined,
    // Leave & salary deduction configuration
    allowedLeavesPerMonth: Number(row.allowed_leaves_per_month) || 1,
    perDaySalary: row.per_day_salary != null ? Number(row.per_day_salary) : undefined,
    // Classes & subjects
    classesSubjects: mapClassesSubjects(row.classes_subjects),
    // Personal details
    aadhaarNumber: row.aadhaar_number as string | undefined,
    dateOfBirth: row.date_of_birth as string | undefined,
    salaryPayments,
  };
}

function mapSalaryPaymentFromDb(p: Record<string, unknown>): ExtendedSalaryPayment {
  return {
    id: p.id as string,
    month: p.month as string,
    amount: Number(p.paid_amount) || 0,
    paidAmount: Number(p.paid_amount) || 0,
    status: (p.status as string) as SalaryStatus,
    paymentDate: p.payment_date as string | undefined,
    method: (p.method as string | undefined) as PaymentMethod | undefined,
    expectedAmount: Number(p.expected_amount),
    dueDate: p.due_date as string | undefined,
    lateDays: p.late_days as number | undefined,
    // Leave tracking fields
    daysWorked: Number(p.days_worked) || 30,
    leavesTaken: Number(p.leaves_taken) || 0,
    allowedLeaves: Number(p.allowed_leaves) || 1,
    excessLeaves: Number(p.excess_leaves) || 0,
    leaveDeduction: Number(p.leave_deduction) || 0,
    // Extra allowance/deduction
    extraAllowance: Number(p.extra_allowance) || 0,
    allowanceNote: p.allowance_note as string | undefined,
    extraDeduction: Number(p.extra_deduction) || 0,
    deductionNote: p.deduction_note as string | undefined,
    // Calculated salary
    calculatedSalary: Number(p.calculated_salary) || Number(p.paid_amount) || 0,
  };
}

export const staffRepository = {
  async getAll(): Promise<Staff[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_staff')
      .select('*')
      .order('name');

    if (error) throw new Error('Failed to fetch staff');

    const staffIds = (data || []).map((s: { id: string }) => s.id);
    const { data: salaryData } = await supabase
      .from('school_xx_salary_payments')
      .select('*')
      .in('staff_id', staffIds);

    const salaryByStaff: Record<string, ExtendedSalaryPayment[]> = {};
    (salaryData || []).forEach((p: Record<string, unknown>) => {
      const sid = p.staff_id as string;
      if (!salaryByStaff[sid]) salaryByStaff[sid] = [];
      salaryByStaff[sid].push(mapSalaryPaymentFromDb(p));
    });

    return (data || []).map((row: Record<string, unknown>) => dbRowToStaff(row, salaryByStaff[row.id as string] || []));
  },

  async getBySession(sessionId: string): Promise<Staff[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_staff')
      .select('*')
      .eq('session_id', sessionId)
      .order('name');

    if (error) throw new Error('Failed to fetch staff');

    const staffIds = (data || []).map((s: { id: string }) => s.id);
    const { data: salaryData } = staffIds.length > 0
      ? await supabase.from('school_xx_salary_payments').select('*').in('staff_id', staffIds)
      : { data: [] };

    const salaryByStaff: Record<string, ExtendedSalaryPayment[]> = {};
    (salaryData || []).forEach((p: Record<string, unknown>) => {
      const sid = p.staff_id as string;
      if (!salaryByStaff[sid]) salaryByStaff[sid] = [];
      salaryByStaff[sid].push(mapSalaryPaymentFromDb(p));
    });

    return (data || []).map((row: Record<string, unknown>) => dbRowToStaff(row, salaryByStaff[row.id as string] || []));
  },

  async getPaginated(
    page: number = 1,
    pageSize: number = 10,
    filters?: { sessionId?: string; role?: string; search?: string }
  ): Promise<PaginatedResult<Staff>> {
    const supabase = getSupabase();
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('school_xx_staff')
      .select('*', { count: 'exact' })
      .order('name');

    if (filters?.sessionId) query = query.eq('session_id', filters.sessionId);
    if (filters?.role) query = query.eq('role', filters.role);
    if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%`);

    const { data, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) throw new Error('Failed to fetch staff');

    const staffIds = (data || []).map((s: { id: string }) => s.id);
    const { data: salaryData } = staffIds.length > 0
      ? await supabase.from('school_xx_salary_payments').select('*').in('staff_id', staffIds)
      : { data: [] };

    const salaryByStaff: Record<string, ExtendedSalaryPayment[]> = {};
    (salaryData || []).forEach((p: Record<string, unknown>) => {
      const sid = p.staff_id as string;
      if (!salaryByStaff[sid]) salaryByStaff[sid] = [];
      salaryByStaff[sid].push(mapSalaryPaymentFromDb(p));
    });

    const staff = (data || []).map((row: Record<string, unknown>) => dbRowToStaff(row, salaryByStaff[row.id as string] || []));

    return {
      data: staff,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  async getById(id: string): Promise<Staff | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_staff')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    const { data: salaryData } = await supabase
      .from('school_xx_salary_payments')
      .select('*')
      .eq('staff_id', id);

    const salaryPayments: ExtendedSalaryPayment[] = (salaryData || []).map(mapSalaryPaymentFromDb);

    return dbRowToStaff(data, salaryPayments);
  },

  async create(staffMember: Omit<Staff, 'id' | 'salaryPayments'>): Promise<Staff> {
    const supabase = getSupabase();
    const id = crypto.randomUUID();

    const row: Record<string, unknown> = {
      id,
      session_id: staffMember.sessionId,
      name: staffMember.name,
      employee_id: staffMember.employeeId,
      role: staffMember.role,
      monthly_salary: staffMember.monthlySalary,
      subject_or_grade: staffMember.subjectOrGrade ?? null,
      allowed_leaves_per_month: staffMember.allowedLeavesPerMonth ?? 1,
      per_day_salary: staffMember.perDaySalary ?? null,
    };
    if (staffMember.classesSubjects?.length) {
      row.classes_subjects = staffMember.classesSubjects.map((cs) => ({
        class_name: cs.className,
        subjects: cs.subjects,
      }));
    }

    const { data, error } = await supabase
      .from('school_xx_staff')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(error.message || 'Failed to create staff member');
    return dbRowToStaff(data, []);
  },

  async createMany(staffMembers: Omit<Staff, 'id' | 'salaryPayments'>[]): Promise<Staff[]> {
    if (staffMembers.length === 0) return [];
    const supabase = getSupabase();
    const rows = staffMembers.map((s) => {
      const row: Record<string, unknown> = {
        id: crypto.randomUUID(),
        session_id: s.sessionId,
        name: s.name,
        employee_id: s.employeeId,
        role: s.role,
        monthly_salary: s.monthlySalary,
        subject_or_grade: s.subjectOrGrade ?? null,
        allowed_leaves_per_month: s.allowedLeavesPerMonth ?? 1,
        per_day_salary: s.perDaySalary ?? null,
      };
      if (s.classesSubjects?.length) {
        row.classes_subjects = s.classesSubjects.map((cs) => ({
          class_name: cs.className,
          subjects: cs.subjects,
        }));
      }
      return row;
    });
    const { data, error } = await supabase.from('school_xx_staff').insert(rows).select();
    if (error) throw new Error(error.message || 'Failed to create staff members');
    return (data || []).map((row: Record<string, unknown>) => dbRowToStaff(row, []));
  },

  async update(id: string, updates: Partial<Omit<Staff, 'id' | 'salaryPayments'>>): Promise<Staff> {
    const supabase = getSupabase();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.sessionId !== undefined) dbUpdates.session_id = updates.sessionId;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.employeeId !== undefined) dbUpdates.employee_id = updates.employeeId;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.monthlySalary !== undefined) dbUpdates.monthly_salary = updates.monthlySalary;
    if (updates.subjectOrGrade !== undefined) dbUpdates.subject_or_grade = updates.subjectOrGrade;

    const { data, error } = await supabase
      .from('school_xx_staff')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update staff member');

    const { data: salaryData } = await supabase
      .from('school_xx_salary_payments')
      .select('*')
      .eq('staff_id', id);

    const salaryPayments: ExtendedSalaryPayment[] = (salaryData || []).map(mapSalaryPaymentFromDb);

    return dbRowToStaff(data, salaryPayments);
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('school_xx_staff')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete staff member');
  },

  /** Delete all staff in the given session. Returns number deleted. */
  async deleteAllBySession(sessionId: string): Promise<number> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('school_xx_staff')
      .delete()
      .eq('session_id', sessionId)
      .select('id');
    if (error) throw new Error('Failed to delete all staff');
    return data?.length ?? 0;
  },

  /** Copy staff to another session; salary payment records are not copied. */
  async transferToSession(params: {
    fromSessionId: string;
    staffIds: string[];
    toSessionId: string;
  }): Promise<number> {
    const { staffIds, toSessionId } = params;
    if (staffIds.length === 0) return 0;
    const supabase = getSupabase();
    const { data: rows, error: fetchError } = await supabase
      .from('school_xx_staff')
      .select('*')
      .in('id', staffIds)
      .eq('session_id', params.fromSessionId);
    if (fetchError || !rows?.length) return 0;
    const inserts = rows.map((row: Record<string, unknown>) => ({
      id: crypto.randomUUID(),
      session_id: toSessionId,
      name: row.name,
      employee_id: row.employee_id,
      role: row.role,
      monthly_salary: row.monthly_salary,
      subject_or_grade: row.subject_or_grade ?? null,
      phone: row.phone ?? null,
      email: row.email ?? null,
      address: row.address ?? null,
      salary_due_day: row.salary_due_day ?? 5,
      allowed_leaves_per_month: row.allowed_leaves_per_month ?? 2,
      per_day_salary: row.per_day_salary ?? null,
      classes_subjects: row.classes_subjects ?? null,
    }));
    const { error: insertError } = await supabase.from('school_xx_staff').insert(inserts);
    if (insertError) throw new Error('Failed to transfer staff');
    return inserts.length;
  },

  async addSalaryPayment(staffId: string, payment: Omit<ExtendedSalaryPayment, 'id' | 'lateDays'> & { paidAmount?: number }): Promise<ExtendedSalaryPayment> {
    const supabase = getSupabase();
    const dueDate = payment.dueDate || `${payment.month}-05`;
    
    // Check if a payment already exists for this month (for partial payment continuation)
    const { data: existing } = await supabase
      .from('school_xx_salary_payments')
      .select('id')
      .eq('staff_id', staffId)
      .eq('month', payment.month)
      .single();

    const paidAmount = payment.paidAmount ?? payment.amount;
    const calculatedSalary = payment.calculatedSalary ?? payment.amount;

    const paymentData = {
      staff_id: staffId,
      month: payment.month,
      expected_amount: calculatedSalary,
      paid_amount: paidAmount,
      status: payment.status,
      due_date: dueDate,
      payment_date: payment.paymentDate,
      method: payment.method,
      days_worked: payment.daysWorked ?? 30,
      leaves_taken: payment.leavesTaken ?? 0,
      allowed_leaves: payment.allowedLeaves ?? 1,
      excess_leaves: payment.excessLeaves ?? 0,
      leave_deduction: payment.leaveDeduction ?? 0,
      extra_allowance: payment.extraAllowance ?? 0,
      allowance_note: payment.allowanceNote,
      extra_deduction: payment.extraDeduction ?? 0,
      deduction_note: payment.deductionNote,
      calculated_salary: calculatedSalary,
    };

    let data;
    let error;

    if (existing) {
      // Update existing payment (partial payment scenario)
      const result = await supabase
        .from('school_xx_salary_payments')
        .update(paymentData)
        .eq('id', existing.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new payment
      const result = await supabase
        .from('school_xx_salary_payments')
        .insert({ id: crypto.randomUUID(), ...paymentData })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) throw new Error('Failed to add salary payment');

    return {
      id: data.id,
      month: data.month,
      amount: Number(data.paid_amount),
      paidAmount: Number(data.paid_amount),
      status: data.status as SalaryStatus,
      paymentDate: data.payment_date,
      method: data.method as PaymentMethod | undefined,
      expectedAmount: Number(data.expected_amount),
      dueDate: data.due_date,
      lateDays: data.late_days,
      daysWorked: Number(data.days_worked) || 30,
      leavesTaken: Number(data.leaves_taken) || 0,
      allowedLeaves: Number(data.allowed_leaves) || 1,
      excessLeaves: Number(data.excess_leaves) || 0,
      leaveDeduction: Number(data.leave_deduction) || 0,
      extraAllowance: Number(data.extra_allowance) || 0,
      allowanceNote: data.allowance_note,
      extraDeduction: Number(data.extra_deduction) || 0,
      deductionNote: data.deduction_note,
      calculatedSalary: Number(data.calculated_salary) || Number(data.paid_amount) || 0,
    };
  },

  async addSalaryPaymentsBatch(
    payments: { staffId: string; payment: Omit<ExtendedSalaryPayment, 'id' | 'lateDays'> }[]
  ): Promise<void> {
    if (payments.length === 0) return;
    const supabase = getSupabase();
    const rows = payments.map(({ staffId, payment }) => ({
      id: crypto.randomUUID(),
      staff_id: staffId,
      month: payment.month,
      expected_amount: payment.expectedAmount ?? payment.amount,
      paid_amount: payment.amount,
      status: payment.status,
      due_date: payment.dueDate || `${payment.month}-05`,
      payment_date: payment.paymentDate,
      method: payment.method,
    }));
    const { error } = await supabase.from('school_xx_salary_payments').insert(rows);
    if (error) throw new Error('Failed to add salary payments');
  },

  async updateSalaryPayment(_staffId: string, paymentId: string, updates: Partial<ExtendedSalaryPayment>): Promise<ExtendedSalaryPayment> {
    const supabase = getSupabase();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.month !== undefined) dbUpdates.month = updates.month;
    if (updates.amount !== undefined) dbUpdates.paid_amount = updates.amount;
    if (updates.expectedAmount !== undefined) dbUpdates.expected_amount = updates.expectedAmount;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.paymentDate !== undefined) dbUpdates.payment_date = updates.paymentDate;
    if (updates.method !== undefined) dbUpdates.method = updates.method;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;

    const { data, error } = await supabase
      .from('school_xx_salary_payments')
      .update(dbUpdates)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw new Error('Failed to update salary payment');

    return {
      id: data.id,
      month: data.month,
      amount: Number(data.paid_amount),
      status: data.status as SalaryStatus,
      paymentDate: data.payment_date,
      method: data.method as PaymentMethod | undefined,
      expectedAmount: Number(data.expected_amount),
      dueDate: data.due_date,
      lateDays: data.late_days,
      daysWorked: Number(data.days_worked) || 30,
      leavesTaken: Number(data.leaves_taken) || 0,
      allowedLeaves: Number(data.allowed_leaves) || 2,
      excessLeaves: Number(data.excess_leaves) || 0,
      leaveDeduction: Number(data.leave_deduction) || 0,
      extraAllowance: Number(data.extra_allowance) || 0,
      extraDeduction: Number(data.extra_deduction) || 0,
      calculatedSalary: Number(data.calculated_salary) || Number(data.paid_amount) || 0,
    };
  },

  async deleteSalaryPayment(_staffId: string, paymentId: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('school_xx_salary_payments')
      .delete()
      .eq('id', paymentId);

    if (error) throw new Error('Failed to delete salary payment');
  },

  async getLastPaidDate(staffId: string): Promise<string | null> {
    const staff = await this.getById(staffId);
    if (!staff) return null;

    const paidPayments = staff.salaryPayments
      .filter(p => p.status === 'Paid' && p.paymentDate)
      .sort((a, b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime());

    return paidPayments[0]?.paymentDate || null;
  },

  async getSalaryStatus(staffId: string, month: string): Promise<ExtendedSalaryPayment | null> {
    const staff = await this.getById(staffId);
    if (!staff) return null;

    return (staff.salaryPayments.find(p => p.month === month) as ExtendedSalaryPayment) || null;
  },
};
