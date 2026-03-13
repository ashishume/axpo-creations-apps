import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useStaffBySessionInfinite, useStaffBySession, useCreateStaff, useCreateStaffBulk, useUpdateStaff, useDeleteStaff, useDeleteAllStaffBySession, useAddSalaryPayment, useTransferStaffToSession, useLeaveSummary } from "../hooks/useStaff";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Skeleton, SkeletonTable } from "../components/ui/Skeleton";
import { Plus, Pencil, Trash2, Upload, Calendar, Clock, CheckCircle, AlertCircle, XCircle, X, AlertTriangle, Banknote, Download, ArrowRightLeft } from "lucide-react";
import { BulkImportModal, exportStaffToCSV } from "../components/import/BulkImportModal";
import type { Staff as StaffType, StaffRole, SalaryPayment, ClassSubject } from "../types";
import { STAFF_ROLES, STAFF_ROLE_FILTER_OPTIONS } from "../constants/staffRoles";
import { formatCurrency, formatDate, formatMonthYear, cn } from "../lib/utils";
import { getFeeHistoryMonths } from "../lib/studentUtils";
import { SearchInput } from "../components/ui/SearchInput";
import { FilterChips } from "../components/ui/FilterChips";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { FormField } from "../components/ui/FormField";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { PermissionGate } from "../components/auth/PermissionGate";

const roleBadgeVariant: Record<string, "info" | "neutral" | "warning"> = {
  Teacher: "info",
  Administrative: "info",
  "Bus Driver": "warning",
  "Support Staff": "neutral",
  Principal: "info",
  "Vice Principal": "info",
  Admin: "info",
};
function getRoleBadgeVariant(role: string): "info" | "neutral" | "warning" {
  return roleBadgeVariant[role] ?? "neutral";
}

