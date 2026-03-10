import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import type {
  School,
  Session,
  Student,
  Staff,
  Expense,
  FeePayment,
  SalaryPayment,
  StudentClass,
  Stock,
  StockTransaction,
  FixedMonthlyCost,
  Organization,
} from "../types";
import * as storage from "../lib/storage";
import { generateId, getNextClassName } from "../lib/utils";
import {
  schoolsRepository,
  sessionsRepository,
  classesRepository,
  studentsRepository,
  staffRepository,
  expensesRepository,
  stocksRepository,
} from "../lib/db/repositories";
import {
  organizationsRepository,
  fixedCostsRepository,
} from "../lib/db/repositories";
import { useAuth } from "./AuthContext";
import {
  createSampleSchools,
  createSampleSessions,
  createSampleClasses,
  createSampleStudents,
  createSampleStaff,
  createSampleExpenses,
  createSampleStocks,
  createSampleFixedCosts,
} from "../data/sampleData";

type Toast = { id: string; message: string; type: "success" | "error" };

interface AppState {
  schools: School[];
  sessions: Session[];
  classes: StudentClass[];
  students: Student[];
  staff: Staff[];
  expenses: Expense[];
  stocks: Stock[];
  fixedCosts: FixedMonthlyCost[];
  organizations: Organization[];
  selectedSchoolId: string | null;
  selectedSessionId: string | null;
  toasts: Toast[];
}

interface AppContextValue extends AppState {
  /** True while dashboard/app data is being fetched (e.g. after login). */
  isAppLoading: boolean;
  // Schools
  addSchool: (school: Omit<School, "id">) => void;
  updateSchool: (id: string, data: Partial<School>) => void;
  deleteSchool: (id: string) => void;
  setSelectedSchool: (id: string | null) => void;

