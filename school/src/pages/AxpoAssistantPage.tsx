import { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { useClassesBySession } from "../hooks/useClasses";
import { useStudentsBySession } from "../hooks/useStudents";
import { useStaffBySession } from "../hooks/useStaff";
import { useExpensesBySession } from "../hooks/useExpenses";
import { useStocksBySession } from "../hooks/useStocks";
import { useFixedCostsBySession } from "../hooks/useFixedCosts";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ChatMessage, type ChatMessageData } from "../components/assistant/ChatMessage";
import { InlineFormCard } from "../components/assistant/InlineFormCard";
import { type AnalyticsData } from "../components/assistant/AnalyticsCard";
import {
  parseAxpoIntent,
  isLLMAvailable,
  MAX_BATCH_SIZE,
  type IntentResult,
  type ParsedStudentData,
  type ParsedStaffData,
  type ParsedSalaryPaymentData,
  type ParsedExpenseData,
  type ParsedStockData,
  type ParsedFixedCostData,
  type ParsedClassData,
  type ParsedAnalyticsQuery,
  isMultipleStudents,
  isMultipleStaff,
  isMultipleExpenses,
  isMultipleStocks,
  isMultipleFixedCosts,
  isMultipleClasses,
  isMultipleSalaryPayments,
} from "../lib/axpoAssistantParser";
import { resolveClassLabel } from "../lib/studentChatParser";
import { detectCSV, detectCSVType, parseStudentsCSV, parseStaffCSV, parseClassesCSV } from "../lib/csvParser";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  Users,
  DollarSign,
  Package,
  Receipt,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import type {
  Student,
  Staff,
  Expense,
  Stock,
  FixedMonthlyCost,
  FeeType,
} from "../types";
import { getTotalPaid, getRemaining } from "../lib/studentUtils";
import { generateId } from "../lib/utils";
import { loadChatHistory, saveChatHistory, type StoredChatMessage } from "../lib/assistantChatHistory";
import { useAuth } from "../context/AuthContext";
import { SUPER_ADMIN_ROLE_NAME } from "../types/auth";

// ============================================================================
// Types
// ============================================================================

interface PendingAction {
  id: string;
  intentResult: IntentResult;
  resolvedData: Record<string, unknown> | Record<string, unknown>[];
}

// ============================================================================
// Suggestion Prompts
// ============================================================================

const SUGGESTIONS = [
  { icon: <Users className="h-3.5 w-3.5" />, label: "Add Student", prompt: "Add student Rahul to class 1" },
  { icon: <Users className="h-3.5 w-3.5" />, label: "Add Class", prompt: "Add class 5 with monthly fee 4000 and admission 3000" },
  { icon: <Users className="h-3.5 w-3.5" />, label: "Add Staff", prompt: "Add teacher Priya with salary 25000" },
  { icon: <DollarSign className="h-3.5 w-3.5" />, label: "Pay Salary", prompt: "Pay this month's salary to Priya" },
  { icon: <Receipt className="h-3.5 w-3.5" />, label: "Add Expense", prompt: "Add expense 5000 for electricity" },
  { icon: <Package className="h-3.5 w-3.5" />, label: "Add Stock", prompt: "Add stock from ABC Publishers for 50000" },
  { icon: <BarChart3 className="h-3.5 w-3.5" />, label: "Salary Summary", prompt: "Show this month's salary status" },
];

// ============================================================================
// Component
// ============================================================================

function toStoredMessage(m: ChatMessageData): StoredChatMessage {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp.toISOString(),
    isError: m.isError,
    analytics: m.analytics,
  };
}

function fromStoredMessage(m: StoredChatMessage): ChatMessageData {
  return {
    ...m,
    timestamp: new Date(m.timestamp),
    analytics: m.analytics as ChatMessageData["analytics"],
  };
}