// Helper to calculate late days for a salary payment (uses payment.dueDate if set, else dueDay of month)
function calculateLateDays(payment: SalaryPayment, dueDay: number = 5): number {
  if (!payment.paymentDate || payment.status !== "Paid") return 0;

  const paidDate = new Date(payment.paymentDate);
  const dueDate = payment.dueDate
    ? new Date(payment.dueDate)
    : (() => {
      const [year, month] = payment.month.split("-").map(Number);
      return new Date(year, month - 1, dueDay);
    })();

  const diffTime = paidDate.getTime() - dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

// Get last paid salary info for a staff member (dueDay from session for fallback when payment has no dueDate)
function getLastPaidInfo(salaryPayments: SalaryPayment[], dueDay: number = 5): { date: string | null; lateDays: number; month: string | null } {
  const paidPayments = salaryPayments
    .filter(p => p.status === "Paid" && p.paymentDate)
    .sort((a, b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime());

  if (paidPayments.length === 0) {
    return { date: null, lateDays: 0, month: null };
  }

  const lastPayment = paidPayments[0];
  return {
    date: lastPayment.paymentDate!,
    lateDays: calculateLateDays(lastPayment, dueDay),
    month: lastPayment.month,
  };
}

// Get current month in YYYY-MM format
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Build months to show in salary history: session months + any month that has a payment (e.g. advance). Sorted newest first.
function getSalaryHistoryMonths(sessionMonths: string[], paymentMonths: string[]): string[] {
  const set = new Set<string>([...sessionMonths, ...paymentMonths]);
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

// Salary Payment Modal Component with leave calculations
function SalaryPaymentModalContent({
  staff,
  month,
  salaryDueDay,
  onClose,
  onSubmit,
}: {
  staff: StaffType;
  month: string;
  salaryDueDay: number;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const { data: leaveSummary, isLoading: leaveSummaryLoading } = useLeaveSummary(staff.id, month);

  // Local state for form values
  const [daysWorked, setDaysWorked] = useState(30);
  const [leavesTaken, setLeavesTaken] = useState(0);
  const [extraAllowance, setExtraAllowance] = useState(0);
  const [extraDeduction, setExtraDeduction] = useState(0);

  // Update form values when leave summary loads
  useEffect(() => {
    if (leaveSummary) {
      setDaysWorked(leaveSummary.daysWorked);
      setLeavesTaken(leaveSummary.leavesTaken);
    }
  }, [leaveSummary]);

  // Calculate salary breakdown
  const perDay = staff.perDaySalary ?? staff.monthlySalary / 30;
  const allowedLeaves = staff.allowedLeavesPerMonth ?? 2;
  const excessLeaves = Math.max(0, leavesTaken - allowedLeaves);
  const leaveDeduction = excessLeaves * perDay;
  const calculatedSalary = staff.monthlySalary - leaveDeduction - extraDeduction + extraAllowance;

  const alreadyHasPaymentForMonth = staff.salaryPayments.some((p) => p.month === month);

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Salary Payment – ${staff.name}`}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Salary Info Header */}
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Monthly Salary: <strong className="text-slate-900 dark:text-slate-100">{formatCurrency(staff.monthlySalary)}</strong>
              </p>
              <p className="text-xs text-slate-500">
                Per Day: {formatCurrency(perDay)} | Allowed Leaves: {allowedLeaves}/month
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Month</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{formatMonthYear(month)}</p>
            </div>
          </div>
        </div>

        {/* Leave Summary from System */}
        {leaveSummaryLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Skeleton className="h-4 w-4" />
            Loading leave data...
          </div>
        ) : leaveSummary && leaveSummary.leavesTaken > 0 ? (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-amber-800 dark:text-amber-200">
                <strong>{leaveSummary.leavesTaken}</strong> approved leave(s) found for this month.
              </p>
              <p className="text-amber-600 dark:text-amber-300 text-xs mt-1">
                Days in month: {leaveSummary.daysInMonth} | Days worked: {leaveSummary.daysWorked}
              </p>
            </div>
          </div>
        ) : null}

        {/* Days Worked & Leaves */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Days Worked" helperText="Verify before paying">
            <Input
              name="daysWorked"
              type="number"
              min={0}
              max={31}
              value={daysWorked}
              onChange={(e) => setDaysWorked(Number(e.target.value))}
            />
          </FormField>
          <FormField label="Leaves Taken" helperText={`Allowed: ${allowedLeaves}`}>
            <Input
              name="leavesTaken"
              type="number"
              min={0}
              max={31}
              value={leavesTaken}
              onChange={(e) => setLeavesTaken(Number(e.target.value))}
            />
          </FormField>
        </div>

        {/* Leave Deduction Display */}
        {excessLeaves > 0 && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Excess Leaves:</strong> {excessLeaves} day(s) beyond allowed limit
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              <strong>Leave Deduction:</strong> {formatCurrency(leaveDeduction)}
            </p>
          </div>
        )}

        {/* Extra Allowance */}
        <div className="border-t border-slate-200 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Extra Allowance (₹)" helperText="Bonus, advance, etc.">
              <Input
                name="extraAllowance"
                type="number"
                min={0}
                value={extraAllowance}
                onChange={(e) => setExtraAllowance(Number(e.target.value))}
              />
            </FormField>
            <FormField label="Allowance Note">
              <Input
                name="allowanceNote"
                type="text"
                placeholder="e.g., Bonus, Advance"
              />
            </FormField>
          </div>
        </div>

        {/* Extra Deduction */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Extra Deduction (₹)" helperText="Other deductions">
            <Input
              name="extraDeduction"
              type="number"
              min={0}
              value={extraDeduction}
              onChange={(e) => setExtraDeduction(Number(e.target.value))}
            />
          </FormField>
          <FormField label="Deduction Note">
            <Input
              name="deductionNote"
              type="text"
              placeholder="e.g., Loan EMI"
            />
          </FormField>
        </div>

        {/* Calculated Salary */}
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">Final Salary</span>
            </div>
            <span className="text-2xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(calculatedSalary)}
            </span>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            = {formatCurrency(staff.monthlySalary)}
            {leaveDeduction > 0 && ` - ${formatCurrency(leaveDeduction)} (leave)`}
            {extraDeduction > 0 && ` - ${formatCurrency(extraDeduction)} (deduction)`}
            {extraAllowance > 0 && ` + ${formatCurrency(extraAllowance)} (allowance)`}
          </p>
        </div>

        {/* Already paid warning */}
        {alreadyHasPaymentForMonth && (
          <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-200 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>This month already has a salary payment. Only one payment per employee per month is allowed.</span>
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 p-2 rounded">
          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
          <span>Please verify the days worked and leaves before confirming payment.</span>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
          <FormField label="Payment Date">
            <Input name="paymentDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </FormField>
          <FormField label="Method">
            <Select name="method" defaultValue="Bank Transfer">
              <option value="">—</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Online">Online</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Status">
          <Select name="status" defaultValue="Paid">
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Pending">Pending</option>
          </Select>
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={alreadyHasPaymentForMonth}>
            Pay Salary
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function StaffPage() {
  const {
    sessions,
    selectedSessionId,
    toast,
  } = useApp();

  const createStaff = useCreateStaff();
  const createStaffBulk = useCreateStaffBulk();
  const updateStaffMut = useUpdateStaff();
  const deleteStaffMut = useDeleteStaff();
  const addSalaryMut = useAddSalaryPayment();
  const transferStaffMut = useTransferStaffToSession();
  const deleteAllStaffMut = useDeleteAllStaffBySession();
  const { data: allSessionStaff = [] } = useStaffBySession(selectedSessionId ?? "");

  const addStaff = (data: Omit<StaffType, "id" | "salaryPayments">) => createStaff.mutate(data);
  const updateStaff = (id: string, data: Partial<Omit<StaffType, "id" | "salaryPayments">>) => updateStaffMut.mutate({ id, updates: data });
  const deleteStaff = (id: string) => deleteStaffMut.mutate(id);
  const addSalaryPayment = (staffId: string, payment: Omit<SalaryPayment, "id">) =>
    addSalaryMut.mutate({ staffId, payment });
  const addSalaryPaymentAsync = (staffId: string, payment: Omit<SalaryPayment, "id">) =>
    addSalaryMut.mutateAsync({ staffId, payment });

  const selectedSession = useMemo(
    () => (selectedSessionId ? sessions.find((s) => s.id === selectedSessionId) : null),
    [sessions, selectedSessionId]
  );
  const salaryDueDay = selectedSession?.salaryDueDay ?? 5;
  const currentSession = sessions.find((s) => s.id === selectedSessionId);
  const targetSessions = sessions.filter(
    (s) => s.schoolId === currentSession?.schoolId && s.id !== selectedSessionId
  );

  const [staffModal, setStaffModal] = useState<{ open: boolean; staff?: StaffType }>({ open: false });
  const [salaryModal, setSalaryModal] = useState<{ staff: StaffType; month: string; fromHistory?: boolean } | null>(null);
  const [salaryHistoryModal, setSalaryHistoryModal] = useState<StaffType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferStep, setTransferStep] = useState<"select" | "preview">("select");
  const [transferTargetSessionId, setTransferTargetSessionId] = useState<string | null>(null);
  const [transferSelectedIds, setTransferSelectedIds] = useState<Set<string>>(new Set());
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [confirmDeleteAllStaff, setConfirmDeleteAllStaff] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");

  // Staff form state for classes & subjects
  const [classesSubjects, setClassesSubjects] = useState<ClassSubject[]>([]);

  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 300);
  const hasFilters = !!(roleFilter || debouncedSearch || classFilter || subjectFilter);
  const {
    staffList,
    total: staffTotal,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isAppLoading,
  } = useStaffBySessionInfinite(selectedSessionId ?? "", {
    hasFilters,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
  });

  const staff = staffList;
  const isInitialLoading = isAppLoading && staffList.length === 0;

  // Months derived from selected session (start/end date) so transfer to new session shows correct months
  const sessionMonths = useMemo(() => {
    if (!selectedSession?.startDate || !selectedSession?.endDate) return [];
    return getFeeHistoryMonths(selectedSession.startDate, selectedSession.endDate);
  }, [selectedSession?.startDate, selectedSession?.endDate]);
  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const payableMonths = sessionMonths;

  const list = staffList;

  // Extract unique classes and subjects from current list (for filter dropdowns)
  const { uniqueClasses, uniqueSubjects } = useMemo(() => {
    const classSet = new Set<string>();
    const subjectSet = new Set<string>();
    list.forEach((s) => {
      if (s.classesSubjects) {
        s.classesSubjects.forEach((cs) => {
          if (cs.className) classSet.add(cs.className);
          cs.subjects?.forEach((sub) => subjectSet.add(sub));
        });
      }
    });
    return {
      uniqueClasses: Array.from(classSet).sort(),
      uniqueSubjects: Array.from(subjectSet).sort(),
    };
  }, [list]);

  // Search and role are applied on backend; only class and subject filters on client
  const filteredList = useMemo(() => {
    let out = list;
    if (classFilter) {
      out = out.filter((s) =>
        s.classesSubjects?.some((cs) => cs.className === classFilter)
      );
    }
    if (subjectFilter) {
      out = out.filter((s) =>
        s.classesSubjects?.some((cs) => cs.subjects?.includes(subjectFilter))
      );
    }
    return out;
  }, [list, classFilter, subjectFilter]);

  // Reset classes/subjects form state when opening modal
  useEffect(() => {
    if (staffModal.open) {
      setClassesSubjects(staffModal.staff?.classesSubjects ?? []);
    }
  }, [staffModal.open, staffModal.staff]);

  const handleSaveStaff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const employeeId = (form.elements.namedItem("employeeId") as HTMLInputElement).value.trim();
    const role = (form.elements.namedItem("role") as HTMLSelectElement).value as StaffRole;
    const monthlySalary = Number((form.elements.namedItem("monthlySalary") as HTMLInputElement).value);
    const subjectOrGrade = (form.elements.namedItem("subjectOrGrade") as HTMLInputElement).value.trim();
    const allowedLeavesPerMonth = Number((form.elements.namedItem("allowedLeavesPerMonth") as HTMLInputElement).value) || 2;
    const perDaySalaryInput = (form.elements.namedItem("perDaySalary") as HTMLInputElement).value;
    const perDaySalary = perDaySalaryInput ? Number(perDaySalaryInput) : undefined;

    if (!selectedSessionId || !name || monthlySalary <= 0) return;

    // Filter out empty class/subject entries
    const validClassesSubjects = classesSubjects.filter(
      (cs) => cs.className.trim() && cs.subjects.length > 0
    );

    if (staffModal.staff) {
      updateStaff(staffModal.staff.id, {
        name,
        employeeId: employeeId || undefined,
        role,
        monthlySalary,
        subjectOrGrade: subjectOrGrade || undefined,
        allowedLeavesPerMonth,
        perDaySalary,
        classesSubjects: validClassesSubjects.length > 0 ? validClassesSubjects : undefined,
      });
      toast("Staff updated");
    } else {
      addStaff({
        sessionId: selectedSessionId,
        name,
        employeeId: employeeId || `EMP-${Date.now()}`,
        role,
        monthlySalary,
        subjectOrGrade: subjectOrGrade || undefined,
        allowedLeavesPerMonth,
        perDaySalary,
        classesSubjects: validClassesSubjects.length > 0 ? validClassesSubjects : undefined,
      });
      toast("Staff added");
    }
    setStaffModal({ open: false });
  };

  // Class/Subject management helpers
  const addClassSubject = () => {
    setClassesSubjects([...classesSubjects, { className: "", subjects: [] }]);
  };

  const removeClassSubject = (index: number) => {
    setClassesSubjects(classesSubjects.filter((_, i) => i !== index));
  };

  const updateClassSubject = (index: number, field: "className" | "subjects", value: string | string[]) => {
    const updated = [...classesSubjects];
    if (field === "className") {
      updated[index] = { ...updated[index], className: value as string };
    } else {
      updated[index] = { ...updated[index], subjects: value as string[] };
    }
    setClassesSubjects(updated);
  };

  const handleSaveSalary = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!salaryModal) return;
    const form = e.currentTarget;
    const month = salaryModal.month;
    const status = (form.elements.namedItem("status") as HTMLSelectElement).value as "Paid" | "Pending" | "Partially Paid";
    const daysWorked = Number((form.elements.namedItem("daysWorked") as HTMLInputElement).value) || 30;
    const leavesTaken = Number((form.elements.namedItem("leavesTaken") as HTMLInputElement).value) || 0;
    const extraAllowance = Number((form.elements.namedItem("extraAllowance") as HTMLInputElement).value) || 0;
    const allowanceNote = (form.elements.namedItem("allowanceNote") as HTMLInputElement).value.trim() || undefined;
    const extraDeduction = Number((form.elements.namedItem("extraDeduction") as HTMLInputElement).value) || 0;
    const deductionNote = (form.elements.namedItem("deductionNote") as HTMLInputElement).value.trim() || undefined;
    const paymentDate = (form.elements.namedItem("paymentDate") as HTMLInputElement).value || undefined;
    const method = (form.elements.namedItem("method") as HTMLSelectElement).value as "Cash" | "Cheque" | "Online" | "Bank Transfer" | "";
    const dueDate = `${month}-${String(salaryDueDay).padStart(2, "0")}`;

    // Calculate final amount based on deductions
    const staff = salaryModal.staff;
    const perDay = staff.perDaySalary ?? staff.monthlySalary / 30;
    const allowedLeaves = staff.allowedLeavesPerMonth ?? 2;
    const excessLeaves = Math.max(0, leavesTaken - allowedLeaves);
    const leaveDeduction = excessLeaves * perDay;
    const calculatedSalary = staff.monthlySalary - leaveDeduction - extraDeduction + extraAllowance;

    try {
      await addSalaryPaymentAsync(staff.id, {
        month,
        amount: calculatedSalary,
        status,
        paymentDate: paymentDate || undefined,
        method: method || undefined,
        dueDate,
        daysWorked,
        leavesTaken,
        allowedLeaves,
        excessLeaves,
        leaveDeduction,
        extraAllowance,
        allowanceNote,
        extraDeduction,
        deductionNote,
        calculatedSalary,
      });
      toast("Salary payment recorded");
      if (salaryModal.fromHistory) {
        setSalaryHistoryModal(staff);
      }
      setSalaryModal(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to record payment";
      toast(message);
    }
  };

  const annualTotal = useMemo(
    () => list.reduce((sum, s) => sum + s.monthlySalary * 12, 0),
    [list]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Staff & Salary</h2>
          <p className="text-slate-600">Manage staff and salary payments</p>
        </div>
        <div className="flex items-center gap-2">
          {list.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const csv = exportStaffToCSV(list);
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `staff_export_${new Date().toISOString().slice(0, 10)}.csv`;
                link.click();
                URL.revokeObjectURL(url);
                toast("Staff exported to CSV");
              }}
            >
              <Download className="mr-1 h-4 w-4" />
              Export CSV
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            disabled={!selectedSessionId}
            onClick={() => setImportModalOpen(true)}
          >
            <Upload className="mr-1 h-4 w-4" />
            Import CSV
          </Button>
          <Button
            size="sm"
            disabled={!selectedSessionId}
            onClick={() => setStaffModal({ open: true })}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add staff
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!selectedSessionId || allSessionStaff.length === 0}
            onClick={() => {
              setTransferModalOpen(true);
              setTransferStep("select");
              setTransferTargetSessionId(null);
              setTransferSelectedIds(new Set());
            }}
          >
            <ArrowRightLeft className="mr-1 h-4 w-4" />
            Transfer to new session
          </Button>
          {/* <Button
            size="sm"
            variant="danger"
            disabled={!selectedSessionId}
            onClick={() => setConfirmDeleteAllStaff(true)}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete all staff (Danger)
          </Button> */}
        </div>
      </div>

      {list.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-slate-600">
              Annual salary obligation: <strong>{formatCurrency(annualTotal)}</strong>
            </p>
          </CardContent>
        </Card>
      )}

      {!selectedSessionId ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            Select a school and session to view staff.
          </CardContent>
        </Card>
      ) : isInitialLoading ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <SkeletonTable rows={8} columns={6} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Staff ({staffTotal})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="overflow-x-auto">
                <div className="flex items-center gap-3 flex-nowrap min-w-max pb-1">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by name or ID..."
                    className="max-w-xs shrink-0"
                  />
                  <Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-40 shrink-0"
                  >
                    {STAFF_ROLE_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value || "all"} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                  {uniqueClasses.length > 0 && (
                    <Select
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="w-36"
                    >
                      <option value="">All Classes</option>
                      {uniqueClasses.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </Select>
                  )}
                  {uniqueSubjects.length > 0 && (
                    <Select
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      className="w-36"
                    >
                      <option value="">All Subjects</option>
                      {uniqueSubjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto min-h-13 overflow-y-hidden rounded-md flex items-center">
                <FilterChips
                  options={STAFF_ROLE_FILTER_OPTIONS}
                  value={roleFilter}
                  onChange={setRoleFilter}
                  className="flex-nowrap min-w-max"
                />
              </div>
            </div>
            {list.length === 0 ? (
              <EmptyState message="No staff in this session." />
            ) : filteredList.length === 0 ? (
              <EmptyState message="No staff match your search or filter." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="pb-2 pr-4 font-medium">Name</th>
                      <th className="pb-2 pr-4 font-medium">ID</th>
                      <th className="pb-2 pr-4 font-medium">Role</th>
                      <th className="pb-2 pr-4 font-medium">Monthly</th>
                      <th className="pb-2 pr-4 font-medium">Last Paid</th>
                      <th className="pb-2 pr-4 font-medium">This Month</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((s) => {
                      const lastPaid = getLastPaidInfo(s.salaryPayments, salaryDueDay);
                      const currentMonthPayments = s.salaryPayments.filter(p => p.month === currentMonth);
                      const currentMonthPayment = currentMonthPayments[0];
                      const currentMonthPaidCount = currentMonthPayments.filter(p => p.status === "Paid").length;

                      return (
                        <tr key={s.id} className="border-b border-slate-100">
                          <td className="py-3 pr-4 font-medium text-slate-900">{s.name}</td>
                          <td className="py-3 pr-4 text-slate-600">{s.employeeId}</td>
                          <td className="py-3 pr-4">
                            <Badge variant={getRoleBadgeVariant(s.role)}>
                              {s.role}
                              {s.subjectOrGrade && ` (${s.subjectOrGrade})`}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">{formatCurrency(s.monthlySalary)}</td>
                          <td className="py-3 pr-4">
                            {lastPaid.date ? (
                              <div className="flex flex-col">
                                <span className="text-slate-900">
                                  {formatDate(lastPaid.date)}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {formatMonthYear(lastPaid.month ?? '')}
                                </span>
                                {lastPaid.lateDays > 0 && (
                                  <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                                    <Clock className="h-3 w-3" />
                                    {lastPaid.lateDays} day{lastPaid.lateDays !== 1 ? 's' : ''} late
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">Never</span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            {currentMonthPayment ? (
                              <span className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                currentMonthPaidCount > 0 ? "bg-green-100 text-green-800" :
                                  currentMonthPayment.status === "Partially Paid" ? "bg-amber-100 text-amber-800" :
                                    "bg-red-100 text-red-800"
                              )}>
                                {currentMonthPaidCount > 0 && <CheckCircle className="h-3 w-3" />}
                                {currentMonthPaidCount === 0 && currentMonthPayment.status === "Pending" && <XCircle className="h-3 w-3" />}
                                {currentMonthPaidCount === 0 && currentMonthPayment.status === "Partially Paid" && <AlertCircle className="h-3 w-3" />}
                                {currentMonthPaidCount > 0 ? (currentMonthPaidCount > 1 ? `Paid (${currentMonthPaidCount})` : "Paid") : currentMonthPayment.status}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                <XCircle className="h-3 w-3" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1">
                              <PermissionGate anyPermission={["salary:manage", "salary:record"]}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSalaryHistoryModal(s)}
                                  title="View salary history & pay"
                                >
                                  <Calendar className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                              <PermissionGate permission="staff:edit">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setStaffModal({ open: true, staff: s })}
                                  title="Edit staff details"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                              <PermissionGate permission="staff:delete">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => setConfirmDelete({ id: s.id, name: s.name })}
                                  title="Delete staff member"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {hasNextPage && list.length > 0 && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Modal
        open={staffModal.open}
        onClose={() => setStaffModal({ open: false })}
        title={staffModal.staff ? "Edit staff" : "Add staff"}
      >
        <form onSubmit={handleSaveStaff} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <FormField label="Name" required>
            <Input name="name" type="text" required defaultValue={staffModal.staff?.name} />
          </FormField>
          <FormField label="Employee ID">
            <Input name="employeeId" type="text" defaultValue={staffModal.staff?.employeeId} />
          </FormField>
          <FormField label="Role">
            <Select name="role" defaultValue={staffModal.staff?.role ?? "Teacher"}>
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </FormField>
          {/* <FormField label="Subject / Grade (legacy, for display)">
            <Input name="subjectOrGrade" type="text" defaultValue={staffModal.staff?.subjectOrGrade} />
          </FormField> */}
          <FormField label="Monthly salary (₹)" required>
            <Input
              name="monthlySalary"
              type="number"
              required
              min={1}
              defaultValue={staffModal.staff?.monthlySalary}
            />
          </FormField>

          {/* Leave & Salary Configuration */}
          <div className="border-t border-slate-200 pt-4 mt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Leave & Salary Configuration</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Allowed Leaves/Month" helperText="Leaves without salary deduction">
                <Input
                  name="allowedLeavesPerMonth"
                  type="number"
                  min={0}
                  max={30}
                  defaultValue={staffModal.staff?.allowedLeavesPerMonth ?? 2}
                />
              </FormField>
              <FormField label="Per Day Salary (₹)" helperText="Leave empty for monthly/30">
                <Input
                  name="perDaySalary"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={staffModal.staff?.perDaySalary ?? ""}
                  placeholder="Auto-calculated"
                />
              </FormField>
            </div>
          </div>

          {/* Classes & Subjects */}
          <div className="border-t border-slate-200 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-700">Classes & Subjects</h4>
              <Button type="button" variant="secondary" size="sm" onClick={addClassSubject}>
                <Plus className="h-3 w-3 mr-1" />
                Add Class
              </Button>
            </div>
            {classesSubjects.length === 0 ? (
              <p className="text-sm text-slate-500">No classes assigned. Click "Add Class" to assign classes and subjects.</p>
            ) : (
              <div className="space-y-3">
                {classesSubjects.map((cs, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Input
                        type="text"
                        placeholder="Class name (e.g., Class 5)"
                        value={cs.className}
                        onChange={(e) => updateClassSubject(index, "className", e.target.value)}
                      />
                      <Input
                        type="text"
                        placeholder="Subjects (comma-separated, e.g., Math, Science)"
                        value={cs.subjects.join(", ")}
                        onChange={(e) =>
                          updateClassSubject(
                            index,
                            "subjects",
                            e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                          )
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => removeClassSubject(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setStaffModal({ open: false })}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedSessionId}>Save</Button>
          </div>
        </form>
      </Modal>

      {salaryModal && <SalaryPaymentModalContent
        staff={salaryModal.staff}
        month={salaryModal.month}
        salaryDueDay={salaryDueDay}
        onClose={() => {
          // If opened from salary history, reopen it when cancelled
          if (salaryModal.fromHistory) {
            setSalaryHistoryModal(salaryModal.staff);
          }
          setSalaryModal(null);
        }}
        onSubmit={handleSaveSalary}
      />}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteStaff(confirmDelete.id);
            toast("Staff deleted");
            setConfirmDelete(null);
          }
        }}
        title="Delete staff"
        message={`Delete "${confirmDelete?.name}"?`}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={confirmDeleteAllStaff}
        onClose={() => setConfirmDeleteAllStaff(false)}
        onConfirm={() => {
          if (!selectedSessionId) return;
          deleteAllStaffMut.mutate(selectedSessionId, {
            onSuccess: (deleted) => {
              toast(deleted > 0 ? `Deleted ${deleted} staff member(s)` : "No staff to delete");
              setConfirmDeleteAllStaff(false);
            },
            onError: (err) => {
              toast(err instanceof Error ? err.message : "Failed to delete all staff", "error");
            },
          });
        }}
        title="Delete all staff"
        message="This will permanently delete all staff in this session and their salary history. This action cannot be undone. Are you sure?"
        confirmLabel="Delete all"
      />

      <BulkImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        type="staff"
        sessionId={selectedSessionId}
        onImportStudents={() => { }}
        onImportStaff={async (rows) => {
          if (!selectedSessionId) return;
          const staffToCreate = rows.map((r) => {
            // Parse classesSubjectsRaw: "Class1:Math,Science;Class2:English" format
            let classesSubjects: ClassSubject[] | undefined;
            if (r.classesSubjectsRaw) {
              classesSubjects = r.classesSubjectsRaw.split(";").map((part) => {
                const [className, subjectsStr] = part.split(":");
                return {
                  className: className?.trim() ?? "",
                  subjects: subjectsStr?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
                };
              }).filter((cs) => cs.className && cs.subjects.length > 0);
            }

            return {
              sessionId: selectedSessionId,
              name: r.name,
              employeeId: r.employeeId ?? "",
              role: r.role,
              monthlySalary: r.monthlySalary,
              subjectOrGrade: r.subjectOrGrade,
              allowedLeavesPerMonth: r.allowedLeavesPerMonth ?? 2,
              perDaySalary: r.perDaySalary,
              classesSubjects,
            };
          });
          await createStaffBulk.mutateAsync(staffToCreate);
          toast(`${rows.length} staff member(s) imported`);
          setImportModalOpen(false);
        }}
      />

      {/* Salary History Modal - use latest staff from context so payments stay in sync */}
      {salaryHistoryModal && (() => {
        const historyStaff = staff.find((s: StaffType) => s.id === salaryHistoryModal.id) ?? salaryHistoryModal;
        const monthsToShow = getSalaryHistoryMonths(
          sessionMonths,
          historyStaff.salaryPayments.map((p: SalaryPayment) => p.month)
        );
        return (
          <Modal
            open={!!salaryHistoryModal}
            onClose={() => setSalaryHistoryModal(null)}
            title={`Salary History – ${historyStaff.name}`}
          >
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-600">
                      Monthly Salary: <strong>{formatCurrency(historyStaff.monthlySalary)}</strong>
                    </p>
                    <p className="text-xs text-slate-500">
                      Allowed Leaves: {historyStaff.allowedLeavesPerMonth ?? 2}/month
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900">
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="pb-2 pr-4 font-medium">Month</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 pr-4 font-medium">Amount</th>
                      <th className="pb-2 pr-4 font-medium">Paid On</th>
                      <th className="pb-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthsToShow.map((month) => {
                      const paymentsForMonth = historyStaff.salaryPayments.filter((p: SalaryPayment) => p.month === month);
                      const totalAmount = paymentsForMonth.reduce((s: number, p: SalaryPayment) => s + p.amount, 0);
                      const anyPaid = paymentsForMonth.some((p: SalaryPayment) => p.status === "Paid");
                      const firstPayment = paymentsForMonth[0];
                      const lateDays = firstPayment ? calculateLateDays(firstPayment, salaryDueDay) : 0;
                      const statusLabel = paymentsForMonth.length > 1
                        ? (anyPaid ? "Paid" : firstPayment?.status ?? "—") + ` (${paymentsForMonth.length} payments)`
                        : firstPayment?.status ?? "—";

                      return (
                        <tr key={month} className="border-b border-slate-100 group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 pr-4 font-medium text-slate-900 dark:text-slate-100">{formatMonthYear(month)}</td>
                          <td className="py-2 pr-4">
                            {firstPayment ? (
                              <div className="flex flex-col gap-1">
                                <span className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium w-fit",
                                  anyPaid ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                                    firstPayment.status === "Partially Paid" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
                                      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                )}>
                                  {anyPaid && <CheckCircle className="h-3 w-3" />}
                                  {!anyPaid && firstPayment.status === "Pending" && <XCircle className="h-3 w-3" />}
                                  {!anyPaid && firstPayment.status === "Partially Paid" && <AlertCircle className="h-3 w-3" />}
                                  {statusLabel}
                                </span>
                                {anyPaid && lateDays > 0 && (
                                  <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                                    <Clock className="h-3 w-3" />
                                    {lateDays}d late
                                  </span>
                                )}
                                {firstPayment.leaveDeduction > 0 && (
                                  <span className="text-xs text-red-600">
                                    -{formatCurrency(firstPayment.leaveDeduction)} leave
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                                <XCircle className="h-3 w-3" />
                                Not Paid
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-4">
                            {totalAmount > 0 ? (
                              <div className="flex flex-col">
                                <span>{formatCurrency(totalAmount)}</span>
                                {firstPayment?.calculatedSalary && firstPayment.calculatedSalary !== totalAmount && (
                                  <span className="text-xs text-slate-500">
                                    Calc: {formatCurrency(firstPayment.calculatedSalary)}
                                  </span>
                                )}
                              </div>
                            ) : "—"}
                          </td>
                          <td className="py-2 pr-4">
                            {firstPayment?.paymentDate
                              ? formatDate(firstPayment.paymentDate)
                              : "—"}
                          </td>
                          <td className="py-2">
                            <PermissionGate anyPermission={["salary:manage", "salary:record"]}>
                              {paymentsForMonth.length === 0 ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    setSalaryModal({ staff: historyStaff, month, fromHistory: true });
                                  }}
                                  title="Pay salary for this month"
                                >
                                  <Banknote className="h-4 w-4 mr-1" />
                                  Pay
                                </Button>
                              ) : (
                                <span className="text-xs text-slate-400" title="Already paid for this month">—</span>
                              )}
                            </PermissionGate>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-4">
                <div>
                  <p className="text-sm text-slate-600">
                    Total Paid (this session):{" "}
                    <strong>
                      {formatCurrency(
                        historyStaff.salaryPayments
                          .filter((p: SalaryPayment) => sessionMonths.includes(p.month) && p.status === "Paid")
                          .reduce((sum: number, p: SalaryPayment) => sum + p.amount, 0)
                      )}
                    </strong>
                  </p>
                </div>
                <Button onClick={() => setSalaryHistoryModal(null)}>Close</Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Transfer to new session modal */}
      <Modal
        open={transferModalOpen}
        onClose={() => {
          setTransferModalOpen(false);
          setTransferStep("select");
          setTransferTargetSessionId(null);
          setTransferSelectedIds(new Set());
        }}
        title={transferStep === "select" ? "Transfer staff to new session" : "Preview – Select staff to transfer"}
      >
        <div className="space-y-4">
          {transferStep === "select" && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Select the target session to copy staff to. Salary and other details will be copied; salary payment records will not be copied.
              </p>
              <FormField label="Target session" required>
                <Select
                  value={transferTargetSessionId ?? ""}
                  onChange={(e) => setTransferTargetSessionId(e.target.value || null)}
                >
                  <option value="">Select session</option>
                  {targetSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.year} ({s.startDate} – {s.endDate})
                    </option>
                  ))}
                </Select>
              </FormField>
              {targetSessions.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  No other session found for this school. Create a new session first.
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setTransferModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!transferTargetSessionId}
                  onClick={() => {
                    setTransferStep("preview");
                    setTransferSelectedIds(new Set(allSessionStaff.map((s) => s.id)));
                  }}
                >
                  Next – Preview
                </Button>
              </div>
            </>
          )}

          {transferStep === "preview" && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Uncheck any staff member you do not want to transfer. Salary payment history will not be copied.
              </p>
              {allSessionStaff.length === 0 ? (
                <p className="text-sm text-slate-500">No staff in this session.</p>
              ) : (
                <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                        <th className="w-10 px-3 py-2">
                          <input
                            type="checkbox"
                            checked={transferSelectedIds.size === allSessionStaff.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTransferSelectedIds(new Set(allSessionStaff.map((s) => s.id)));
                              } else {
                                setTransferSelectedIds(new Set());
                              }
                            }}
                          />
                        </th>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">ID</th>
                        <th className="px-3 py-2 font-medium">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSessionStaff.map((s) => (
                        <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="w-10 px-3 py-2">
                            <input
                              type="checkbox"
                              checked={transferSelectedIds.has(s.id)}
                              onChange={(e) => {
                                setTransferSelectedIds((prev) => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(s.id);
                                  else next.delete(s.id);
                                  return next;
                                });
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">{s.name}</td>
                          <td className="px-3 py-2">{s.employeeId ?? "—"}</td>
                          <td className="px-3 py-2">{s.role ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {transferSelectedIds.size} of {allSessionStaff.length} selected
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setTransferStep("select")}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    disabled={transferSelectedIds.size === 0 || transferSubmitting}
                    onClick={async () => {
                      if (!transferTargetSessionId) return;
                      setTransferSubmitting(true);
                      try {
                        const staffIds = Array.from(transferSelectedIds);
                        const count = await transferStaffMut.mutateAsync({
                          fromSessionId: selectedSessionId ?? "",
                          staffIds,
                          toSessionId: transferTargetSessionId,
                        });
                        toast(`${count} staff member(s) transferred`);
                        setTransferModalOpen(false);
                        setTransferStep("select");
                        setTransferTargetSessionId(null);
                        setTransferSelectedIds(new Set());
                      } catch (e) {
                        toast(e instanceof Error ? e.message : "Transfer failed", "error");
                      } finally {
                        setTransferSubmitting(false);
                      }
                    }}
                  >
                    {transferSubmitting ? "Transferring…" : `Transfer ${transferSelectedIds.size} staff member(s)`}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