  // Sessions
  addSession: (session: Omit<Session, "id">) => void;
  updateSession: (id: string, data: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  setSelectedSession: (id: string | null) => void;

  // Classes (per session)
  addClass: (data: Omit<StudentClass, "id">) => void;
  updateClass: (id: string, data: Partial<StudentClass>) => void;
  deleteClass: (id: string) => void;

  // Students
  addStudent: (student: Omit<Student, "id" | "payments">) => void;
  addStudents: (students: Omit<Student, "id" | "payments">[]) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addFeePayment: (studentId: string, payment: Omit<FeePayment, "id">) => Promise<FeePayment | void>;

  // Stocks
  addStock: (stock: Omit<Stock, "id" | "transactions">) => void;
  addStocks: (stocks: Omit<Stock, "id" | "transactions">[]) => void;
  updateStock: (id: string, data: Partial<Stock>) => void;
  deleteStock: (id: string) => void;
  addStockTransaction: (stockId: string, transaction: Omit<StockTransaction, "id">) => void;
  settleStock: (stockId: string, settledAmount: number) => void;

  // Staff
  addStaff: (staff: Omit<Staff, "id" | "salaryPayments">) => void;
  addStaffBatch: (staff: Omit<Staff, "id" | "salaryPayments">[]) => void;
  updateStaff: (id: string, data: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  updateSalaryPayment: (
    staffId: string,
    month: string,
    data: Partial<SalaryPayment>
  ) => void;
  addSalaryPayment: (staffId: string, payment: Omit<SalaryPayment, "id">) => void;
  addSalaryPaymentsBatch: (payments: { staffId: string; payment: Omit<SalaryPayment, "id"> }[]) => void;

  // Expenses
  addExpense: (expense: Omit<Expense, "id">) => void;
  addExpenses: (expenses: Omit<Expense, "id">[]) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Fixed Monthly Costs
  addFixedCost: (cost: Omit<FixedMonthlyCost, "id">) => void;
  addFixedCosts: (costs: Omit<FixedMonthlyCost, "id">[]) => void;
  updateFixedCost: (id: string, data: Partial<FixedMonthlyCost>) => void;
  deleteFixedCost: (id: string) => void;

  // Classes (batch)
  addClasses: (classes: Omit<StudentClass, "id">[]) => void;

  toast: (message: string, type?: "success" | "error") => void;
  dismissToast: (id: string) => void;
  loadSampleData: () => void;
  clearAllData: () => void;
  exportData: () => Promise<BackupData>;
  importData: (data: BackupData) => void;
  
  // Session promotion
  promoteStudentsToNewSession: (fromSessionId: string, toSessionId: string) => Promise<{ promoted: number; graduated: number }>;
}

/** Backup format version; bump when structure changes so restore can handle old files. */
export const BACKUP_SCHEMA_VERSION = 2;

export interface BackupData {
  schemaVersion?: number; // default 1 for old backups
  schools: School[];
  sessions: Session[];
  classes: StudentClass[];
  students: Student[];
  staff: Staff[];
  expenses: Expense[];
  stocks: Stock[];
  fixedCosts?: FixedMonthlyCost[];
  organizations?: Organization[];
  exportedAt: string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedMonthlyCost[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSchoolId = searchParams.get("schoolId") ?? null;
  const selectedSessionId = searchParams.get("sessionId") ?? null;
  const urlMigratedRef = useRef(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);

  const refetchAll = useCallback(async () => {
    setIsAppLoading(true);
    try {
      const [s, sess] = await Promise.all([
        schoolsRepository.getAll(),
        sessionsRepository.getAll(),
      ]);
      setSchools(s);
      setSessions(sess);
      try {
        const orgs = await organizationsRepository.getAll();
        setOrganizations(orgs);
      } catch {
        setOrganizations([]);
      }
    } catch {
      // Network error — leave state as-is
    } finally {
      setIsAppLoading(false);
    }
  }, []);

  // Run refetch only once user is known (so isSuperAdmin is correct). Avoids double fetch on load.
  useEffect(() => {
    if (user == null) setIsAppLoading(false);
    else refetchAll();
  }, [refetchAll, user]);

  // Backend enforces org-scoping, so schools/sessions from API are already user-scoped
  const filteredSchools = schools;
  const filteredSessions = sessions;
  const filteredClasses = classes;
  const filteredStudents = students;
  const filteredStaff = staff;
  const filteredExpenses = expenses;
  const filteredStocks = stocks;
  const filteredFixedCosts = fixedCosts;
  const filteredOrganizations = useMemo(() => {
    if (!user || user.organizationId == null) return organizations;
    return organizations.filter((o) => o.id === user.organizationId);
  }, [user, organizations]);

  // Migrate from sessionStorage to URL once when URL has no params
  useEffect(() => {
    if (urlMigratedRef.current) return;
    const fromUrl = searchParams.get("schoolId") ?? searchParams.get("sessionId");
    if (fromUrl) {
      urlMigratedRef.current = true;
      return;
    }
    const stored = storage.loadSelection();
    if (stored.schoolId || stored.sessionId) {
      urlMigratedRef.current = true;
      const next = new URLSearchParams(searchParams);
      if (stored.schoolId) next.set("schoolId", stored.schoolId);
      if (stored.sessionId) next.set("sessionId", stored.sessionId);
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Validate selection against scoped data; correct URL when selection is invalid
  useEffect(() => {
    const schoolExists = selectedSchoolId && filteredSchools.some((s) => s.id === selectedSchoolId);
    const sessionExists =
      selectedSchoolId &&
      selectedSessionId &&
      filteredSessions.some((s) => s.id === selectedSessionId && s.schoolId === selectedSchoolId);
    if (filteredSchools.length > 0 && !schoolExists) {
      const next = new URLSearchParams(searchParams);
      next.set("schoolId", filteredSchools[0].id);
      const firstSession = filteredSessions.find((s) => s.schoolId === filteredSchools[0].id);
      if (firstSession) next.set("sessionId", firstSession.id);
      else next.delete("sessionId");
      setSearchParams(next, { replace: true });
      return;
    }
    if (selectedSchoolId && !sessionExists) {
      const first = filteredSessions.find((s) => s.schoolId === selectedSchoolId);
      const next = new URLSearchParams(searchParams);
      if (first) next.set("sessionId", first.id);
      else next.delete("sessionId");
      setSearchParams(next, { replace: true });
    }
  }, [filteredSchools, filteredSessions, selectedSchoolId, selectedSessionId, searchParams, setSearchParams]);

  const setSelectedSchoolId = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(searchParams);
      if (id) {
        next.set("schoolId", id);
        const firstSession = filteredSessions.find((s) => s.schoolId === id);
        if (firstSession) next.set("sessionId", firstSession.id);
        else next.delete("sessionId");
      } else {
        next.delete("schoolId");
        next.delete("sessionId");
      }
      setSearchParams(next, { replace: true });
    },
    [filteredSessions, searchParams, setSearchParams]
  );

  const setSelectedSessionId = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(searchParams);
      if (id) next.set("sessionId", id);
      else next.delete("sessionId");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const toast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = generateId();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const addSchool = useCallback(async (data: Omit<School, "id">) => {
    await schoolsRepository.create(data);
    await refetchAll();
  }, [refetchAll]);

  const updateSchool = useCallback(async (id: string, data: Partial<School>) => {
    await schoolsRepository.update(id, data);
    await refetchAll();
  }, [refetchAll]);

  const deleteSchool = useCallback(
    async (id: string) => {
      await schoolsRepository.delete(id);
      if (selectedSchoolId === id) {
        const next = new URLSearchParams(searchParams);
        next.delete("schoolId");
        next.delete("sessionId");
        setSearchParams(next, { replace: true });
      }
      await refetchAll();
    },
    [refetchAll, selectedSchoolId, searchParams, setSearchParams]
  );

  const addSession = useCallback(async (data: Omit<Session, "id">) => {
    await sessionsRepository.create(data);
    await refetchAll();
  }, [refetchAll]);

  const updateSession = useCallback(async (id: string, data: Partial<Session>) => {
    await sessionsRepository.update(id, data);
    await refetchAll();
  }, [refetchAll]);

  const deleteSession = useCallback(
    async (id: string) => {
      await sessionsRepository.delete(id);
      if (selectedSessionId === id) {
        const next = new URLSearchParams(searchParams);
        next.delete("sessionId");
        setSearchParams(next, { replace: true });
      }
      await refetchAll();
    },
    [refetchAll, selectedSessionId, searchParams, setSearchParams]
  );

  const addClass = useCallback(async (data: Omit<StudentClass, "id">) => {
    await classesRepository.create(data);
    await refetchAll();
  }, [refetchAll]);

  const addClasses = useCallback(async (classes: Omit<StudentClass, "id">[]) => {
    if (classes.length === 0) return;
    await classesRepository.createMany(classes);
    await refetchAll();
  }, [refetchAll]);

  const updateClass = useCallback(async (id: string, data: Partial<StudentClass>) => {
    await classesRepository.update(id, data);
    await refetchAll();
  }, [refetchAll]);

  const deleteClass = useCallback(async (id: string) => {
    await classesRepository.delete(id);
    await refetchAll();
  }, [refetchAll]);

  const addStudent = useCallback(async (data: Omit<Student, "id" | "payments">) => {
    await studentsRepository.create(data);
    await refetchAll();
  }, [refetchAll]);

  const addStudents = useCallback(async (students: Omit<Student, "id" | "payments">[]) => {
    if (students.length === 0) return;
    await studentsRepository.createMany(students);
    await refetchAll();
  }, [refetchAll]);

  const updateStudent = useCallback(async (id: string, data: Partial<Student>) => {
    await studentsRepository.update(id, data);
    await refetchAll();
  }, [refetchAll]);

  const deleteStudent = useCallback(async (id: string) => {
    await studentsRepository.delete(id);
    await refetchAll();
  }, [refetchAll]);

  const addFeePayment = useCallback(async (studentId: string, payment: Omit<FeePayment, "id">): Promise<FeePayment | void> => {
    const created = await studentsRepository.addPayment(studentId, payment);
    await refetchAll();
    return created;
  }, [refetchAll]);

  const addStock = useCallback(async (data: Omit<Stock, "id" | "transactions">) => {
    const createdStock = await stocksRepository.create(data);
    
    // Auto-create expense for stock purchase (live expense tracking)
    await expensesRepository.create({
      sessionId: data.sessionId,
      date: data.purchaseDate,
      amount: data.totalCreditAmount,
      category: "Stock Purchase",
      description: data.description
        ? `Stock purchase: ${data.publisherName} – ${data.description}`
        : `Stock purchase: ${data.publisherName}`,
      vendorPayee: data.publisherName,
      paymentMethod: "Bank Transfer",
    });
    
    await refetchAll();
    return createdStock;
  }, [refetchAll]);

  const addStocks = useCallback(async (stocks: Omit<Stock, "id" | "transactions">[]) => {
    if (stocks.length === 0) return;
    const created = await stocksRepository.createMany(stocks);
    const stockExpenses: Omit<Expense, "id">[] = created.map((s) => ({
      sessionId: s.sessionId,
      date: s.purchaseDate,
      amount: s.totalCreditAmount,
      category: "Stock Purchase" as const,
      description: s.description
        ? `Stock purchase: ${s.publisherName} – ${s.description}`
        : `Stock purchase: ${s.publisherName}`,
      vendorPayee: s.publisherName,
      paymentMethod: "Bank Transfer" as Expense["paymentMethod"],
    }));
    if (stockExpenses.length > 0) await expensesRepository.createMany(stockExpenses);
    await refetchAll();
  }, [refetchAll]);

  const updateStock = useCallback(async (id: string, data: Partial<Stock>) => {
    await stocksRepository.update(id, data);
    await refetchAll();
  }, [refetchAll]);

  const deleteStock = useCallback(async (id: string) => {
    await stocksRepository.delete(id);
    await refetchAll();
  }, [refetchAll]);

  const addStockTransaction = useCallback(async (stockId: string, transaction: Omit<StockTransaction, "id">) => {
    const stock = await stocksRepository.getById(stockId);
    if (!stock) throw new Error("Stock not found");
    
    await stocksRepository.addTransaction(stockId, transaction);
    
    // For sales, the income is recorded by updating the stock value
    // Sales are shown as income in the dashboard calculation
    // No separate expense/income entry needed - dashboard calculates from transactions
    
    await refetchAll();
  }, [refetchAll]);

  // settleStock is kept for backward compatibility but may not be used with new live tracking
  const settleStock = useCallback(async (stockId: string, settledAmount: number) => {
    const stock = await stocksRepository.getById(stockId);
    if (!stock) throw new Error("Stock not found");

    const settledDate = new Date().toISOString().slice(0, 10);
    await stocksRepository.update(stockId, {
      status: "cleared",
      settledDate,
      settledAmount,
    });

    // Note: With live expense tracking, this settlement is for tracking purposes only
    // The expense was already recorded when stock was purchased
    await refetchAll();
  }, [refetchAll]);

  const addStaff = useCallback(async (data: Omit<Staff, "id" | "salaryPayments">) => {
    await staffRepository.create(data);
    await refetchAll();
  }, [refetchAll]);

  const addStaffBatch = useCallback(async (staffMembers: Omit<Staff, "id" | "salaryPayments">[]) => {
    if (staffMembers.length === 0) return;
    await staffRepository.createMany(staffMembers);
    await refetchAll();
  }, [refetchAll]);

  const updateStaff = useCallback(async (id: string, data: Partial<Staff>) => {
    await staffRepository.update(id, data);
    await refetchAll();
  }, [refetchAll]);

  const deleteStaff = useCallback(async (id: string) => {
    await staffRepository.delete(id);
    await refetchAll();
  }, [refetchAll]);

  const updateSalaryPayment = useCallback(
    async (staffId: string, month: string, data: Partial<SalaryPayment>) => {
      const staffMember = await staffRepository.getById(staffId);
      const payment = staffMember?.salaryPayments.find((p) => p.month === month);
      if (!payment || !staffMember) return;
      
      const wasPaid = payment.status === "Paid";
      const willBePaid = data.status === "Paid";
      
      await staffRepository.updateSalaryPayment(staffId, payment.id, data);
      
      // Auto-create expense when marking as Paid (only if not already paid)
      if (!wasPaid && willBePaid) {
        const amount = data.amount ?? payment.amount;
        const paymentDate = data.paymentDate ?? new Date().toISOString().slice(0, 10);
        await expensesRepository.create({
          sessionId: staffMember.sessionId,
          date: paymentDate,
          amount,
          category: "Salary",
          description: `Salary payment for ${staffMember.name} - ${month}`,
          vendorPayee: staffMember.name,
          paymentMethod: (data.method ?? payment.method ?? "Bank Transfer") as Expense["paymentMethod"],
        });
      }
      
      await refetchAll();
    },
    [refetchAll]
  );

  const addSalaryPayment = useCallback(async (staffId: string, payment: Omit<SalaryPayment, "id">) => {
    const staffMember = await staffRepository.getById(staffId);
    if (!staffMember) return;
    
    await staffRepository.addSalaryPayment(staffId, payment);
    
    // Auto-create expense if status is Paid
    if (payment.status === "Paid") {
      const paymentDate = payment.paymentDate ?? new Date().toISOString().slice(0, 10);
      await expensesRepository.create({
        sessionId: staffMember.sessionId,
        date: paymentDate,
        amount: payment.amount,
        category: "Salary",
        description: `Salary payment for ${staffMember.name} - ${payment.month}`,
        vendorPayee: staffMember.name,
        paymentMethod: (payment.method ?? "Bank Transfer") as Expense["paymentMethod"],
      });
    }
    
    await refetchAll();
  }, [refetchAll]);

  const addSalaryPaymentsBatch = useCallback(
    async (payments: { staffId: string; payment: Omit<SalaryPayment, "id"> }[]) => {
      if (payments.length === 0) return;
      const sessionId = selectedSessionId;
      if (!sessionId) return;
      const staffList = await staffRepository.getBySession(sessionId);
      const staffById = new Map(staffList.map((s) => [s.id, s]));
      await staffRepository.addSalaryPaymentsBatch(
        payments.map(({ staffId, payment }) => ({
          staffId,
          payment: {
            ...payment,
            status: payment.status ?? "Paid",
            paymentDate: payment.paymentDate ?? new Date().toISOString().slice(0, 10),
          },
        }))
      );
      const salaryExpenses = payments
        .filter((p) => (p.payment.status ?? "Paid") === "Paid")
        .map(({ staffId, payment }): Omit<Expense, "id"> | null => {
          const staffMember = staffById.get(staffId);
          if (!staffMember) return null;
          return {
            sessionId: staffMember.sessionId,
            date: payment.paymentDate ?? new Date().toISOString().slice(0, 10),
            amount: payment.amount,
            category: "Salary",
            description: `Salary payment for ${staffMember.name} - ${payment.month}`,
            vendorPayee: staffMember.name,
            paymentMethod: (payment.method ?? "Bank Transfer") as Expense["paymentMethod"],
          };
        })
        .filter((e): e is Omit<Expense, "id"> => e !== null);
      if (salaryExpenses.length > 0) await expensesRepository.createMany(salaryExpenses);
      await refetchAll();
    },
    [refetchAll, selectedSessionId]
  );

  const addExpense = useCallback(async (data: Omit<Expense, "id">) => {
    await expensesRepository.create(data);
    await refetchAll();
  }, [refetchAll]);

  const addExpenses = useCallback(async (expenses: Omit<Expense, "id">[]) => {
    if (expenses.length === 0) return;
    await expensesRepository.createMany(expenses);
    await refetchAll();
  }, [refetchAll]);

  const updateExpense = useCallback(async (id: string, data: Partial<Expense>) => {
    await expensesRepository.update(id, data);
    await refetchAll();
  }, [refetchAll]);

  const deleteExpense = useCallback(async (id: string) => {
    await expensesRepository.delete(id);
    await refetchAll();
  }, [refetchAll]);

  const addFixedCost = useCallback(async (data: Omit<FixedMonthlyCost, "id">) => {
    await fixedCostsRepository.create(data);
    await refetchAll();
  }, [refetchAll]);

  const addFixedCosts = useCallback(async (costs: Omit<FixedMonthlyCost, "id">[]) => {
    if (costs.length === 0) return;
    await fixedCostsRepository.createMany(costs);
    await refetchAll();
  }, [refetchAll]);

  const updateFixedCost = useCallback(async (id: string, data: Partial<FixedMonthlyCost>) => {
    await fixedCostsRepository.update(id, data);
    await refetchAll();
  }, [refetchAll]);

  const deleteFixedCost = useCallback(async (id: string) => {
    await fixedCostsRepository.delete(id);
    await refetchAll();
  }, [refetchAll]);

  const loadSampleData = useCallback(async () => {
    try {
      const sampleSchools = createSampleSchools();
      const sampleSessions = createSampleSessions();
      const schoolIdMap: Record<string, string> = {};
      for (const school of sampleSchools) {
        const created = await schoolsRepository.create({
          name: school.name,
          address: school.address,
          contact: school.contact,
          isLocked: school.isLocked,
        });
        schoolIdMap[school.id] = created.id;
      }
      const sessionIdMap: Record<string, string> = {};
      for (const session of sampleSessions) {
        const schoolId = schoolIdMap[session.schoolId];
        if (!schoolId) continue;
        const created = await sessionsRepository.create({
          schoolId,
          year: session.year,
          startDate: session.startDate,
          endDate: session.endDate,
          salaryDueDay: session.salaryDueDay,
        });
        sessionIdMap[session.id] = created.id;
      }
      const sampleClasses = createSampleClasses();
      const classIdMap: Record<string, string> = {};
      for (const cls of sampleClasses) {
        const sessionId = sessionIdMap[cls.sessionId];
        if (!sessionId) continue;
        const created = await classesRepository.create({
          sessionId,
          name: cls.name,
          registrationFees: cls.registrationFees,
          admissionFees: cls.admissionFees,
          annualFund: cls.annualFund,
          monthlyFees: cls.monthlyFees,
          lateFeeAmount: cls.lateFeeAmount,
          lateFeeFrequency: cls.lateFeeFrequency,
          dueDayOfMonth: cls.dueDayOfMonth,
        });
        classIdMap[cls.id] = created.id;
      }
      const sampleStudents = createSampleStudents();
      // Group by session to set sibling links after creation
      const studentsBySession = new Map<string, typeof sampleStudents>();
      for (const stu of sampleStudents) {
        const list = studentsBySession.get(stu.sessionId) ?? [];
        list.push(stu);
        studentsBySession.set(stu.sessionId, list);
      }
      for (const [sampleSessionId, sessionStudents] of studentsBySession) {
        const sessionId = sessionIdMap[sampleSessionId];
        if (!sessionId) continue;
        const createdIds: string[] = [];
        for (const stu of sessionStudents) {
          const classId = stu.classId ? classIdMap[stu.classId] : undefined;
          const created = await studentsRepository.create({
            sessionId,
            classId,
            name: stu.name,
            studentId: stu.studentId,
            feeType: stu.feeType,
            personalDetails: stu.personalDetails,
            registrationFees: stu.registrationFees,
            admissionFees: stu.admissionFees,
            annualFund: stu.annualFund,
            monthlyFees: stu.monthlyFees,
            transportFees: stu.transportFees,
            registrationPaid: stu.registrationPaid,
            admissionPaid: stu.admissionPaid,
            annualFundPaid: stu.annualFundPaid,
            dueDayOfMonth: stu.dueDayOfMonth,
            lateFeeAmount: stu.lateFeeAmount,
            lateFeeFrequency: stu.lateFeeFrequency,
            targetAmount: stu.targetAmount,
            finePerDay: stu.finePerDay,
            dueFrequency: stu.dueFrequency,
            photoUrl: stu.photoUrl,
          });
          createdIds.push(created.id);
        }
        // Set sibling links: first two and next two students per session
        if (createdIds.length >= 2) {
          await studentsRepository.update(createdIds[0], { siblingId: createdIds[1] });
          await studentsRepository.update(createdIds[1], { siblingId: createdIds[0] });
        }
        if (createdIds.length >= 4) {
          await studentsRepository.update(createdIds[2], { siblingId: createdIds[3] });
          await studentsRepository.update(createdIds[3], { siblingId: createdIds[2] });
        }
        for (let i = 0; i < sessionStudents.length && i < createdIds.length; i++) {
          const stu = sessionStudents[i];
          const studentId = createdIds[i];
          for (const p of stu.payments) {
            await studentsRepository.addPayment(studentId, {
              date: p.date,
              amount: p.amount,
              method: p.method,
              receiptNumber: p.receiptNumber,
              feeCategory: p.feeCategory,
              month: p.month,
              receiptPhotoUrl: p.receiptPhotoUrl,
            });
          }
        }
      }
      const sampleStaffList = createSampleStaff();
      for (const s of sampleStaffList) {
        const sessionId = sessionIdMap[s.sessionId];
        if (!sessionId) continue;
        await staffRepository.create({
          sessionId,
          name: s.name,
          employeeId: s.employeeId,
          role: s.role,
          monthlySalary: s.monthlySalary,
          subjectOrGrade: s.subjectOrGrade,
        });
      }
      const sampleExpensesList = createSampleExpenses();
      for (const e of sampleExpensesList) {
        const sessionId = sessionIdMap[e.sessionId];
        if (!sessionId) continue;
        await expensesRepository.create({
          sessionId,
          date: e.date,
          amount: e.amount,
          category: e.category,
          description: e.description,
          vendorPayee: e.vendorPayee,
          paymentMethod: e.paymentMethod,
          tags: e.tags,
        });
      }
      const sampleStocksList = createSampleStocks();
      for (const st of sampleStocksList) {
        const sessionId = sessionIdMap[st.sessionId];
        if (!sessionId) continue;
        const created = await stocksRepository.create({
          sessionId,
          publisherName: st.publisherName,
          description: st.description,
          purchaseDate: st.purchaseDate,
          totalCreditAmount: st.totalCreditAmount,
          status: st.status,
          settledDate: st.settledDate,
          settledAmount: st.settledAmount,
          notes: st.notes,
        });
        for (const tx of st.transactions) {
          await stocksRepository.addTransaction(created.id, {
            date: tx.date,
            type: tx.type,
            amount: tx.amount,
            quantity: tx.quantity,
            description: tx.description,
            receiptNumber: tx.receiptNumber,
          });
        }
      }
      const sampleFixedCostsList = createSampleFixedCosts();
      for (const fc of sampleFixedCostsList) {
        const sessionId = sessionIdMap[fc.sessionId];
        if (!sessionId) continue;
        await fixedCostsRepository.create({
          sessionId,
          name: fc.name,
          amount: fc.amount,
          category: fc.category,
          isActive: fc.isActive,
        });
      }
      await refetchAll();
      const firstSchoolId = schoolIdMap["s1"];
      const sess2Id = sessionIdMap["sess2"];
      if (firstSchoolId || sess2Id) {
        const next = new URLSearchParams(searchParams);
        if (firstSchoolId) next.set("schoolId", firstSchoolId);
        if (sess2Id) next.set("sessionId", sess2Id);
        setSearchParams(next, { replace: true });
      }
    } catch (err) {
      toast(String(err), "error");
    }
  }, [refetchAll, toast, searchParams, setSearchParams]);

  const clearAllData = useCallback(() => {
    setSchools([]);
    setSessions([]);
    setClasses([]);
    setStudents([]);
    setStaff([]);
    setExpenses([]);
    setStocks([]);
    setFixedCosts([]);
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const exportData = useCallback(async (): Promise<BackupData> => {
    const [allClasses, allStudents, allStaff, allExpenses, allStocks, allFixedCosts] = await Promise.all([
      classesRepository.getAll(),
      studentsRepository.getAll(),
      staffRepository.getAll(),
      expensesRepository.getAll(),
      stocksRepository.getAll(),
      fixedCostsRepository.getAll(),
    ]);
    return {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      schools,
      sessions,
      classes: allClasses,
      students: allStudents,
      staff: allStaff,
      expenses: allExpenses,
      stocks: allStocks,
      fixedCosts: allFixedCosts,
      organizations,
      exportedAt: new Date().toISOString(),
    };
  }, [schools, sessions, organizations]);

  const importData = useCallback(async (data: BackupData) => {
    if (
      !data ||
      !Array.isArray(data.schools) ||
      !Array.isArray(data.sessions) ||
      !Array.isArray(data.students) ||
      !Array.isArray(data.staff) ||
      !Array.isArray(data.expenses)
    ) {
      throw new Error("Invalid backup format");
    }
    // Restore organizations first (optional; v2+)
    const orgList = Array.isArray(data.organizations) ? data.organizations : [];
    for (const org of orgList) {
      try {
        await organizationsRepository.create(org);
      } catch {
        // may already exist or name conflict; skip
      }
    }
    const schoolIdMap: Record<string, string> = {};
    for (const school of data.schools) {
      const created = await schoolsRepository.create(school);
      schoolIdMap[school.id] = created.id;
    }
    const sessionIdMap: Record<string, string> = {};
    for (const session of data.sessions) {
      const schoolId = schoolIdMap[session.schoolId];
      if (!schoolId) continue;
      const created = await sessionsRepository.create(session);
      sessionIdMap[session.id] = created.id;
    }
    const classIdMap: Record<string, string> = {};
    const classesList = Array.isArray(data.classes) ? data.classes : [];
    for (const cls of classesList) {
      const sessionId = sessionIdMap[cls.sessionId];
      if (!sessionId) continue;
      const created = await classesRepository.create(cls);
      classIdMap[cls.id] = created.id;
    }
    for (const stu of data.students) {
      const sessionId = sessionIdMap[stu.sessionId];
      if (!sessionId) continue;
      const classId = stu.classId ? classIdMap[stu.classId] : undefined;
      const { payments, id: _omitId, ...studentData } = stu;
      const created = await studentsRepository.create({
        ...studentData,
        sessionId,
        classId,
      });
      // Restore fee payments for this student (v2 format)
      const paymentsList = Array.isArray(payments) ? payments : [];
      for (const p of paymentsList) {
        try {
          await studentsRepository.addPayment(created.id, {
            date: p.date,
            amount: p.amount,
            method: p.method,
            receiptNumber: p.receiptNumber ?? "",
            feeCategory: p.feeCategory,
            month: p.month,
            receiptPhotoUrl: p.receiptPhotoUrl,
          });
        } catch {
          // skip duplicate or invalid payment
        }
      }
    }
    for (const s of data.staff) {
      const sessionId = sessionIdMap[s.sessionId];
      if (!sessionId) continue;
      await staffRepository.create({
        sessionId,
        name: s.name,
        employeeId: s.employeeId,
        role: s.role,
        monthlySalary: s.monthlySalary,
        subjectOrGrade: s.subjectOrGrade,
      });
    }
    for (const e of data.expenses) {
      const sessionId = sessionIdMap[e.sessionId];
      if (!sessionId) continue;
      await expensesRepository.create(e);
    }
    const stocksList = Array.isArray(data.stocks) ? data.stocks : [];
    for (const st of stocksList) {
      const sessionId = sessionIdMap[st.sessionId];
      if (!sessionId) continue;
      await stocksRepository.create({
        sessionId,
        publisherName: st.publisherName,
        description: st.description,
        purchaseDate: st.purchaseDate,
        totalCreditAmount: st.totalCreditAmount,
        status: st.status,
        settledDate: st.settledDate,
        settledAmount: st.settledAmount,
        notes: st.notes,
      });
    }
    await refetchAll();
    const firstSchool = data.schools[0];
    const firstSession = firstSchool
      ? data.sessions.find((s) => s.schoolId === firstSchool.id) ?? data.sessions[0]
      : null;
    const newSchoolId = firstSchool?.id ? schoolIdMap[firstSchool.id] : null;
    const newSessionId = firstSession?.id ? sessionIdMap[firstSession.id] : null;
    if (newSchoolId || newSessionId) {
      const next = new URLSearchParams(searchParams);
      if (newSchoolId) next.set("schoolId", newSchoolId);
      if (newSessionId) next.set("sessionId", newSessionId);
      setSearchParams(next, { replace: true });
    }
  }, [refetchAll, searchParams, setSearchParams]);

  const promoteStudentsToNewSession = useCallback(
    async (fromSessionId: string, toSessionId: string): Promise<{ promoted: number; graduated: number }> => {
      const fromStudents = await studentsRepository.getBySession(fromSessionId);
      const fromClasses = await classesRepository.getBySession(fromSessionId);
      const toClasses = await classesRepository.getBySession(toSessionId);

      let promoted = 0;
      let graduated = 0;

      for (const student of fromStudents) {
        const currentClass = fromClasses.find((c) => c.id === student.classId);
        const currentClassName = currentClass?.name;
        const { payments: _p, ...studentData } = student;

        if (!currentClassName) {
          await studentsRepository.create({
            ...studentData,
            sessionId: toSessionId,
            classId: undefined,
            registrationPaid: false,
            admissionPaid: false,
            annualFundPaid: false,
          });
          promoted++;
          continue;
        }

        const nextClassName = getNextClassName(currentClassName);

        if (!nextClassName) {
          graduated++;
          continue;
        }

        const nextClass = toClasses.find(
          (c) => c.name.toLowerCase() === nextClassName.toLowerCase()
        );

        await studentsRepository.create({
          ...studentData,
          sessionId: toSessionId,
          classId: nextClass?.id,
          registrationFees: nextClass?.registrationFees ?? student.registrationFees,
          admissionFees: nextClass?.admissionFees ?? student.admissionFees,
          annualFund: nextClass?.annualFund ?? student.annualFund,
          monthlyFees: nextClass?.monthlyFees ?? student.monthlyFees,
          dueDayOfMonth: nextClass?.dueDayOfMonth ?? student.dueDayOfMonth,
          lateFeeAmount: nextClass?.lateFeeAmount ?? student.lateFeeAmount,
          lateFeeFrequency: nextClass?.lateFeeFrequency ?? student.lateFeeFrequency,
          registrationPaid: false,
          admissionPaid: false,
          annualFundPaid: false,
          targetAmount: undefined,
        });
        promoted++;
      }

      if (promoted > 0) await refetchAll();
      return { promoted, graduated };
    },
    [refetchAll]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      schools: filteredSchools,
      sessions: filteredSessions,
      classes: filteredClasses,
      students: filteredStudents,
      staff: filteredStaff,
      expenses: filteredExpenses,
      stocks: filteredStocks,
      fixedCosts: filteredFixedCosts,
      organizations: filteredOrganizations,
      selectedSchoolId,
      selectedSessionId,
      toasts,
      isAppLoading,
      setSelectedSchool: setSelectedSchoolId,
      setSelectedSession: setSelectedSessionId,
      addSchool,
      updateSchool,
      deleteSchool,
      addSession,
      updateSession,
      deleteSession,
      addClass,
      addClasses,
      updateClass,
      deleteClass,
      addStudent,
      addStudents,
      updateStudent,
      deleteStudent,
      addFeePayment,
      addStock,
      addStocks,
      updateStock,
      deleteStock,
      addStockTransaction,
      settleStock,
      addStaff,
      addStaffBatch,
      updateStaff,
      deleteStaff,
      updateSalaryPayment,
      addSalaryPayment,
      addSalaryPaymentsBatch,
      addExpense,
      addExpenses,
      updateExpense,
      deleteExpense,
      addFixedCost,
      addFixedCosts,
      updateFixedCost,
      deleteFixedCost,
      toast,
      dismissToast,
      loadSampleData,
      clearAllData,
      exportData,
      importData,
      promoteStudentsToNewSession,
    }),
    [
      filteredSchools,
      filteredSessions,
      filteredClasses,
      filteredStudents,
      filteredStaff,
      filteredExpenses,
      filteredStocks,
      filteredFixedCosts,
      filteredOrganizations,
      selectedSchoolId,
      selectedSessionId,
      toasts,
      isAppLoading,
      addSchool,
      updateSchool,
      deleteSchool,
      addSession,
      updateSession,
      deleteSession,
      addClass,
      addClasses,
      updateClass,
      deleteClass,
      addStudent,
      addStudents,
      updateStudent,
      deleteStudent,
      addFeePayment,
      addStock,
      addStocks,
      updateStock,
      deleteStock,
      addStockTransaction,
      settleStock,
      addStaff,
      addStaffBatch,
      updateStaff,
      deleteStaff,
      updateSalaryPayment,
      addSalaryPayment,
      addSalaryPaymentsBatch,
      addExpense,
      addExpenses,
      updateExpense,
      deleteExpense,
      addFixedCost,
      addFixedCosts,
      updateFixedCost,
      deleteFixedCost,
      toast,
      dismissToast,
      loadSampleData,
      clearAllData,
      exportData,
      importData,
      promoteStudentsToNewSession,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