export function AxpoAssistantPage() {
  const { hasPermission, user } = useAuth();
  const {
    selectedSessionId,
    selectedSchoolId,
    schools,
    sessions,
    addStudent,
    addStudents,
    updateStudent,
    deleteStudent,
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
    addStock,
    addStocks,
    updateStock,
    deleteStock,
    addStockTransaction,
    addFixedCost,
    addFixedCosts,
    updateFixedCost,
    deleteFixedCost,
    addClass,
    addClasses,
    toast,
  } = useApp();

  const { data: classes = [] } = useClassesBySession(selectedSessionId ?? "");
  const { data: students = [] } = useStudentsBySession(selectedSessionId ?? "");
  const { data: staff = [] } = useStaffBySession(selectedSessionId ?? "");
  const { data: expenses = [] } = useExpensesBySession(selectedSessionId ?? "");
  const { data: stocks = [] } = useStocksBySession(selectedSessionId ?? "");
  const { data: fixedCosts = [] } = useFixedCostsBySession(selectedSessionId ?? "");

  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [visibleCount, setVisibleCount] = useState(30); // Lazy loading: show last N messages
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedSchool = selectedSchoolId ? schools.find((s) => s.id === selectedSchoolId) : null;
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const sessionClasses = classes;
  const sessionStudents = students;
  const sessionStaff = staff;
  const sessionExpenses = expenses;
  const sessionStocks = stocks;
  const sessionFixedCosts = fixedCosts;

  const isSuperAdmin = user?.role?.name === SUPER_ADMIN_ROLE_NAME;
  const canAccessAssistant = hasPermission("assistant:use") || isSuperAdmin;
  const canUseAssistant = canAccessAssistant;
  const useLLM = isLLMAvailable();

  // Load chat history when session changes (from DB or localStorage)
  useEffect(() => {
    if (!selectedSessionId || !canUseAssistant) return;
    let cancelled = false;
    loadChatHistory(selectedSessionId).then((stored) => {
      if (cancelled) return;
      if (stored.length > 0) {
        setMessages(stored.map(fromStoredMessage));
      } else {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: `Hello! I'm Axpo Assistant. I can help you manage students, staff, expenses, stocks, and more using natural language.\n\nTry saying things like:\n- "Add student Rahul to class 1"\n- "Pay this month's salary to all teachers"\n- "Show me outstanding fees"\n\nHow can I help you today?`,
            timestamp: new Date(),
          },
        ]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedSessionId, canUseAssistant]);

  // Persist chat history when messages change (to DB or localStorage)
  useEffect(() => {
    if (!selectedSessionId || !canUseAssistant || messages.length === 0) return;
    void saveChatHistory(selectedSessionId, messages.map(toStoredMessage));
  }, [selectedSessionId, canUseAssistant, messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingAction]);

  // ============================================================================
  // Analytics Computation
  // ============================================================================

  const computeAnalytics = useCallback(
    (query: ParsedAnalyticsQuery): AnalyticsData | null => {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const targetMonth = query.month || currentMonth;

      switch (query.queryType) {
        case "salary_summary": {
          const totalObligation = sessionStaff.reduce((sum, s) => sum + s.monthlySalary, 0);
          const paidThisMonth = sessionStaff.reduce((sum, s) => {
            const payment = s.salaryPayments.find((p) => p.month === targetMonth && p.status === "Paid");
            return sum + (payment?.amount || 0);
          }, 0);
          const pendingCount = sessionStaff.filter((s) => {
            const payment = s.salaryPayments.find((p) => p.month === targetMonth);
            return !payment || payment.status !== "Paid";
          }).length;
          return {
            type: "salary_summary",
            title: `Salary Summary - ${targetMonth}`,
            metrics: [
              { label: "Total Obligation", value: totalObligation, format: "currency" },
              { label: "Paid", value: paidThisMonth, format: "currency" },
              { label: "Remaining", value: totalObligation - paidThisMonth, format: "currency" },
              { label: "Staff Pending", value: pendingCount, format: "number" },
            ],
          };
        }
        case "fee_collection_summary": {
          const totalCollected = sessionStudents.reduce((sum, s) => sum + getTotalPaid(s), 0);
          const totalPending = sessionStudents.reduce((sum, s) => {
            const studentClass = sessionClasses.find((c) => c.id === s.classId);
            return sum + getRemaining(s, studentClass);
          }, 0);
          return {
            type: "fee_collection_summary",
            title: "Fee Collection Summary",
            metrics: [
              { label: "Total Collected", value: totalCollected, format: "currency" },
              { label: "Total Pending", value: totalPending, format: "currency" },
              { label: "Students", value: sessionStudents.length, format: "number" },
            ],
          };
        }
        case "expenses_summary": {
          const total = sessionExpenses.reduce((sum, e) => sum + e.amount, 0);
          const byCategory: Record<string, number> = {};
          sessionExpenses.forEach((e) => {
            byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
          });
          return {
            type: "expenses_summary",
            title: "Expenses Summary",
            metrics: [
              { label: "Total Expenses", value: total, format: "currency" },
              ...Object.entries(byCategory).slice(0, 5).map(([cat, val]) => ({
                label: cat,
                value: val,
                format: "currency" as const,
              })),
            ],
          };
        }
        case "outstanding_fees": {
          const studentsWithPending = sessionStudents.filter((s) => {
            const studentClass = sessionClasses.find((c) => c.id === s.classId);
            return getRemaining(s, studentClass) > 0;
          });
          const totalOutstanding = studentsWithPending.reduce((sum, s) => {
            const studentClass = sessionClasses.find((c) => c.id === s.classId);
            return sum + getRemaining(s, studentClass);
          }, 0);
          return {
            type: "outstanding_fees",
            title: "Outstanding Fees",
            metrics: [
              { label: "Total Outstanding", value: totalOutstanding, format: "currency" },
              { label: "Students with Dues", value: studentsWithPending.length, format: "number" },
            ],
            details: studentsWithPending.slice(0, 5).map((s) => {
              const studentClass = sessionClasses.find((c) => c.id === s.classId);
              return {
                name: s.name,
                value: getRemaining(s, studentClass),
              };
            }),
          };
        }
        case "stock_balance": {
          const openStocks = sessionStocks.filter((s) => s.status === "open");
          const totalCredit = openStocks.reduce((sum, s) => sum + s.totalCreditAmount, 0);
          const totalPaid = openStocks.reduce(
            (sum, s) => sum + s.transactions.filter((t) => t.type === "sale").reduce((ts, t) => ts + t.amount, 0),
            0
          );
          return {
            type: "stock_balance",
            title: "Stock Balance",
            metrics: [
              { label: "Total Credit", value: totalCredit, format: "currency" },
              { label: "Total Recovered", value: totalPaid, format: "currency" },
              { label: "Remaining", value: totalCredit - totalPaid, format: "currency" },
              { label: "Open Stocks", value: openStocks.length, format: "number" },
            ],
          };
        }
        case "dashboard_overview": {
          const feeCollected = sessionStudents.reduce((sum, s) => sum + getTotalPaid(s), 0);
          const totalExpenses = sessionExpenses.reduce((sum, e) => sum + e.amount, 0);
          return {
            type: "dashboard_overview",
            title: "Dashboard Overview",
            metrics: [
              { label: "Students", value: sessionStudents.length, format: "number" },
              { label: "Staff", value: sessionStaff.length, format: "number" },
              { label: "Fee Collected", value: feeCollected, format: "currency" },
              { label: "Total Expenses", value: totalExpenses, format: "currency" },
              { label: "Net", value: feeCollected - totalExpenses, format: "currency" },
            ],
          };
        }
        default:
          return null;
      }
    },
    [sessionStudents, sessionStaff, sessionExpenses, sessionStocks, sessionClasses]
  );

  // ============================================================================
  // CRUD Handlers
  // ============================================================================

  const executeAction = useCallback(
    async (action: PendingAction): Promise<{ success: boolean; message: string }> => {
      const { intentResult, resolvedData } = action;
      const items: Record<string, unknown>[] = Array.isArray(resolvedData) ? resolvedData : [resolvedData];

      try {
        switch (intentResult.intent) {
          case "add_student": {
            const studentPayload = (items as Partial<Student>[]).map((studentData) => ({
              sessionId: selectedSessionId!,
              name: studentData.name || "Unknown",
              studentId: studentData.studentId || `STU-${Date.now()}`,
              feeType: (studentData.feeType || "Regular") as FeeType,
              classId: studentData.classId,
              personalDetails: studentData.personalDetails,
              registrationFees: studentData.registrationFees,
              admissionFees: studentData.admissionFees,
              annualFund: studentData.annualFund,
              monthlyFees: studentData.monthlyFees,
              dueDayOfMonth: studentData.dueDayOfMonth,
              lateFeeAmount: studentData.lateFeeAmount,
              lateFeeFrequency: studentData.lateFeeFrequency,
            }));
            await addStudents(studentPayload);
            const n = items.length;
            return { success: true, message: n === 1 ? `Student "${(items[0] as Partial<Student>).name}" added successfully!` : `${n} students added successfully!` };
          }

          case "update_student": {
            const studentData = items[0] as Partial<Student> & { id: string };
            if (!studentData?.id) return { success: false, message: "Student ID required for update." };
            updateStudent(studentData.id, studentData);
            return { success: true, message: `Student updated successfully!` };
          }

          case "delete_student": {
            const { id } = items[0] as { id: string };
            if (!id) return { success: false, message: "Student ID required for deletion." };
            deleteStudent(id);
            return { success: true, message: "Student deleted successfully!" };
          }

          case "add_staff": {
            const staffPayload = (items as Partial<Staff>[]).map((staffData) => ({
              sessionId: selectedSessionId!,
              name: staffData.name || "Unknown",
              employeeId: staffData.employeeId || `EMP-${Date.now()}`,
              role: staffData.role || "Teacher",
              monthlySalary: staffData.monthlySalary || 0,
              subjectOrGrade: staffData.subjectOrGrade,
            }));
            await addStaffBatch(staffPayload);
            const n = items.length;
            return { success: true, message: n === 1 ? `Staff "${(items[0] as Partial<Staff>).name}" added successfully!` : `${n} staff members added successfully!` };
          }

          case "update_staff": {
            const staffData = items[0] as Partial<Staff> & { id: string };
            if (!staffData?.id) return { success: false, message: "Staff ID required for update." };
            updateStaff(staffData.id, staffData);
            return { success: true, message: `Staff updated successfully!` };
          }

          case "delete_staff": {
            const { id } = items[0] as { id: string };
            if (!id) return { success: false, message: "Staff ID required for deletion." };
            deleteStaff(id);
            return { success: true, message: "Staff deleted successfully!" };
          }

          case "pay_salary": {
            const payments = items as unknown as (ParsedSalaryPaymentData & { staffId: string })[];
            const toUpdate: { staffId: string; month: string; staffMember: { monthlySalary: number } }[] = [];
            const toAdd: { staffId: string; payment: Omit<import("../types").SalaryPayment, "id"> }[] = [];
            for (const p of payments) {
              if (!p.staffId) return { success: false, message: "Staff not found." };
              const staffMember = sessionStaff.find((s) => s.id === p.staffId);
              if (!staffMember) return { success: false, message: `Staff not found: ${p.staffName || p.staffId}` };
              const existing = staffMember.salaryPayments.find((x) => x.month === p.month);
              const paymentPayload = {
                month: p.month,
                amount: p.amount || staffMember.monthlySalary,
                status: (p.status || "Paid") as "Paid" | "Pending" | "Partially Paid",
                paymentDate: p.paymentDate || new Date().toISOString().split("T")[0],
                method: (p.method || "Cash") as import("../types").PaymentMethod | undefined,
              };
              if (existing) toUpdate.push({ staffId: p.staffId, month: p.month, staffMember });
              else toAdd.push({ staffId: p.staffId, payment: paymentPayload });
            }
            for (const { staffId, month, staffMember } of toUpdate) {
              const p = payments.find((x) => x.staffId === staffId && x.month === month)!;
              await updateSalaryPayment(staffId, month, {
                amount: p.amount || staffMember.monthlySalary,
                status: (p.status || "Paid") as "Paid" | "Pending" | "Partially Paid",
                paymentDate: p.paymentDate || new Date().toISOString().split("T")[0],
                method: (p.method || "Cash") as import("../types").PaymentMethod | undefined,
              });
            }
            if (toAdd.length > 0) await addSalaryPaymentsBatch(toAdd);
            const n = items.length;
            return { success: true, message: n === 1 ? `Salary paid for ${(items[0] as unknown as ParsedSalaryPaymentData).month}!` : `${n} salary payments recorded!` };
          }

          case "add_expense": {
            const expensePayload = (items as Partial<Expense>[]).map((expenseData) => ({
              sessionId: selectedSessionId!,
              date: (expenseData.date as string) || new Date().toISOString().split("T")[0],
              amount: expenseData.amount || 0,
              category: expenseData.category || "Miscellaneous",
              description: expenseData.description || "",
              vendorPayee: expenseData.vendorPayee || "",
              paymentMethod: expenseData.paymentMethod || "Cash",
            }));
            await addExpenses(expensePayload);
            const n = items.length;
            return { success: true, message: n === 1 ? `Expense of ₹${(items[0] as Partial<Expense>).amount} added!` : `${n} expenses added!` };
          }

          case "update_expense": {
            const expenseData = items[0] as Partial<Expense> & { id: string };
            if (!expenseData?.id) return { success: false, message: "Expense ID required for update." };
            updateExpense(expenseData.id, expenseData);
            return { success: true, message: `Expense updated successfully!` };
          }

          case "delete_expense": {
            const { id } = items[0] as { id: string };
            if (!id) return { success: false, message: "Expense ID required for deletion." };
            deleteExpense(id);
            return { success: true, message: "Expense deleted successfully!" };
          }

          case "add_stock": {
            const stockPayload = (items as Partial<Stock>[]).map((stockData) => ({
              sessionId: selectedSessionId!,
              publisherName: stockData.publisherName || "Unknown",
              description: stockData.description || "",
              purchaseDate: stockData.purchaseDate || new Date().toISOString().split("T")[0],
              totalCreditAmount: stockData.totalCreditAmount || 0,
              status: "open" as const,
            }));
            await addStocks(stockPayload);
            const n = items.length;
            return { success: true, message: n === 1 ? `Stock from "${(items[0] as Partial<Stock>).publisherName}" added!` : `${n} stocks added!` };
          }

          case "update_stock": {
            const stockData = items[0] as Partial<Stock> & { id: string };
            if (!stockData?.id) return { success: false, message: "Stock ID required for update." };
            updateStock(stockData.id, stockData);
            return { success: true, message: `Stock updated successfully!` };
          }

          case "delete_stock": {
            const { id } = items[0] as { id: string };
            if (!id) return { success: false, message: "Stock ID required for deletion." };
            deleteStock(id);
            return { success: true, message: "Stock deleted successfully!" };
          }

          case "record_stock_transaction": {
            const txData = items[0] as { stockId: string; type: "purchase" | "sale" | "return"; amount: number; quantity?: number; description?: string };
            if (!txData?.stockId) return { success: false, message: "Stock not found." };
            addStockTransaction(txData.stockId, {
              date: new Date().toISOString().split("T")[0],
              type: txData.type,
              amount: txData.amount,
              quantity: txData.quantity,
              description: txData.description || "",
            });
            return { success: true, message: `Stock transaction recorded successfully!` };
          }

          case "add_fixed_cost": {
            const costPayload = (items as Partial<FixedMonthlyCost>[]).map((costData) => ({
              sessionId: selectedSessionId!,
              name: costData.name || "Unknown",
              amount: costData.amount || 0,
              category: costData.category || "Miscellaneous",
              isActive: costData.isActive !== false,
            }));
            await addFixedCosts(costPayload);
            const n = items.length;
            return { success: true, message: n === 1 ? `Fixed cost "${(items[0] as Partial<FixedMonthlyCost>).name}" added!` : `${n} fixed costs added!` };
          }

          case "add_class": {
            const classPayload = (items as { name: string; registrationFees?: number; admissionFees?: number; annualFund?: number; monthlyFees?: number; lateFeeAmount?: number; lateFeeFrequency?: "daily" | "weekly"; dueDayOfMonth?: number }[])
              .map((classData) => {
                const name = (classData.name || "").trim();
                if (!name) return null;
                return {
                  sessionId: selectedSessionId!,
                  name,
                  registrationFees: Number(classData.registrationFees) || 0,
                  admissionFees: Number(classData.admissionFees) || 0,
                  annualFund: Number(classData.annualFund) || 0,
                  monthlyFees: Number(classData.monthlyFees) || 0,
                  lateFeeAmount: Number(classData.lateFeeAmount) || 0,
                  lateFeeFrequency: (classData.lateFeeFrequency as "daily" | "weekly") || "weekly",
                  dueDayOfMonth: Number(classData.dueDayOfMonth) || 10,
                };
              })
              .filter((c): c is NonNullable<typeof c> => c !== null);
            if (classPayload.length !== items.length) return { success: false, message: "Class name is required." };
            await addClasses(classPayload);
            const n = items.length;
            return { success: true, message: n === 1 ? `Class "${(items[0] as { name: string }).name}" added!` : `${n} classes added!` };
          }

          case "update_fixed_cost": {
            const costData = items[0] as Partial<FixedMonthlyCost> & { id: string };
            if (!costData?.id) return { success: false, message: "Fixed cost ID required for update." };
            updateFixedCost(costData.id, costData);
            return { success: true, message: `Fixed cost updated successfully!` };
          }

          case "delete_fixed_cost": {
            const { id } = items[0] as { id: string };
            if (!id) return { success: false, message: "Fixed cost ID required for deletion." };
            deleteFixedCost(id);
            return { success: true, message: "Fixed cost deleted successfully!" };
          }

          default:
            return { success: false, message: "Unknown action." };
        }
      } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "An error occurred." };
      }
    },
    [
      selectedSessionId,
      sessionStaff,
      addStudent,
      addStudents,
      updateStudent,
      deleteStudent,
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
      addStock,
      addStocks,
      updateStock,
      deleteStock,
      addStockTransaction,
      addFixedCost,
      addFixedCosts,
      updateFixedCost,
      deleteFixedCost,
      addClass,
      addClasses,
    ]
  );

  // ============================================================================
  // Message Handling
  // ============================================================================

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isProcessing || !selectedSessionId) return;

    // Add user message
    const userMessage: ChatMessageData = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      // Check for CSV input first
      if (detectCSV(trimmed)) {
        const csvType = detectCSVType(trimmed);

        if (csvType === "students") {
          const parseResult = parseStudentsCSV(trimmed);
          if (parseResult.success && parseResult.data.length > 0) {
            const csvMessage: ChatMessageData = {
              id: generateId(),
              role: "assistant",
              content: `Found ${parseResult.data.length} student(s) in CSV. I'll help you add them one by one. Starting with the first student:`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, csvMessage]);

            const firstStudent = parseResult.data[0];
            const resolved = resolveClassLabel(firstStudent.classLabel, sessionClasses);

            if (firstStudent.classLabel && !resolved.classId) {
              const warningMessage: ChatMessageData = {
                id: generateId(),
                role: "assistant",
                content: `Class "${firstStudent.classLabel}" doesn't exist yet. Please create it first, then try importing again.`,
                timestamp: new Date(),
                isError: true,
              };
              setMessages((prev) => [...prev, warningMessage]);
              return;
            }

            setPendingAction({
              id: generateId(),
              intentResult: {
                success: true,
                intent: "add_student",
                entity: "student",
                operation: "add",
                message: `Add student "${firstStudent.name}"`,
              },
              resolvedData: {
                name: firstStudent.name,
                classId: resolved.classId,
                classLabel: firstStudent.classLabel,
                feeType: firstStudent.feeType || "Regular",
                studentId: firstStudent.studentId || `STU-${Date.now()}`,
                personalDetails: {
                  fatherName: firstStudent.fatherName,
                  motherName: firstStudent.motherName,
                  guardianPhone: firstStudent.phone,
                },
                registrationFees: resolved.registrationFees,
                admissionFees: resolved.admissionFees,
                annualFund: resolved.annualFund,
                monthlyFees: resolved.monthlyFees,
                dueDayOfMonth: resolved.dueDayOfMonth,
                lateFeeAmount: resolved.lateFeeAmount,
                lateFeeFrequency: resolved.lateFeeFrequency,
              },
            });
            return;
          }
        } else if (csvType === "staff") {
          const parseResult = parseStaffCSV(trimmed);
          if (parseResult.success && parseResult.data.length > 0) {
            const csvMessage: ChatMessageData = {
              id: generateId(),
              role: "assistant",
              content: `Found ${parseResult.data.length} staff member(s) in CSV. Starting with the first:`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, csvMessage]);

            const firstStaff = parseResult.data[0];
            setPendingAction({
              id: generateId(),
              intentResult: {
                success: true,
                intent: "add_staff",
                entity: "staff",
                operation: "add",
                message: `Add staff "${firstStaff.name}"`,
              },
              resolvedData: {
                name: firstStaff.name,
                employeeId: firstStaff.employeeId || `EMP-${Date.now()}`,
                role: firstStaff.role || "Teacher",
                monthlySalary: firstStaff.monthlySalary || 0,
                subjectOrGrade: firstStaff.subjectOrGrade,
              },
            });
            return;
          }
        } else if (csvType === "classes") {
          const parseResult = parseClassesCSV(trimmed);
          if (parseResult.success && parseResult.data.length > 0) {
            const csvMessage: ChatMessageData = {
              id: generateId(),
              role: "assistant",
              content: `Found ${parseResult.data.length} class(es) in CSV. Starting with the first:`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, csvMessage]);

            const firstClass = parseResult.data[0];
            setPendingAction({
              id: generateId(),
              intentResult: {
                success: true,
                intent: "add_class",
                entity: "class",
                operation: "add",
                message: `Add class "${firstClass.name}"`,
              },
              resolvedData: {
                name: firstClass.name,
                registrationFees: firstClass.registrationFees ?? 500,
                admissionFees: firstClass.admissionFees ?? 2500,
                annualFund: firstClass.annualFund ?? 1500,
                monthlyFees: firstClass.monthlyFees ?? 3000,
                lateFeeAmount: firstClass.lateFeeAmount ?? 50,
                lateFeeFrequency: "weekly",
                dueDayOfMonth: firstClass.dueDayOfMonth ?? 10,
              },
            });
            return;
          }
        }

        const errorMessage: ChatMessageData = {
          id: generateId(),
          role: "assistant",
          content: "I detected CSV data but couldn't parse it. Please make sure your CSV has a header row with columns like 'name', 'class', etc.",
          timestamp: new Date(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      const result = await parseAxpoIntent(trimmed);

      if (!result.success || result.intent === "unknown") {
        // Unknown intent or error
        const errorMessage: ChatMessageData = {
          id: generateId(),
          role: "assistant",
          content: result.error || result.message || "I couldn't understand that. Could you please rephrase?",
          timestamp: new Date(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      // Handle analytics queries directly
      if (result.intent === "query_analytics") {
        const queryData = result.data as ParsedAnalyticsQuery;
        const analyticsData = computeAnalytics(queryData);

        const analyticsMessage: ChatMessageData = {
          id: generateId(),
          role: "assistant",
          content: result.message || "Here's the information you requested:",
          timestamp: new Date(),
          analytics: analyticsData || undefined,
        };
        setMessages((prev) => [...prev, analyticsMessage]);
        return;
      }

      // For CRUD operations, resolve data and show form
      const resolvedData = resolveIntentData(result);

      const assistantMessage: ChatMessageData = {
        id: generateId(),
        role: "assistant",
        content: result.message || "I'll help you with that. Please review and confirm:",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setPendingAction({
        id: generateId(),
        intentResult: result,
        resolvedData,
      });
    } catch (error) {
      const errorMessage: ChatMessageData = {
        id: generateId(),
        role: "assistant",
        content: error instanceof Error ? error.message : "An unexpected error occurred.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const resolveIntentData = (result: IntentResult): Record<string, unknown> | Record<string, unknown>[] => {
    const data = result.data;
    const filters = result.filters;

    switch (result.intent) {
      case "add_student": {
        const list = isMultipleStudents(data) ? data : [data as ParsedStudentData];
        const baseId = `STU-${Date.now()}`;
        return list.slice(0, MAX_BATCH_SIZE).map((studentData, i) => {
          const resolved = resolveClassLabel(studentData?.classLabel, sessionClasses);
          return {
            name: studentData?.name || "",
            classId: resolved.classId,
            classLabel: studentData?.classLabel,
            feeType: studentData?.feeType || "Regular",
            studentId: studentData?.studentId || (list.length > 1 ? `${baseId}-${i + 1}` : baseId),
            personalDetails: studentData?.personalDetails,
            registrationFees: resolved.registrationFees,
            admissionFees: resolved.admissionFees,
            annualFund: resolved.annualFund,
            monthlyFees: resolved.monthlyFees,
            dueDayOfMonth: resolved.dueDayOfMonth,
            lateFeeAmount: resolved.lateFeeAmount,
            lateFeeFrequency: resolved.lateFeeFrequency,
          };
        });
      }

      case "update_student":
      case "delete_student": {
        const studentData = data as ParsedStudentData;
        // Find student by name or ID from filters
        const found = sessionStudents.find(
          (s) =>
            (filters?.id && s.id === filters.id) ||
            (filters?.studentId && s.studentId === filters.studentId) ||
            (filters?.name && s.name.toLowerCase().includes(filters.name.toLowerCase())) ||
            (studentData?.name && s.name.toLowerCase().includes(studentData.name.toLowerCase()))
        );
        return {
          ...studentData,
          id: found?.id,
          name: studentData?.name || found?.name,
        };
      }

      case "add_staff": {
        const list = isMultipleStaff(data) ? data : [data as ParsedStaffData];
        const baseId = `EMP-${Date.now()}`;
        return list.slice(0, MAX_BATCH_SIZE).map((staffData, i) => ({
          name: staffData?.name || "",
          employeeId: staffData?.employeeId || (list.length > 1 ? `${baseId}-${i + 1}` : baseId),
          role: staffData?.role || "Teacher",
          monthlySalary: staffData?.monthlySalary || 0,
          subjectOrGrade: staffData?.subjectOrGrade,
        }));
      }

      case "update_staff":
      case "delete_staff": {
        const staffData = data as ParsedStaffData;
        const found = sessionStaff.find(
          (s) =>
            (filters?.id && s.id === filters.id) ||
            (filters?.employeeId && s.employeeId === filters.employeeId) ||
            (filters?.name && s.name.toLowerCase().includes(filters.name.toLowerCase())) ||
            (staffData?.name && s.name.toLowerCase().includes(staffData.name.toLowerCase()))
        );
        return {
          ...staffData,
          id: found?.id,
          name: staffData?.name || found?.name,
        };
      }

      case "pay_salary": {
        const list = isMultipleSalaryPayments(data) ? data : [data as ParsedSalaryPaymentData];
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        return list.slice(0, MAX_BATCH_SIZE).map((paymentData) => {
          const found = sessionStaff.find(
            (s) =>
              (paymentData?.staffId && s.id === paymentData.staffId) ||
              (paymentData?.staffName && s.name.toLowerCase().includes(paymentData.staffName.toLowerCase()))
          );
          return {
            staffId: found?.id,
            staffName: found?.name || paymentData?.staffName,
            month: paymentData?.month || currentMonth,
            amount: paymentData?.amount || found?.monthlySalary || 0,
            status: paymentData?.status || "Paid",
            paymentDate: paymentData?.paymentDate || now.toISOString().split("T")[0],
            method: paymentData?.method || "Cash",
          };
        });
      }

      case "add_expense": {
        const list = isMultipleExpenses(data) ? data : [data as ParsedExpenseData];
        return list.slice(0, MAX_BATCH_SIZE).map((expenseData) => ({
          date: expenseData?.date || new Date().toISOString().split("T")[0],
          amount: expenseData?.amount || 0,
          category: expenseData?.category || "Miscellaneous",
          description: expenseData?.description || "",
          vendorPayee: expenseData?.vendorPayee || "",
          paymentMethod: expenseData?.paymentMethod || "Cash",
        }));
      }

      case "update_expense":
      case "delete_expense": {
        const expenseData = data as ParsedExpenseData;
        const found = sessionExpenses.find(
          (e) =>
            (filters?.id && e.id === filters.id) ||
            (expenseData?.description && e.description.toLowerCase().includes(expenseData.description.toLowerCase()))
        );
        return {
          id: found?.id,
          ...expenseData,
        };
      }

      case "add_stock": {
        const list = isMultipleStocks(data) ? data : [data as ParsedStockData];
        return list.slice(0, MAX_BATCH_SIZE).map((stockData) => ({
          publisherName: stockData?.publisherName || "",
          description: stockData?.description || "",
          purchaseDate: stockData?.purchaseDate || new Date().toISOString().split("T")[0],
          totalCreditAmount: stockData?.totalCreditAmount || 0,
        }));
      }

      case "update_stock":
      case "delete_stock": {
        const stockData = data as ParsedStockData;
        const found = sessionStocks.find(
          (s) =>
            (filters?.id && s.id === filters.id) ||
            (stockData?.publisherName && s.publisherName.toLowerCase().includes(stockData.publisherName.toLowerCase()))
        );
        return {
          id: found?.id,
          ...stockData,
        };
      }

      case "add_fixed_cost": {
        const list = isMultipleFixedCosts(data) ? data : [data as ParsedFixedCostData];
        return list.slice(0, MAX_BATCH_SIZE).map((costData) => ({
          name: costData?.name || "",
          amount: costData?.amount || 0,
          category: costData?.category || "Miscellaneous",
          isActive: costData?.isActive !== false,
        }));
      }

      case "add_class": {
        const list = isMultipleClasses(data) ? data : [data as ParsedClassData];
        return list.slice(0, MAX_BATCH_SIZE).map((classData) => ({
          name: classData?.name || "",
          registrationFees: classData?.registrationFees ?? 500,
          admissionFees: classData?.admissionFees ?? 2500,
          annualFund: classData?.annualFund ?? 1500,
          monthlyFees: classData?.monthlyFees ?? 3000,
          lateFeeAmount: classData?.lateFeeAmount ?? 50,
          lateFeeFrequency: classData?.lateFeeFrequency ?? "weekly",
          dueDayOfMonth: classData?.dueDayOfMonth ?? 10,
        }));
      }

      case "update_fixed_cost":
      case "delete_fixed_cost": {
        const costData = data as ParsedFixedCostData;
        const found = sessionFixedCosts.find(
          (fc) =>
            (filters?.id && fc.id === filters.id) ||
            (costData?.name && fc.name.toLowerCase().includes(costData.name.toLowerCase()))
        );
        return {
          id: found?.id,
          ...costData,
        };
      }

      default:
        return (Array.isArray(data) ? {} : (data as unknown as Record<string, unknown>)) || {};
    }
  };

  const handleFormConfirm = async (finalData: Record<string, unknown> | Record<string, unknown>[]) => {
    if (!pendingAction) return;

    setIsSubmittingForm(true);
    try {
      const updatedAction = { ...pendingAction, resolvedData: finalData };
      const result = await executeAction(updatedAction);

      const resultMessage: ChatMessageData = {
        id: generateId(),
        role: "assistant",
        content: result.message,
        timestamp: new Date(),
        isError: !result.success,
      };
      setMessages((prev) => [...prev, resultMessage]);

      if (result.success) {
        toast(result.message, "success");
      } else {
        toast(result.message, "error");
      }

      setPendingAction(null);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleFormCancel = () => {
    const cancelMessage: ChatMessageData = {
      id: generateId(),
      role: "assistant",
      content: "Action cancelled. Is there anything else I can help you with?",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, cancelMessage]);
    setPendingAction(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (!canAccessAssistant) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-50">Access Restricted</h2>
          <p className="text-slate-600">
            Axpo Assistant is available only to users with the highest level of access. Contact your administrator to request the &quot;Use Axpo Assistant&quot; permission.
          </p>
        </Card>
      </div>
    );
  }


  if (!selectedSessionId) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-50">No Session Selected</h2>
          <p className="text-slate-600">
            Please select a school and session from the sidebar to use Axpo Assistant.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header with premium logo */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 animate-axpo-glow rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 opacity-40 blur-lg" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-700 shadow-xl ring-2 ring-white ring-offset-2">
              <Bot className="h-6 w-6 text-white drop-shadow-sm" />
            </div>
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-amber-900 shadow">PRO</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">Axpo Assistant</h1>
            <p className="text-sm text-slate-500">
              {selectedSession?.year} • {sessionClasses.length} classes • {sessionStudents.length} students
            </p>
          </div>
          {useLLM && (
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              AI Powered
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50/80 dark:bg-slate-800/80 p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Load more button for older messages */}
          {messages.length > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 20)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Load {Math.min(20, messages.length - visibleCount)} earlier messages
            </button>
          )}
          {messages.slice(-visibleCount).map((message) => (
            <div key={message.id} className="animate-axpo-message">
              <ChatMessage message={message} />
            </div>
          ))}

          {/* Pending Form */}
          {pendingAction && (
            <InlineFormCard
              type={
                pendingAction.intentResult.intent === "add_class"
                  ? "class"
                  : (pendingAction.intentResult.entity || "student")
              }
              operation={pendingAction.intentResult.operation || "add"}
              intent={pendingAction.intentResult.intent}
              data={pendingAction.resolvedData}
              sessionClasses={sessionClasses}
              sessionStaff={sessionStaff}
              onConfirm={handleFormConfirm}
              onCancel={handleFormCancel}
              isSubmitting={isSubmittingForm}
            />
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="animate-axpo-message flex items-center gap-2 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-purple-500 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:300ms]" />
              </div>
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
              <span className="text-sm text-slate-600">Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <div className="mx-auto max-w-3xl">
          {/* Suggestions */}
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(suggestion.prompt)}
                disabled={isProcessing || !!pendingAction}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-300 disabled:opacity-50"
              >
                <span className="text-slate-400">{suggestion.icon}</span>
                {suggestion.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  const textarea = e.target;
                  textarea.style.height = "auto";
                  textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
                }}
                onKeyDown={handleKeyDown}
                disabled={isProcessing || !!pendingAction}
                placeholder="Ask me to add students, pay salaries, record expenses, or get analytics..."
                rows={1}
                className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 py-3 pl-4 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 disabled:opacity-60"
                style={{ minHeight: "48px", maxHeight: "150px" }}
              />
            </div>
            <Button
              type="submit"
              disabled={isProcessing || !input.trim() || !!pendingAction}
              size="sm"
              className="h-12 w-12 mb-2 shrink-0 rounded-xl bg-indigo-600 p-0 text-white shadow-sm hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-400"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
