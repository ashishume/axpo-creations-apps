import { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "../../context/AppContext";
import { useClassesBySession } from "../../hooks/useClasses";
import { useStudentsBySession } from "../../hooks/useStudents";
import { useStaffBySession } from "../../hooks/useStaff";
import { useExpensesBySession } from "../../hooks/useExpenses";
import { useStocksBySession } from "../../hooks/useStocks";
import { useFixedCostsBySession } from "../../hooks/useFixedCosts";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { ChatMessage, type ChatMessageData } from "./ChatMessage";
import { InlineFormCard } from "./InlineFormCard";
import { type AnalyticsData } from "./AnalyticsCard";
import { type ListData, type StaffListItem, type StudentListItem } from "./ListCard";
import {
  parseAxpoIntent,
  detectListIntent,
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
  type ParsedListQuery,
  isMultipleStudents,
  isMultipleStaff,
  isMultipleExpenses,
  isMultipleStocks,
  isMultipleFixedCosts,
  isMultipleClasses,
  isMultipleSalaryPayments,
  isListQuery,
} from "../../lib/axpoAssistantParser";
import { resolveClassLabel } from "../../lib/studentChatParser";
import { detectCSV, detectCSVType, parseStudentsCSV, parseStaffCSV, parseClassesCSV } from "../../lib/csvParser";
import {
  Bot,
  Send,
  Loader2,
  X,
  Minimize2,
  Maximize2,
  MessageSquare,
} from "lucide-react";
import type {
  Student,
  Staff,
  Expense,
  Stock,
  FixedMonthlyCost,
  FeePayment,
} from "../../types";
import { getTotalPaid, getRemaining } from "../../lib/studentUtils";
import { generateId, cn } from "../../lib/utils";
import { loadChatHistory, saveChatHistory, type StoredChatMessage } from "../../lib/assistantChatHistory";
import { useAuth } from "../../context/AuthContext";
import { SUPER_ADMIN_ROLE_NAME } from "../../types/auth";

// ============================================================================
// Types
// ============================================================================

interface PendingAction {
  id: string;
  intentResult: IntentResult;
  resolvedData: Record<string, unknown> | Record<string, unknown>[];
}

// ============================================================================
// Helpers
// ============================================================================

function toStoredMessage(m: ChatMessageData): StoredChatMessage {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp.toISOString(),
    isError: m.isError,
    analytics: m.analytics,
    listData: m.listData,
  };
}

function fromStoredMessage(m: StoredChatMessage): ChatMessageData {
  return {
    ...m,
    timestamp: new Date(m.timestamp),
    analytics: m.analytics as ChatMessageData["analytics"],
    listData: m.listData as ChatMessageData["listData"],
  };
}

// ============================================================================
// Component
// ============================================================================

