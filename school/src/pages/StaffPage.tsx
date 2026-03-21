import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useApp } from "../context/AppContext";
import { useStaffBySessionInfinite, useStaffBySession, useCreateStaff, useCreateStaffBulk, useUpdateStaff, useDeleteStaff, useDeleteAllStaffBySession, useAddSalaryPayment, useTransferStaffToSession, useLeaveSummary } from "../hooks/useStaff";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Skeleton, SkeletonTable } from "../components/ui/Skeleton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { createPortal } from "react-dom";
import { Plus, Pencil, Trash2, Upload, Calendar, Clock, CheckCircle, AlertCircle, XCircle, X, AlertTriangle, Banknote, Download, ArrowRightLeft, MoreVertical } from "lucide-react";
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

/** Total paid in a month (sum of paidAmount across all payment records for that month). */
function getTotalPaidForMonth(payments: SalaryPayment[], month: string): number {
  return payments
    .filter((p) => p.month === month)
    .reduce((sum, p) => sum + (p.paidAmount ?? p.amount ?? 0), 0);
}

/** Expected salary for a month (from first payment's calculatedSalary for that month, or fallback). */
function getExpectedSalaryForMonth(payments: SalaryPayment[], month: string, fallbackMonthly: number): number {
  const first = payments.find((p) => p.month === month);
  return first?.calculatedSalary ?? fallbackMonthly;
}

/** Effective status for a month when multiple partial payments can add up to full. */
function getMonthSalaryStatus(
  payments: SalaryPayment[],
  month: string,
  monthlySalary: number
): { status: "Paid" | "Partially Paid" | "Pending"; totalPaid: number; expectedAmount: number; paymentCount: number } {
  const forMonth = payments.filter((p) => p.month === month);
  const totalPaid = forMonth.reduce((sum, p) => sum + (p.paidAmount ?? p.amount ?? 0), 0);
  const expectedAmount = forMonth[0]?.calculatedSalary ?? monthlySalary;
  let status: "Paid" | "Partially Paid" | "Pending" = "Pending";
  if (totalPaid >= expectedAmount) status = "Paid";
  else if (totalPaid > 0) status = "Partially Paid";
  return { status, totalPaid, expectedAmount, paymentCount: forMonth.length };
}

