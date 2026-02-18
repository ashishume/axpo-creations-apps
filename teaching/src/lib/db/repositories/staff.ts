import { getSupabase } from '../supabase';
import type { Staff, SalaryPayment, PaymentMethod } from '../../../types';
import type { PaginatedResult } from './schools';

type SalaryStatus = SalaryPayment['status'];

export interface ExtendedSalaryPayment extends SalaryPayment {
  expectedAmount?: number;
  dueDate?: string;
  lateDays?: number;
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
    salaryPayments,
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
      salaryByStaff[sid].push({
        id: p.id as string,
        month: p.month as string,
        amount: Number(p.paid_amount) || 0,
        status: (p.status as string) as SalaryStatus,
        paymentDate: p.payment_date as string | undefined,
        method: (p.method as string | undefined) as PaymentMethod | undefined,
        expectedAmount: Number(p.expected_amount),
        dueDate: p.due_date as string | undefined,
        lateDays: p.late_days as number | undefined,
      });
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
      salaryByStaff[sid].push({
        id: p.id as string,
        month: p.month as string,
        amount: Number(p.paid_amount) || 0,
        status: (p.status as string) as SalaryStatus,
        paymentDate: p.payment_date as string | undefined,
        method: (p.method as string | undefined) as PaymentMethod | undefined,
        expectedAmount: Number(p.expected_amount),
        dueDate: p.due_date as string | undefined,
        lateDays: p.late_days as number | undefined,
      });
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
      salaryByStaff[sid].push({
        id: p.id as string,
        month: p.month as string,
        amount: Number(p.paid_amount) || 0,
        status: (p.status as string) as SalaryStatus,
        paymentDate: p.payment_date as string | undefined,
        method: (p.method as string | undefined) as PaymentMethod | undefined,
        expectedAmount: Number(p.expected_amount),
        dueDate: p.due_date as string | undefined,
        lateDays: p.late_days as number | undefined,
      });
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

    const salaryPayments: ExtendedSalaryPayment[] = (salaryData || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      month: p.month as string,
      amount: Number(p.paid_amount) || 0,
      status: (p.status as string) as SalaryStatus,
      paymentDate: p.payment_date as string | undefined,
      method: (p.method as string | undefined) as PaymentMethod | undefined,
      expectedAmount: Number(p.expected_amount),
      dueDate: p.due_date as string | undefined,
      lateDays: p.late_days as number | undefined,
    }));

    return dbRowToStaff(data, salaryPayments);
  },

  async create(staffMember: Omit<Staff, 'id' | 'salaryPayments'>): Promise<Staff> {
    const supabase = getSupabase();
    const id = crypto.randomUUID();

    const { data, error } = await supabase
      .from('school_xx_staff')
      .insert({
        id,
        session_id: staffMember.sessionId,
        name: staffMember.name,
        employee_id: staffMember.employeeId,
        role: staffMember.role,
        monthly_salary: staffMember.monthlySalary,
        subject_or_grade: staffMember.subjectOrGrade,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create staff member');
    return dbRowToStaff(data, []);
  },

  async createMany(staffMembers: Omit<Staff, 'id' | 'salaryPayments'>[]): Promise<Staff[]> {
    if (staffMembers.length === 0) return [];
    const supabase = getSupabase();
    const rows = staffMembers.map((s) => ({
      id: crypto.randomUUID(),
      session_id: s.sessionId,
      name: s.name,
      employee_id: s.employeeId,
      role: s.role,
      monthly_salary: s.monthlySalary,
      subject_or_grade: s.subjectOrGrade,
    }));
    const { data, error } = await supabase.from('school_xx_staff').insert(rows).select();
    if (error) throw new Error('Failed to create staff members');
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

    const salaryPayments: ExtendedSalaryPayment[] = (salaryData || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      month: p.month as string,
      amount: Number(p.paid_amount) || 0,
      status: (p.status as string) as SalaryStatus,
      paymentDate: p.payment_date as string | undefined,
      method: (p.method as string | undefined) as PaymentMethod | undefined,
      expectedAmount: Number(p.expected_amount),
      dueDate: p.due_date as string | undefined,
      lateDays: p.late_days as number | undefined,
    }));

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

  async addSalaryPayment(staffId: string, payment: Omit<ExtendedSalaryPayment, 'id' | 'lateDays'>): Promise<ExtendedSalaryPayment> {
    const supabase = getSupabase();
    const id = crypto.randomUUID();
    const dueDate = payment.dueDate || `${payment.month}-05`;

    const { data, error } = await supabase
      .from('school_xx_salary_payments')
      .insert({
        id,
        staff_id: staffId,
        month: payment.month,
        expected_amount: payment.expectedAmount ?? payment.amount,
        paid_amount: payment.amount,
        status: payment.status,
        due_date: dueDate,
        payment_date: payment.paymentDate,
        method: payment.method,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to add salary payment');

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