export function AssistantPopup() {
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

  const [isOpen, setIsOpen] = useState(false);

  // Only fetch data when the popup is open to avoid unnecessary API calls on every page
  const fetchEnabled = isOpen && !!selectedSessionId;
  const sessionIdOrEmpty = selectedSessionId ?? "";
  const { data: classes = [] } = useClassesBySession(fetchEnabled ? sessionIdOrEmpty : "");
  const { data: students = [] } = useStudentsBySession(fetchEnabled ? sessionIdOrEmpty : "");
  const { data: staff = [] } = useStaffBySession(fetchEnabled ? sessionIdOrEmpty : "");
  const { data: expenses = [] } = useExpensesBySession(fetchEnabled ? sessionIdOrEmpty : "");
  const { data: stocks = [] } = useStocksBySession(fetchEnabled ? sessionIdOrEmpty : "");
  const { data: fixedCosts = [] } = useFixedCostsBySession(fetchEnabled ? sessionIdOrEmpty : "");
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [visibleCount, setVisibleCount] = useState(20); // Lazy loading: show last N messages
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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

  // Load chat history on mount (from DB or localStorage)
  useEffect(() => {
    if (!selectedSessionId) return;
    let cancelled = false;
    loadChatHistory(selectedSessionId).then((stored) => {
      if (cancelled) return;
      if (stored.length > 0) {
        setMessages(stored.map(fromStoredMessage));
      } else {
        setMessages([
          {
            id: generateId(),
            role: "assistant",
            content: `Hi! I'm Axpo Assistant. How can I help you today?`,
            timestamp: new Date(),
          },
        ]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedSessionId]);

  // Save chat history (to DB or localStorage)
  useEffect(() => {
    if (!selectedSessionId || messages.length === 0) return;
    if (messages.length === 1 && messages[0]?.content.startsWith("Hi!")) return;
    void saveChatHistory(selectedSessionId, messages.map(toStoredMessage));
  }, [messages, selectedSessionId]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages, pendingAction, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  // ============================================================================
  // Analytics computation (same as AxpoAssistantPage)
  // ============================================================================

  const computeAnalytics = useCallback(
    (query: ParsedAnalyticsQuery): AnalyticsData | null => {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      switch (query.queryType) {
        case "salary_summary": {
          const month = query.month || currentMonth;
          const payments = sessionStaff.flatMap((s) =>
            s.salaryPayments.filter((p) => p.month === month).map((p) => ({ staff: s, payment: p }))
          );
          const paid = payments.filter((p) => p.payment.status === "Paid").reduce((sum, p) => sum + p.payment.amount, 0);
          const pending = sessionStaff
            .filter((s) => !s.salaryPayments.some((p) => p.month === month && p.status === "Paid"))
            .reduce((sum, s) => sum + s.monthlySalary, 0);

          return {
            type: "salary_summary",
            title: `Salary Summary - ${month}`,
            metrics: [
              { label: "Total Paid", value: paid, format: "currency" },
              { label: "Pending", value: pending, format: "currency" },
              { label: "Staff Count", value: sessionStaff.length, format: "number" },
            ],
          };
        }
        case "fee_collection_summary": {
          const totalTarget = sessionStudents.reduce((sum, s) => sum + (s.targetAmount ?? 0), 0);
          const totalPaid = sessionStudents.reduce((sum, s) => sum + getTotalPaid(s), 0);
          const totalRemaining = sessionStudents.reduce((sum, s) => {
            const studentClass = sessionClasses.find((c) => c.id === s.classId);
            return sum + getRemaining(s, studentClass);
          }, 0);

          return {
            type: "fee_collection_summary",
            title: "Fee Collection Summary",
            metrics: [
              { label: "Total Target", value: totalTarget, format: "currency" },
              { label: "Collected", value: totalPaid, format: "currency" },
              { label: "Outstanding", value: totalRemaining, format: "currency" },
              { label: "Students", value: sessionStudents.length, format: "number" },
            ],
          };
        }
        case "expenses_summary": {
          const total = sessionExpenses.reduce((sum, e) => sum + e.amount, 0);
          const byCategory = sessionExpenses.reduce(
            (acc, e) => {
              acc[e.category] = (acc[e.category] || 0) + e.amount;
              return acc;
            },
            {} as Record<string, number>
          );

          return {
            type: "expenses_summary",
            title: "Expenses Summary",
            metrics: [
              { label: "Total Expenses", value: total, format: "currency" },
              { label: "Categories", value: Object.keys(byCategory).length, format: "number" },
            ],
            details: Object.entries(byCategory).map(([category, value]) => ({
              name: category,
              value,
            })),
          };
        }
        case "outstanding_fees": {
          const studentsWithDue = sessionStudents.filter((s) => {
            const studentClass = sessionClasses.find((c) => c.id === s.classId);
            return getRemaining(s, studentClass) > 0;
          });
          const totalDue = studentsWithDue.reduce((sum, s) => {
            const studentClass = sessionClasses.find((c) => c.id === s.classId);
            return sum + getRemaining(s, studentClass);
          }, 0);

          return {
            type: "outstanding_fees",
            title: "Outstanding Fees",
            metrics: [
              { label: "Total Outstanding", value: totalDue, format: "currency" },
              { label: "Students with Due", value: studentsWithDue.length, format: "number" },
            ],
            details: studentsWithDue.slice(0, 10).map((s) => {
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
        case "monthly_salary_report": {
          const monthsSet = new Set<string>();
          sessionStaff.forEach((s) => {
            s.salaryPayments.forEach((p) => monthsSet.add(p.month));
          });
          const months = Array.from(monthsSet).sort().reverse().slice(0, 6);
          
          const monthlyData = months.map((month) => {
            const paid = sessionStaff.reduce((sum, s) => {
              const payment = s.salaryPayments.find((p) => p.month === month && p.status === "Paid");
              return sum + (payment?.amount || 0);
            }, 0);
            const paidCount = sessionStaff.filter((s) => 
              s.salaryPayments.some((p) => p.month === month && p.status === "Paid")
            ).length;
            return { name: month, value: paid, count: paidCount };
          });

          const totalPaidAllTime = sessionStaff.reduce((sum, s) => 
            sum + s.salaryPayments.filter((p) => p.status === "Paid").reduce((ps, p) => ps + p.amount, 0), 0
          );
          
          return {
            type: "salary_summary",
            title: "Monthly Salary Report",
            metrics: [
              { label: "Total Paid (All Time)", value: totalPaidAllTime, format: "currency" },
              { label: "Staff Members", value: sessionStaff.length, format: "number" },
              { label: "Monthly Obligation", value: sessionStaff.reduce((sum, s) => sum + s.monthlySalary, 0), format: "currency" },
            ],
            details: monthlyData.map((d) => ({
              name: `${d.name} (${d.count} staff)`,
              value: d.value,
            })),
          };
        }
        case "monthly_fee_report": {
          const monthlyFees: Record<string, { collected: number; count: number }> = {};
          sessionStudents.forEach((s) => {
            s.payments.forEach((p: FeePayment) => {
              const month = p.date.slice(0, 7);
              if (!monthlyFees[month]) monthlyFees[month] = { collected: 0, count: 0 };
              monthlyFees[month].collected += p.amount;
              monthlyFees[month].count += 1;
            });
          });
          
          const months = Object.keys(monthlyFees).sort().reverse().slice(0, 6);
          const totalCollected = sessionStudents.reduce((sum, s) => sum + getTotalPaid(s), 0);
          const totalPending = sessionStudents.reduce((sum, s) => {
            const studentClass = sessionClasses.find((c) => c.id === s.classId);
            return sum + getRemaining(s, studentClass);
          }, 0);
          
          return {
            type: "fee_collection_summary",
            title: "Monthly Fee Report",
            metrics: [
              { label: "Total Collected", value: totalCollected, format: "currency" },
              { label: "Total Pending", value: totalPending, format: "currency" },
              { label: "Students", value: sessionStudents.length, format: "number" },
            ],
            details: months.map((month) => ({
              name: `${month} (${monthlyFees[month].count} payments)`,
              value: monthlyFees[month].collected,
            })),
          };
        }
        default:
          return null;
      }
    },
    [sessionStudents, sessionStaff, sessionExpenses, sessionStocks, sessionClasses]
  );

  // ============================================================================
  // List Data Builder
  // ============================================================================

  const buildListData = useCallback(
    (query: ParsedListQuery): ListData | null => {
      if (query.listType === "staff") {
        let filteredStaff = sessionStaff;
        if (query.roleFilter) {
          filteredStaff = sessionStaff.filter(
            (s) => s.role?.toLowerCase().includes(query.roleFilter!.toLowerCase())
          );
        }
        const items: StaffListItem[] = filteredStaff.map((s) => ({
          id: s.id,
          name: s.name,
          employeeId: s.employeeId,
          role: s.role,
          monthlySalary: s.monthlySalary,
          subjectOrGrade: s.subjectOrGrade,
        }));
        return {
          type: "staff",
          items,
          totalCount: items.length,
          title: query.roleFilter ? `${query.roleFilter} Staff` : "All Staff & Teachers",
        };
      } else if (query.listType === "students") {
        let filteredStudents = sessionStudents;
        if (query.classFilter) {
          const targetClass = sessionClasses.find(
            (c) => c.name.toLowerCase().includes(query.classFilter!.toLowerCase())
          );
          if (targetClass) {
            filteredStudents = sessionStudents.filter((s) => s.classId === targetClass.id);
          }
        }
        const items: StudentListItem[] = filteredStudents.map((s) => {
          const studentClass = sessionClasses.find((c) => c.id === s.classId);
          return {
            id: s.id,
            name: s.name,
            studentId: s.studentId,
            className: studentClass?.name,
            feeType: s.feeType,
            totalPaid: getTotalPaid(s),
            remaining: getRemaining(s, studentClass),
            guardianPhone: s.personalDetails?.guardianPhone,
          };
        });
        return {
          type: "students",
          items,
          totalCount: items.length,
          title: query.classFilter ? `Students in ${query.classFilter}` : "All Students",
        };
      }
      return null;
    },
    [sessionStudents, sessionStaff, sessionClasses]
  );

  // ============================================================================
  // CRUD Handlers (simplified from AxpoAssistantPage)
  // ============================================================================

  const executeAction = useCallback(
    async (action: PendingAction): Promise<{ success: boolean; message: string }> => {
      const { intentResult, resolvedData } = action;
      const items: Record<string, unknown>[] = Array.isArray(resolvedData) ? resolvedData : [resolvedData];

      try {
        switch (intentResult.intent) {
          case "add_student": {
            const studentPayload = (items as Record<string, unknown>[]).map((studentData: Record<string, unknown>) => ({
              sessionId: selectedSessionId!,
              name: (studentData.name as string) || "Unknown",
              studentId: (studentData.studentId as string) || `STU-${Date.now()}`,
              feeType: (studentData.feeType as string) || "Regular",
              classId: studentData.classId as string | undefined,
              personalDetails: studentData.personalDetails as Record<string, unknown> | undefined,
              registrationFees: studentData.registrationFees as number | undefined,
              annualFund: studentData.annualFund as number | undefined,
              monthlyFees: studentData.monthlyFees as number | undefined,
              dueDayOfMonth: studentData.dueDayOfMonth as number | undefined,
              lateFeeAmount: studentData.lateFeeAmount as number | undefined,
              lateFeeFrequency: studentData.lateFeeFrequency as string | undefined,
            }));
            await addStudents(studentPayload as never[]);
            const n = items.length;
            return { success: true, message: n === 1 ? `Student "${(items[0] as Partial<Student>).name}" added successfully!` : `${n} students added successfully!` };
          }

          case "update_student": {
            const studentData = items[0] as Partial<Student> & { id: string; sessionId?: string; enrollmentId?: string };
            if (!studentData?.id) return { success: false, message: "Student ID required for update." };
            const updates = {
              ...studentData,
              sessionId: studentData.sessionId ?? selectedSessionId ?? undefined,
              enrollmentId: studentData.enrollmentId,
            };
            updateStudent(studentData.id, updates as Partial<Student>);
            return { success: true, message: `Student updated successfully!` };
          }

          case "delete_student": {
            const { id } = items[0] as { id: string };
            if (!id) return { success: false, message: "Student ID required for deletion." };
            deleteStudent(id);
            return { success: true, message: "Student deleted successfully!" };
          }

          case "add_staff": {
            const staffPayload = (items as Record<string, unknown>[]).map((staffData: Record<string, unknown>) => ({
              sessionId: selectedSessionId!,
              name: (staffData.name as string) || "Unknown",
              employeeId: (staffData.employeeId as string) || `EMP-${Date.now()}`,
              role: (staffData.role as string) || "Teacher",
              monthlySalary: (staffData.monthlySalary as number) || 0,
              subjectOrGrade: staffData.subjectOrGrade as string | undefined,
              allowedLeavesPerMonth: (staffData.allowedLeavesPerMonth as number) || 2,
              salaryPayments: [],
            }));
            await addStaffBatch(staffPayload as never[]);
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
            const toAdd: { staffId: string; payment: Omit<import("../../types").SalaryPayment, "id"> }[] = [];
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
                method: (p.method || "Cash") as import("../../types").PaymentMethod | undefined,
                daysWorked: 30,
                leavesTaken: 0,
                allowedLeaves: staffMember.allowedLeavesPerMonth ?? 2,
                excessLeaves: 0,
                leaveDeduction: 0,
                extraAllowance: 0,
                extraDeduction: 0,
                calculatedSalary: p.amount || staffMember.monthlySalary,
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
                method: (p.method || "Cash") as import("../../types").PaymentMethod | undefined,
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
            const classPayload = (items as { name: string; registrationFees?: number; annualFund?: number; monthlyFees?: number; lateFeeAmount?: number; lateFeeFrequency?: "daily" | "weekly"; dueDayOfMonth?: number }[])
              .map((classData) => {
                const name = (classData.name || "").trim();
                if (!name) return null;
                return {
                  sessionId: selectedSessionId!,
                  name,
                  registrationFees: Number(classData.registrationFees) || 0,
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

    const userMessage: ChatMessageData = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

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

            // Add the first student
            const firstStudent = parseResult.data[0];
            const resolved = resolveClassLabel(firstStudent.classLabel, sessionClasses);

            // Check if class exists
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
                registrationFees: firstClass.registrationFees ?? 3000,
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

        // Couldn't parse CSV
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

      let result = await parseAxpoIntent(trimmed);
      // Fallback: if backend returns "unknown", try client-side list detection (e.g. "list teachers")
      const listFallback = detectListIntent(trimmed);
      if (listFallback && (!result.success || result.intent === "unknown")) {
        result = listFallback;
      }

      if (!result.success || result.intent === "unknown") {
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

      // Handle list queries directly
      if (result.intent === "list_staff" || result.intent === "list_students") {
        const listQuery: ParsedListQuery = isListQuery(result.data) 
          ? result.data 
          : { listType: result.intent === "list_staff" ? "staff" : "students" };
        const listData = buildListData(listQuery);

        const listMessage: ChatMessageData = {
          id: generateId(),
          role: "assistant",
          content: result.message || `Here's the list of ${listQuery.listType}:`,
          timestamp: new Date(),
          listData: listData || undefined,
        };
        setMessages((prev) => [...prev, listMessage]);
        return;
      }

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

      // Resolve data
      const resolvedData = resolveIntentData(result);

      // Direct execute (no form): pay_salary and add_expense – run immediately
      const directExecuteIntents = ["pay_salary", "add_expense"];
      if (directExecuteIntents.includes(result.intent)) {
        const action: PendingAction = {
          id: generateId(),
          intentResult: result,
          resolvedData,
        };
        const execResult = await executeAction(action);
        const resultMessage: ChatMessageData = {
          id: generateId(),
          role: "assistant",
          content: execResult.message,
          timestamp: new Date(),
          isError: !execResult.success,
        };
        setMessages((prev) => [...prev, resultMessage]);
        if (execResult.success) toast(execResult.message, "success");
        else toast(execResult.message, "error");
        return;
      }

      // Check for negative flows (e.g. class doesn't exist)
      if (result.intent === "add_student") {
        const studentData = result.data as ParsedStudentData;
        const classLabel = studentData?.classLabel;
        if (classLabel) {
          const resolved = resolveClassLabel(classLabel, sessionClasses);
          if (!resolved.classId) {
            // Class doesn't exist - prompt to create it first
            const warningMessage: ChatMessageData = {
              id: generateId(),
              role: "assistant",
              content: `Class "${classLabel}" doesn't exist yet. Would you like to create it first? I'll show you the class creation form.`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, warningMessage]);

            // Show add class form
            setPendingAction({
              id: generateId(),
              intentResult: {
                success: true,
                intent: "add_class",
                entity: "class",
                operation: "add",
                message: `Create class "${classLabel}" first`,
              },
              resolvedData: {
                name: classLabel.replace(/^class\s*/i, "").trim() || classLabel,
                registrationFees: 3000,
                annualFund: 1500,
                monthlyFees: 3000,
                lateFeeAmount: 50,
                lateFeeFrequency: "weekly",
                dueDayOfMonth: 10,
              },
            });
            return;
          }
        }
      }

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
          const raw = studentData as unknown as Record<string, unknown>;
          const classLabel = raw?.classLabel ?? raw?.class ?? raw?.className;
          const resolved = resolveClassLabel(
            typeof classLabel === "string" ? classLabel : undefined,
            sessionClasses
          );
          return {
            name: studentData?.name || "",
            classId: resolved.classId,
            classLabel: typeof classLabel === "string" ? classLabel : studentData?.classLabel,
            feeType: studentData?.feeType || "Regular",
            studentId: studentData?.studentId || (list.length > 1 ? `${baseId}-${i + 1}` : baseId),
            personalDetails: studentData?.personalDetails,
            registrationFees: resolved.registrationFees,
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
        const found = sessionStudents.find(
          (s) =>
            (filters?.id && s.id === filters.id) ||
            (filters?.studentId && s.studentId === filters.studentId) ||
            (filters?.name && s.name.toLowerCase().includes(filters.name.toLowerCase())) ||
            (studentData?.name && s.name.toLowerCase().includes(studentData.name.toLowerCase()))
        );
        const sessionStudent = found as { id: string; name?: string; enrollmentId?: string } | undefined;
        return {
          ...studentData,
          id: sessionStudent?.id,
          name: studentData?.name || sessionStudent?.name,
          sessionId: selectedSessionId ?? undefined,
          enrollmentId: sessionStudent?.enrollmentId,
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
          registrationFees: classData?.registrationFees ?? 3000,
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

  // Don't render if user can't use assistant
  if (!canUseAssistant || !isLLMAvailable()) {
    return null;
  }

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg transition-transform hover:scale-105 hover:shadow-xl"
        title="Open Axpo Assistant"
      >
        <Bot className="h-6 w-6" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-amber-900 shadow">
          AI
        </span>
      </button>
    );
  }

  // Chat popup
  const popupHeight = isExpanded ? "h-[80vh]" : "h-[500px]";
  const popupWidth = isExpanded ? "w-[500px]" : "w-[380px]";

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200",
        popupHeight,
        popupWidth
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Axpo Assistant</h3>
            <p className="text-xs text-white/70">
              {selectedSession?.year || "Select a session"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0 text-white/80 hover:bg-white/20 hover:text-white"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* No session selected */}
      {!selectedSessionId ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <MessageSquare className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">
            Please select a school and session to start chatting.
          </p>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3">
            <div className="space-y-3">
              {/* Load more button */}
              {messages.length > visibleCount && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 20)}
                  className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Load {Math.min(20, messages.length - visibleCount)} earlier messages
                </button>
              )}
              {messages.slice(-visibleCount).map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {/* Pending Form */}
              {pendingAction && (
                <div className="ml-0">
                  <InlineFormCard
                    type={
                      pendingAction.intentResult.intent === "add_class"
                        ? "class"
                        : (pendingAction.intentResult.entity || "student")
                    }
                    operation={((pendingAction.intentResult.operation === "list" ? "query" : pendingAction.intentResult.operation) || "add") as "add" | "update" | "delete" | "query"}
                    intent={pendingAction.intentResult.intent}
                    data={pendingAction.resolvedData}
                    sessionClasses={sessionClasses}
                    sessionStaff={sessionStaff}
                    onConfirm={handleFormConfirm}
                    onCancel={handleFormCancel}
                    isSubmitting={isSubmittingForm}
                  />
                </div>
              )}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                  <span className="text-xs text-slate-500">Thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={isProcessing || !!pendingAction}
                  placeholder="Type a message..."
                  rows={1}
                  className="min-h-0 resize-none rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 pr-4 max-h-[120px] focus:bg-white dark:focus:bg-slate-800 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 disabled:opacity-60"
                  style={{ minHeight: "42px", maxHeight: "120px" }}
                />
              </div>
              <Button
                type="submit"
                disabled={isProcessing || !input.trim() || !!pendingAction}
                size="sm"
                className="h-[42px] mb-2 w-[42px] shrink-0 rounded-xl bg-indigo-600 p-0 text-white shadow-sm hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            {!selectedSessionId && (
              <p className="mt-2 text-center text-xs text-amber-600">
                Select a session to start chatting
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