// Get last paid salary info for a staff member (dueDay from session for fallback when payment has no dueDate).
// Considers a month "paid" when total paid for that month >= expected (so 2 partials = paid).
function getLastPaidInfo(
  salaryPayments: SalaryPayment[],
  dueDay: number = 5,
  monthlySalary: number = 0
): { date: string | null; lateDays: number; month: string | null } {
  const months = [...new Set(salaryPayments.map((p) => p.month))];
  const fullyPaidMonths = months.filter((m) => {
    const { totalPaid, expectedAmount } = getMonthSalaryStatus(salaryPayments, m, monthlySalary);
    return expectedAmount > 0 && totalPaid >= expectedAmount;
  });
  if (fullyPaidMonths.length === 0) {
    return { date: null, lateDays: 0, month: null };
  }
  const lastMonth = fullyPaidMonths.sort((a, b) => b.localeCompare(a))[0];
  const lastPayments = salaryPayments.filter((p) => p.month === lastMonth && p.paymentDate).sort(
    (a, b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime()
  );
  const lastPayment = lastPayments[0];
  return {
    date: lastPayment?.paymentDate ?? null,
    lateDays: lastPayment ? calculateLateDays(lastPayment, dueDay) : 0,
    month: lastMonth,
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

// Salary payment form (used inside tabbed modal; no Modal wrapper)
function SalaryPaymentForm({
  staff,
  month,
  salaryDueDay,
  onCancel,
  onSubmit,
}: {
  staff: StaffType;
  month: string;
  salaryDueDay: number;
  onCancel?: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const { data: leaveSummary, isLoading: leaveSummaryLoading } = useLeaveSummary(staff.id, month);

  // Get existing payment for this month (for partial payment continuation)
  const existingPayment = staff.salaryPayments.find((p) => p.month === month);
  const previouslyPaidAmount = existingPayment?.paidAmount ?? (existingPayment?.status === "Paid" ? existingPayment?.calculatedSalary ?? 0 : 0);
  
  // Local state for form values
  const [daysWorked, setDaysWorked] = useState(existingPayment?.daysWorked ?? 30);
  const [leavesTaken, setLeavesTaken] = useState(existingPayment?.leavesTaken ?? 0);
  const [extraAllowance, setExtraAllowance] = useState(existingPayment?.extraAllowance ?? 0);
  const [extraDeduction, setExtraDeduction] = useState(existingPayment?.extraDeduction ?? 0);
  const [payAmount, setPayAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form values when leave summary or month changes
  useEffect(() => {
    if (leaveSummary && !existingPayment) {
      setDaysWorked(leaveSummary.daysWorked);
      setLeavesTaken(leaveSummary.leavesTaken);
    }
  }, [leaveSummary, existingPayment]);

  // Reset form when month changes
  useEffect(() => {
    const pay = staff.salaryPayments.find((p) => p.month === month);
    setDaysWorked(pay?.daysWorked ?? 30);
    setLeavesTaken(pay?.leavesTaken ?? 0);
    setExtraAllowance(pay?.extraAllowance ?? 0);
    setExtraDeduction(pay?.extraDeduction ?? 0);
  }, [month, staff.salaryPayments]);

  // Calculate salary breakdown
  const perDay = staff.perDaySalary ?? staff.monthlySalary / 30;
  const allowedLeaves = staff.allowedLeavesPerMonth ?? 1;
  const excessLeaves = Math.max(0, leavesTaken - allowedLeaves);
  const leaveDeduction = excessLeaves * perDay;
  const calculatedSalary = staff.monthlySalary - leaveDeduction - extraDeduction + extraAllowance;
  
  // Calculate remaining amount for partial payments (cap to 2 decimal places)
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const remainingAmount = round2(Math.max(0, calculatedSalary - previouslyPaidAmount));
  const isPartiallyPaid = existingPayment?.status === "Partially Paid";
  const isFullyPaid = existingPayment?.status === "Paid";

  // Set default pay amount when calculated salary changes
  useEffect(() => {
    setPayAmount(remainingAmount);
  }, [remainingAmount]);

  // Validate pay amount doesn't exceed remaining, rounded to 2 decimals
  const validatePayAmount = (value: number) => {
    const v = round2(Math.max(0, value));
    return Math.min(v, remainingAmount);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || payAmount <= 0 || payAmount > remainingAmount) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hidden fields for form data */}
        <input type="hidden" name="calculatedSalary" value={calculatedSalary} />
        <input type="hidden" name="previouslyPaidAmount" value={previouslyPaidAmount} />
        <input type="hidden" name="remainingAmount" value={remainingAmount} />
        
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

        {/* Partial Payment Status */}
        {isPartiallyPaid && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Continuing partial payment</strong>
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-blue-600">Total Salary:</span>
                <p className="font-medium text-blue-800 dark:text-blue-200">{formatCurrency(calculatedSalary)}</p>
              </div>
              <div>
                <span className="text-blue-600">Already Paid:</span>
                <p className="font-medium text-green-600">{formatCurrency(previouslyPaidAmount)}</p>
              </div>
              <div>
                <span className="text-blue-600">Remaining:</span>
                <p className="font-medium text-amber-600">{formatCurrency(remainingAmount)}</p>
              </div>
            </div>
          </div>
        )}
        
        {isFullyPaid && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              Salary for this month is fully paid ({formatCurrency(existingPayment?.calculatedSalary ?? 0)})
            </p>
          </div>
        )}

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

        {!isFullyPaid && (
          <>
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
                    defaultValue={existingPayment?.allowanceNote}
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
                  defaultValue={existingPayment?.deductionNote}
                />
              </FormField>
            </div>

            {/* Calculated Salary */}
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    {isPartiallyPaid ? "Remaining to Pay" : "Total Salary"}
                  </span>
                </div>
                <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(isPartiallyPaid ? remainingAmount : calculatedSalary)}
                </span>
              </div>
              {!isPartiallyPaid && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  = {formatCurrency(staff.monthlySalary)}
                  {leaveDeduction > 0 && ` - ${formatCurrency(leaveDeduction)} (leave)`}
                  {extraDeduction > 0 && ` - ${formatCurrency(extraDeduction)} (deduction)`}
                  {extraAllowance > 0 && ` + ${formatCurrency(extraAllowance)} (allowance)`}
                </p>
              )}
            </div>

            {/* Amount to Pay */}
            <div className="border-t border-slate-200 pt-4">
              <FormField 
                label="Amount to Pay (₹)" 
                helperText={`Max: ${formatCurrency(remainingAmount)}`}
                required
              >
                <Input
                  name="payAmount"
                  type="number"
                  min={0.01}
                  max={remainingAmount}
                  step={0.01}
                  value={payAmount}
                  onChange={(e) => setPayAmount(validatePayAmount(Number(e.target.value)))}
                  onBlur={() => setPayAmount(round2(Math.min(Math.max(0, payAmount), remainingAmount)))}
                  className="text-lg font-semibold"
                />
              </FormField>
              {payAmount > remainingAmount && (
                <p className="text-xs text-red-600 mt-1">
                  Amount cannot exceed {formatCurrency(remainingAmount)}
                </p>
              )}
            </div>

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
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
              Back
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isFullyPaid || payAmount <= 0 || payAmount > remainingAmount || isSubmitting}
            loading={isSubmitting}
            loadingText="Processing..."
          >
            {payAmount < remainingAmount ? "Pay Partial" : "Pay Full Salary"}
          </Button>
        </div>
      </form>
  );
}

export function StaffPage() {
  const queryClient = useQueryClient();
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

  const addStaff = (data: Omit<StaffType, "id" | "salaryPayments">, options?: { onSuccess?: (newStaff?: StaffType) => void }) =>
    createStaff.mutate(data, { onSuccess: options?.onSuccess });
  const updateStaff = (id: string, data: Partial<Omit<StaffType, "id" | "salaryPayments">>, options?: { onError?: () => void }) =>
    updateStaffMut.mutate(
      { id, updates: data, sessionId: selectedSessionId ?? undefined },
      { onError: options?.onError }
    );
  const deleteStaff = (idOrPayload: string | { id: string }) => {
    const id = typeof idOrPayload === "string" ? idOrPayload : idOrPayload.id;
    deleteStaffMut.mutate(selectedSessionId ? { id, sessionId: selectedSessionId } : id);
  };
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
  const [salaryHistoryModal, setSalaryHistoryModal] = useState<StaffType | null>(null);
  const [activeSalaryTab, setActiveSalaryTab] = useState<"history" | "payment">("history");
  const [paymentMonth, setPaymentMonth] = useState<string>(() => getCurrentMonth());
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [actionMenuStaff, setActionMenuStaff] = useState<StaffType | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferStep, setTransferStep] = useState<"select" | "preview">("select");
  const [transferTargetSessionId, setTransferTargetSessionId] = useState<string | null>(null);
  const [transferSelectedIds, setTransferSelectedIds] = useState<Set<string>>(new Set());
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [confirmDeleteAllStaff, setConfirmDeleteAllStaff] = useState(false);
  const [isStaffSubmitting, setIsStaffSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const classFilter = searchParams.get("class") ?? "";
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");

  // Staff form state for classes & subjects
  const [classesSubjects, setClassesSubjects] = useState<ClassSubject[]>([]);

  const debouncedSearch = useDebouncedValue(searchQuery.trim(), 300);
  // Staff API expects class name (e.g. "Nur"), not class ID; ignore URL class param if it looks like a UUID (e.g. from Students page)
  const teachingClassFilter =
    classFilter && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classFilter)
      ? classFilter
      : undefined;
  const hasFilters = !!(roleFilter || debouncedSearch || teachingClassFilter || subjectFilter);
  const {
    staffList,
    total: staffTotal,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isAppLoading,
    isFetching: isStaffListFetching,
    refetch: refetchStaffList,
  } = useStaffBySessionInfinite(selectedSessionId ?? "", {
    hasFilters,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
    teachingClass: teachingClassFilter,
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

  // Search, role and class filter are applied via API; only subject filter on client
  const filteredList = useMemo(() => {
    let out = list;
    if (subjectFilter) {
      out = out.filter((s) =>
        s.classesSubjects?.some((cs) => cs.subjects?.includes(subjectFilter))
      );
    }
    return out;
  }, [list, subjectFilter]);

  // Clear URL class param when it's a UUID (from Students page); Staff filter uses class name, not ID
  useEffect(() => {
    if (
      classFilter &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classFilter)
    ) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("class");
        return next;
      }, { replace: true });
    }
  }, [classFilter, setSearchParams]);

  // Reset classes/subjects form state when opening modal
  useEffect(() => {
    if (staffModal.open) {
      setClassesSubjects(staffModal.staff?.classesSubjects ?? []);
    }
  }, [staffModal.open, staffModal.staff]);

  const handleSaveStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isStaffSubmitting) return;
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const employeeId = (form.elements.namedItem("employeeId") as HTMLInputElement).value.trim();
    const role = (form.elements.namedItem("role") as HTMLSelectElement).value as StaffRole;
    const monthlySalary = Number((form.elements.namedItem("monthlySalary") as HTMLInputElement).value);
    const subjectOrGrade = (form.elements.namedItem("subjectOrGrade") as HTMLInputElement)?.value?.trim() ?? "";
    const allowedLeavesPerMonth = Number((form.elements.namedItem("allowedLeavesPerMonth") as HTMLInputElement).value) || 1;
    const perDaySalaryInput = (form.elements.namedItem("perDaySalary") as HTMLInputElement).value;
    const perDaySalary = perDaySalaryInput ? Number(perDaySalaryInput) : undefined;
    const aadhaarNumber = (form.elements.namedItem("aadhaarNumber") as HTMLInputElement).value.trim();
    const dateOfBirth = (form.elements.namedItem("dateOfBirth") as HTMLInputElement).value;

    if (!selectedSessionId || !name || monthlySalary <= 0) {
      if (!selectedSessionId) toast("Please select a session first.", "error");
      return;
    }

    if (aadhaarNumber && !/^\d{12}$/.test(aadhaarNumber)) {
      toast("Aadhaar number must be exactly 12 digits", "error");
      return;
    }

    // Filter out empty class/subject entries
    const validClassesSubjects = classesSubjects.filter(
      (cs) => cs.className.trim() && cs.subjects.length > 0
    );

    const payload = {
      sessionId: selectedSessionId,
      name,
      employeeId: employeeId || `EMP-${Date.now()}`,
      role,
      monthlySalary,
      subjectOrGrade: subjectOrGrade || undefined,
      allowedLeavesPerMonth,
      perDaySalary,
      classesSubjects: validClassesSubjects.length > 0 ? validClassesSubjects : undefined,
      aadhaarNumber: aadhaarNumber || undefined,
      dateOfBirth: dateOfBirth || undefined,
    };

    if (staffModal.staff) {
      // Edit: optimistic update in hook; wait for submit for toast/close (or fire-and-forget with onError)
      setIsStaffSubmitting(true);
      updateStaff(staffModal.staff.id, {
        name: payload.name,
        employeeId: payload.employeeId || undefined,
        role: payload.role,
        monthlySalary: payload.monthlySalary,
        subjectOrGrade: payload.subjectOrGrade,
        allowedLeavesPerMonth: payload.allowedLeavesPerMonth,
        perDaySalary: payload.perDaySalary,
        classesSubjects: payload.classesSubjects,
        aadhaarNumber: payload.aadhaarNumber,
        dateOfBirth: payload.dateOfBirth,
      }, {
        onError: () => toast("Failed to update staff", "error"),
      });
      toast("Staff updated");
      setStaffModal({ open: false });
      setIsStaffSubmitting(false);
    } else {
      // Add: optimistic add, close immediately, API runs in background
      addStaff(payload);
      toast("Staff added");
      setStaffModal({ open: false });
    }
    setClassesSubjects([]);
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
    if (!salaryHistoryModal) return;
    const form = e.currentTarget;
    const month = paymentMonth;
    const daysWorked = Number((form.elements.namedItem("daysWorked") as HTMLInputElement).value) || 30;
    const leavesTaken = Number((form.elements.namedItem("leavesTaken") as HTMLInputElement).value) || 0;
    const extraAllowance = Number((form.elements.namedItem("extraAllowance") as HTMLInputElement).value) || 0;
    const allowanceNote = (form.elements.namedItem("allowanceNote") as HTMLInputElement).value.trim() || undefined;
    const extraDeduction = Number((form.elements.namedItem("extraDeduction") as HTMLInputElement).value) || 0;
    const deductionNote = (form.elements.namedItem("deductionNote") as HTMLInputElement).value.trim() || undefined;
    const paymentDate = (form.elements.namedItem("paymentDate") as HTMLInputElement).value || undefined;
    const method = (form.elements.namedItem("method") as HTMLSelectElement).value as "Cash" | "Cheque" | "Online" | "Bank Transfer" | "";
    const payAmount = Number((form.elements.namedItem("payAmount") as HTMLInputElement).value) || 0;
    const previouslyPaidAmount = Number((form.elements.namedItem("previouslyPaidAmount") as HTMLInputElement)?.value) || 0;
    const dueDate = `${month}-${String(salaryDueDay).padStart(2, "0")}`;

    // Calculate final amount based on deductions
    const staff = salaryHistoryModal;
    const perDay = staff.perDaySalary ?? staff.monthlySalary / 30;
    const allowedLeaves = staff.allowedLeavesPerMonth ?? 1;
    const excessLeaves = Math.max(0, leavesTaken - allowedLeaves);
    const leaveDeduction = excessLeaves * perDay;
    const calculatedSalary = staff.monthlySalary - leaveDeduction - extraDeduction + extraAllowance;
    
    // Calculate total paid including this payment
    const totalPaidAmount = previouslyPaidAmount + payAmount;
    
    // Determine status based on amount paid
    let status: "Paid" | "Pending" | "Partially Paid";
    if (totalPaidAmount >= calculatedSalary) {
      status = "Paid";
    } else if (totalPaidAmount > 0) {
      status = "Partially Paid";
    } else {
      status = "Pending";
    }

    try {
      await addSalaryPaymentAsync(staff.id, {
        month,
        amount: calculatedSalary,
        paidAmount: totalPaidAmount,
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
      toast(`Salary payment of ${formatCurrency(payAmount)} recorded`);
      // Cache already updated by refetchStaffAndMergeIntoCache in useAddSalaryPayment onSuccess;
      // avoid an extra staff list refetch by reading updated staff from cache.
      const updatedStaff =
        queryClient.getQueryData<StaffType>(["staff", staff.id]) ?? staff;
      setSalaryHistoryModal(updatedStaff);
      setActiveSalaryTab("history");
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
          <p className="text-slate-600 dark:text-slate-400">Manage staff and salary payments</p>
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
          {import.meta.env.DEV && (
            <Button
              size="sm"
              variant="danger"
              disabled={!selectedSessionId}
              onClick={() => setConfirmDeleteAllStaff(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete all staff (Danger)
            </Button>
          )}
        </div>
      </div>

      {list.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Annual salary obligation: <strong className="text-slate-900 dark:text-slate-100">{formatCurrency(annualTotal)}</strong>
            </p>
          </CardContent>
        </Card>
      )}

      {!selectedSessionId ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500 dark:text-slate-400">
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
                    value={roleFilter ?? ""}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-40 shrink-0"
                    aria-label="Filter by role"
                  >
                    {STAFF_ROLE_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value === "" ? "__all_roles__" : opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                  {uniqueClasses.length > 0 && (
                    <Select
                      value={classFilter}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSearchParams((prev) => {
                          const next = new URLSearchParams(prev);
                          if (v) next.set("class", v);
                          else next.delete("class");
                          return next;
                        }, { replace: true });
                      }}
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
                  value={roleFilter ?? ""}
                  onChange={(v) => setRoleFilter(v)}
                  className="flex-nowrap min-w-max"
                />
              </div>
            </div>
            {list.length === 0 ? (
              <EmptyState message="No staff in this session." />
            ) : filteredList.length === 0 ? (
              <EmptyState message="No staff match your search or filter." />
            ) : (
              <div className="relative overflow-x-auto">
                {hasFilters && isStaffListFetching && (
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-md bg-slate-100/90 dark:bg-slate-800/90 px-2 py-1 text-xs text-slate-600 dark:text-slate-300">
                    <LoadingSpinner size="sm" />
                    <span>Updating…</span>
                  </div>
                )}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-600 dark:text-slate-300">
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
                      const lastPaid = getLastPaidInfo(s.salaryPayments, salaryDueDay, s.monthlySalary);
                      const monthStatus = getMonthSalaryStatus(s.salaryPayments, currentMonth, s.monthlySalary);

                      return (
                        <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700">
                          <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">{s.name}</td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{s.employeeId}</td>
                          <td className="py-3 pr-4">
                            <Badge variant={getRoleBadgeVariant(s.role)}>
                              {s.role}
                              {s.subjectOrGrade && ` (${s.subjectOrGrade})`}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{formatCurrency(s.monthlySalary)}</td>
                          <td className="py-3 pr-4">
                            {lastPaid.date ? (
                              <div className="flex flex-col">
                                <span className="text-slate-900 dark:text-slate-100">
                                  {formatDate(lastPaid.date)}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
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
                              <span className="text-slate-400 dark:text-slate-500">Never</span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            {monthStatus.paymentCount > 0 ? (
                              <span className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                monthStatus.status === "Paid" ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200" :
                                  monthStatus.status === "Partially Paid" ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200" :
                                    "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200"
                              )}>
                                {monthStatus.status === "Paid" && <CheckCircle className="h-3 w-3" />}
                                {monthStatus.status === "Pending" && <XCircle className="h-3 w-3" />}
                                {monthStatus.status === "Partially Paid" && <AlertCircle className="h-3 w-3" />}
                                {monthStatus.status === "Paid"
                                  ? (monthStatus.paymentCount > 1 ? `Paid (${monthStatus.paymentCount})` : "Paid")
                                  : monthStatus.status}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                                <XCircle className="h-3 w-3" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1 items-center">
                              <PermissionGate anyPermission={["salary:manage", "salary:record"]}>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSalaryHistoryModal(s);
                                    setActiveSalaryTab("history");
                                    setPaymentMonth(sessionMonths?.[0] ?? getCurrentMonth());
                                  }}
                                  title="View salary history & pay"
                                >
                                  <Calendar className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                              <div className="relative">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (actionMenuOpen === s.id) {
                                      setActionMenuOpen(null);
                                      setActionMenuStaff(null);
                                      setActionMenuPosition(null);
                                    } else {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setActionMenuPosition({ top: rect.bottom + 4, left: rect.right - 144 });
                                      setActionMenuOpen(s.id);
                                      setActionMenuStaff(s);
                                    }
                                  }}
                                  title="More actions"
                                >
                                  <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                </Button>
                              </div>
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

      {actionMenuStaff && actionMenuPosition &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-9998"
              onClick={() => {
                setActionMenuOpen(null);
                setActionMenuStaff(null);
                setActionMenuPosition(null);
              }}
              aria-hidden
            />
            <div
              className="fixed z-9999 w-36 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1"
              style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
              role="menu"
            >
              <PermissionGate permission="staff:edit">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                  onClick={() => {
                    setStaffModal({ open: true, staff: actionMenuStaff });
                    setActionMenuOpen(null);
                    setActionMenuStaff(null);
                    setActionMenuPosition(null);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              </PermissionGate>
              <PermissionGate permission="staff:delete">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                  onClick={() => {
                    setConfirmDelete({ id: actionMenuStaff.id, name: actionMenuStaff.name });
                    setActionMenuOpen(null);
                    setActionMenuStaff(null);
                    setActionMenuPosition(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </PermissionGate>
            </div>
          </>,
          document.body
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

          {/* Personal Details (Optional) */}
          <div className="border-t border-slate-200 pt-4 mt-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Personal Details (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Aadhaar Number" helperText="12-digit Aadhaar">
                <Input
                  name="aadhaarNumber"
                  type="text"
                  maxLength={12}
                  pattern="[0-9]{12}"
                  defaultValue={staffModal.staff?.aadhaarNumber ?? ""}
                  placeholder="123456789012"
                />
              </FormField>
              <FormField label="Date of Birth">
                <Input
                  name="dateOfBirth"
                  type="date"
                  defaultValue={staffModal.staff?.dateOfBirth ?? ""}
                />
              </FormField>
            </div>
          </div>

          {/* Leave & Salary Configuration */}
          <div className="border-t border-slate-200 pt-4 mt-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Leave & Salary Configuration</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Allowed Leaves/Month" helperText="Leaves without salary deduction">
                <Input
                  name="allowedLeavesPerMonth"
                  type="number"
                  min={0}
                  max={30}
                  defaultValue={staffModal.staff?.allowedLeavesPerMonth ?? 1}
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
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Classes & Subjects</h4>
              <Button type="button" variant="secondary" size="sm" onClick={addClassSubject}>
                <Plus className="h-3 w-3 mr-1" />
                Add Class
              </Button>
            </div>
            {classesSubjects.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No classes assigned. Click "Add Class" to assign classes and subjects.</p>
            ) : (
              <div className="space-y-3">
                {classesSubjects.map((cs, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
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
            <Button type="button" variant="secondary" onClick={() => setStaffModal({ open: false })} disabled={isStaffSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedSessionId || isStaffSubmitting} loading={isStaffSubmitting} loadingText="Saving...">
              Save
            </Button>
          </div>
        </form>
      </Modal>

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

      {import.meta.env.DEV && (
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
      )}

      <BulkImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        type="staff"
        sessionId={selectedSessionId}
        onImportStudents={() => { }}
        onImportStaff={async (rows) => {
          if (!selectedSessionId) return;
          const baseId = `EMP-${Date.now()}`;
          const staffToCreate = rows.map((r, idx) => {
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

            // DB has UNIQUE(session_id, employee_id): ensure unique employeeId per row when CSV omits it
            const rawId = (r.employeeId ?? "").trim();
            const employeeId = rawId ? rawId : (rows.length > 1 ? `${baseId}-${idx + 1}` : baseId);

            return {
              sessionId: selectedSessionId,
              name: r.name,
              employeeId,
              role: r.role,
              monthlySalary: r.monthlySalary,
              subjectOrGrade: r.subjectOrGrade,
              allowedLeavesPerMonth: r.allowedLeavesPerMonth ?? 1,
              perDaySalary: r.perDaySalary,
              classesSubjects,
              aadhaarNumber: r.aadhaarNumber,
              dateOfBirth: r.dateOfBirth,
            };
          });
          await createStaffBulk.mutateAsync(staffToCreate);
          toast(`${rows.length} staff member(s) imported`);
          setImportModalOpen(false);
        }}
      />

      {/* Salary modal: Salary History + Record Payment in two tabs */}
      {salaryHistoryModal && (() => {
        const historyStaff = staff.find((s: StaffType) => s.id === salaryHistoryModal.id) ?? salaryHistoryModal;
        const monthsToShow = getSalaryHistoryMonths(
          sessionMonths,
          historyStaff.salaryPayments.map((p: SalaryPayment) => p.month)
        );
        const salaryTabs = [
          { id: "history" as const, label: "Salary History" },
          { id: "payment" as const, label: "Record Payment" },
        ];
        return (
          <Modal
            open={!!salaryHistoryModal}
            onClose={() => {
              setSalaryHistoryModal(null);
              setActiveSalaryTab("history");
            }}
            title={`Salary – ${historyStaff.name}`}
          >
            <div className="space-y-4">
              {/* Tab navigation */}
              <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
                {salaryTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSalaryTab(tab.id)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                      activeSalaryTab === tab.id
                        ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                        : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeSalaryTab === "history" && (
                <>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Monthly Salary: <strong className="text-slate-900 dark:text-slate-100">{formatCurrency(historyStaff.monthlySalary)}</strong>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Allowed Leaves: {historyStaff.allowedLeavesPerMonth ?? 1}/month
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900">
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-600 dark:text-slate-300">
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
                      const monthStatus = getMonthSalaryStatus(historyStaff.salaryPayments, month, historyStaff.monthlySalary);
                      const totalAmount = monthStatus.totalPaid;
                      const firstPayment = paymentsForMonth[0];
                      const lateDays = firstPayment ? calculateLateDays(firstPayment, salaryDueDay) : 0;
                      const statusLabel = monthStatus.paymentCount > 1
                        ? monthStatus.status + ` (${monthStatus.paymentCount} payments)`
                        : monthStatus.status;

                      return (
                        <tr key={month} className="border-b border-slate-100 group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 pr-4 font-medium text-slate-900 dark:text-slate-100">{formatMonthYear(month)}</td>
                          <td className="py-2 pr-4">
                            {firstPayment ? (
                              <div className="flex flex-col gap-1">
                                <span className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium w-fit",
                                  monthStatus.status === "Paid" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                                    monthStatus.status === "Partially Paid" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
                                      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                )}>
                                  {monthStatus.status === "Paid" && <CheckCircle className="h-3 w-3" />}
                                  {monthStatus.status === "Pending" && <XCircle className="h-3 w-3" />}
                                  {monthStatus.status === "Partially Paid" && <AlertCircle className="h-3 w-3" />}
                                  {statusLabel}
                                </span>
                                {monthStatus.status === "Paid" && lateDays > 0 && (
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
                                {monthStatus.expectedAmount > 0 && monthStatus.expectedAmount !== totalAmount && (
                                  <span className="text-xs text-slate-500">
                                    Expected: {formatCurrency(monthStatus.expectedAmount)}
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
                              {(() => {
                                const canPay = monthStatus.status !== "Paid";
                                if (canPay) {
                                  return (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setPaymentMonth(month);
                                        setActiveSalaryTab("payment");
                                      }}
                                      title={monthStatus.status === "Partially Paid" ? "Continue paying remaining amount" : "Pay salary for this month"}
                                    >
                                      <Banknote className="h-4 w-4 mr-1" />
                                      {monthStatus.status === "Partially Paid" ? "Pay Rest" : "Pay"}
                                    </Button>
                                  );
                                }
                                return <span className="text-xs text-slate-400" title="Already paid for this month">—</span>;
                              })()}
                            </PermissionGate>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Total Paid (this session):{" "}
                        <strong className="text-slate-900 dark:text-slate-100">
                          {formatCurrency(
                            sessionMonths.reduce(
                              (sum: number, m: string) => sum + getTotalPaidForMonth(historyStaff.salaryPayments, m),
                              0
                            )
                          )}
                        </strong>
                      </p>
                    </div>
                    <Button type="button" onClick={() => setSalaryHistoryModal(null)}>Close</Button>
                  </div>
                </>
              )}

              {activeSalaryTab === "payment" && (
                <div className="space-y-4">
                  <FormField label="Month">
                    <Select
                      value={paymentMonth}
                      onChange={(e) => setPaymentMonth(e.target.value)}
                    >
                      {sessionMonths.map((m) => (
                        <option key={m} value={m}>{formatMonthYear(m)}</option>
                      ))}
                    </Select>
                  </FormField>
                  <SalaryPaymentForm
                    key={paymentMonth}
                    staff={historyStaff}
                    month={paymentMonth}
                    salaryDueDay={salaryDueDay}
                    onCancel={() => setActiveSalaryTab("history")}
                    onSubmit={handleSaveSalary}
                  />
                </div>
              )}
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
