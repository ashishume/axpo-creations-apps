import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useStaffBySessionInfinite, useCreateStaff, useCreateStaffBulk, useUpdateStaff, useDeleteStaff, useAddSalaryPayment } from "../hooks/useStaff";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Skeleton, SkeletonTable } from "../components/ui/Skeleton";
import { Plus, Pencil, Trash2, Upload, Calendar, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { BulkImportModal } from "../components/import/BulkImportModal";
import type { Staff as StaffType, StaffRole, SalaryPayment } from "../types";
import { formatCurrency, formatDate, formatMonthYear, cn } from "../lib/utils";
import { SearchInput } from "../components/ui/SearchInput";
import { FilterChips } from "../components/ui/FilterChips";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { FormField } from "../components/ui/FormField";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";

const roleBadgeVariant: Record<StaffType["role"], "info" | "neutral" | "warning"> = {
  Teacher: "info",
  Administrative: "info",
  "Bus Driver": "warning",
  "Support Staff": "neutral",
};

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

// Generate last 12 months (current + 11 past)
function getLast12Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

// Build months to show in salary history: last 12 months + any month that has a payment (e.g. future advance)
// Sorted newest first so future/current appear at top
function getSalaryHistoryMonths(last12: string[], paymentMonths: string[]): string[] {
  const set = new Set<string>([...last12, ...paymentMonths]);
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

// Generate current month + next 6 months for salary payment
function getPayableMonths(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i <= 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
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

  const addStaff = (data: Omit<StaffType, "id" | "salaryPayments">) => createStaff.mutate(data);
  const updateStaff = (id: string, data: Partial<Omit<StaffType, "id" | "salaryPayments">>) => updateStaffMut.mutate({ id, updates: data });
  const deleteStaff = (id: string) => deleteStaffMut.mutate(id);
  const addSalaryPayment = (staffId: string, payment: Omit<SalaryPayment, "id">) => addSalaryMut.mutate({ staffId, payment });

  const selectedSession = useMemo(
    () => (selectedSessionId ? sessions.find((s) => s.id === selectedSessionId) : null),
    [sessions, selectedSessionId]
  );
  const salaryDueDay = selectedSession?.salaryDueDay ?? 5;

  const [staffModal, setStaffModal] = useState<{ open: boolean; staff?: StaffType }>({ open: false });
  const [salaryModal, setSalaryModal] = useState<StaffType | null>(null);
  const [salaryHistoryModal, setSalaryHistoryModal] = useState<StaffType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  
  const hasFilters = !!(roleFilter || searchQuery.trim());
  const {
    staffList,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isAppLoading,
  } = useStaffBySessionInfinite(selectedSessionId ?? "", { hasFilters });

  const staff = staffList;

  const last12Months = useMemo(() => getLast12Months(), []);
  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const payableMonths = useMemo(() => getPayableMonths(), []);

  const list = staffList;

  const filteredList = useMemo(() => {
    let out = list;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.employeeId && s.employeeId.toLowerCase().includes(q))
      );
    }
    if (roleFilter) {
      out = out.filter((s) => s.role === roleFilter);
    }
    return out;
  }, [list, searchQuery, roleFilter]);

  const handleSaveStaff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const employeeId = (form.elements.namedItem("employeeId") as HTMLInputElement).value.trim();
    const role = (form.elements.namedItem("role") as HTMLSelectElement).value as StaffRole;
    const monthlySalary = Number((form.elements.namedItem("monthlySalary") as HTMLInputElement).value);
    const subjectOrGrade = (form.elements.namedItem("subjectOrGrade") as HTMLInputElement).value.trim();
    if (!selectedSessionId || !name || monthlySalary <= 0) return;
    if (staffModal.staff) {
      updateStaff(staffModal.staff.id, {
        name,
        employeeId: employeeId || undefined,
        role,
        monthlySalary,
        subjectOrGrade: subjectOrGrade || undefined,
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
      });
      toast("Staff added");
    }
    setStaffModal({ open: false });
  };

  const handleSaveSalary = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!salaryModal) return;
    const form = e.currentTarget;
    const month = (form.elements.namedItem("month") as HTMLSelectElement | HTMLInputElement).value;
    const status = (form.elements.namedItem("status") as HTMLSelectElement).value as "Paid" | "Pending" | "Partially Paid";
    const amount = Number((form.elements.namedItem("amount") as HTMLInputElement).value);
    const paymentDate = (form.elements.namedItem("paymentDate") as HTMLInputElement).value || undefined;
    const method = (form.elements.namedItem("method") as HTMLSelectElement).value as "Cash" | "Cheque" | "Online" | "Bank Transfer" | "";
    const dueDate = `${month}-${String(salaryDueDay).padStart(2, "0")}`;
    // Always add a new payment (allow multiple payments per month, e.g. bonus or second installment)
    addSalaryPayment(salaryModal.id, {
      month,
      amount,
      status,
      paymentDate: paymentDate || undefined,
      method: method || undefined,
      dueDate,
    });
    toast("Salary payment recorded");
    setSalaryModal(null);
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
      ) : isAppLoading ? (
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
            <CardTitle>Staff ({filteredList.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name or ID..."
                className="max-w-xs"
              />
              <FilterChips
                options={[
                  { value: "", label: "All" },
                  { value: "Teacher", label: "Teacher" },
                  { value: "Administrative", label: "Administrative" },
                  { value: "Bus Driver", label: "Bus Driver" },
                  { value: "Support Staff", label: "Support Staff" },
                ]}
                value={roleFilter}
                onChange={setRoleFilter}
              />
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
                            <Badge variant={roleBadgeVariant[s.role]}>
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSalaryModal(s)}
                                title="Record salary payment"
                              >
                                Pay
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSalaryHistoryModal(s)}
                                title="View salary history"
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setStaffModal({ open: true, staff: s })}
                                title="Edit staff details"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => setConfirmDelete({ id: s.id, name: s.name })}
                                title="Delete staff member"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <FormField label="Name *" required>
            <Input name="name" type="text" required defaultValue={staffModal.staff?.name} />
          </FormField>
          <FormField label="Employee ID">
            <Input name="employeeId" type="text" defaultValue={staffModal.staff?.employeeId} />
          </FormField>
          <FormField label="Role">
            <Select name="role" defaultValue={staffModal.staff?.role ?? "Teacher"}>
              <option value="Teacher">Teacher</option>
              <option value="Administrative">Administrative</option>
              <option value="Bus Driver">Bus Driver</option>
              <option value="Support Staff">Support Staff</option>
            </Select>
          </FormField>
          <FormField label="Subject / Grade (for teachers)">
            <Input name="subjectOrGrade" type="text" defaultValue={staffModal.staff?.subjectOrGrade} />
          </FormField>
          <FormField label="Monthly salary (₹) *" required>
            <Input
              name="monthlySalary"
              type="number"
              required
              min={1}
              defaultValue={staffModal.staff?.monthlySalary}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setStaffModal({ open: false })}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedSessionId}>Save</Button>
          </div>
        </form>
      </Modal>

      {salaryModal && (
        <Modal
          open={!!salaryModal}
          onClose={() => setSalaryModal(null)}
          title={`Salary Payment – ${salaryModal.name}`}
        >
          <form onSubmit={handleSaveSalary} className="space-y-4">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 mb-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Monthly Salary: <strong className="text-slate-900 dark:text-slate-100">{formatCurrency(salaryModal.monthlySalary)}</strong>
              </p>
            </div>
            <FormField
              label="Select Month"
              required
              helperText="You can pay for the current month or advance salary for up to 6 future months. Multiple payments per month are allowed."
            >
              <Select name="month" required defaultValue={currentMonth}>
                {payableMonths.map((month) => {
                  const paymentsForMonth = salaryModal.salaryPayments.filter(p => p.month === month);
                  const paidCount = paymentsForMonth.filter(p => p.status === "Paid").length;
                  const monthLabel = formatMonthYear(month);
                  const currentLabel = month === currentMonth ? ` (Current)` : "";
                  const suffix = paidCount > 0 ? ` – Paid (${paidCount} payment${paidCount > 1 ? "s" : ""})` : paymentsForMonth.length ? ` – ${paymentsForMonth[0].status}` : "";
                  return (
                    <option key={month} value={month}>
                      {monthLabel}{currentLabel}{suffix}
                    </option>
                  );
                })}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select name="status" defaultValue="Paid">
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Pending</option>
              </Select>
            </FormField>
            <FormField label="Amount (₹)">
              <Input name="amount" type="number" min={0} defaultValue={salaryModal.monthlySalary} />
            </FormField>
            <FormField label="Payment date">
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setSalaryModal(null)}>
                Cancel
              </Button>
              <Button type="submit">Pay Salary</Button>
            </div>
          </form>
        </Modal>
      )}

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

      <BulkImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        type="staff"
        sessionId={selectedSessionId}
        onImportStudents={() => {}}
        onImportStaff={async (rows) => {
          if (!selectedSessionId) return;
          const staffToCreate = rows.map((r) => ({
            sessionId: selectedSessionId,
            name: r.name,
            employeeId: r.employeeId ?? "",
            role: r.role,
            monthlySalary: r.monthlySalary,
            subjectOrGrade: r.subjectOrGrade,
          }));
          await createStaffBulk.mutateAsync(staffToCreate);
          toast(`${rows.length} staff member(s) imported`);
        }}
      />

      {/* Salary History Modal - use latest staff from context so payments stay in sync */}
      {salaryHistoryModal && (() => {
        const historyStaff = staff.find((s: StaffType) => s.id === salaryHistoryModal.id) ?? salaryHistoryModal;
        const monthsToShow = getSalaryHistoryMonths(
          last12Months,
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
              <p className="text-sm text-slate-600">
                Monthly Salary: <strong>{formatCurrency(historyStaff.monthlySalary)}</strong>
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="pb-2 pr-4 font-medium">Month</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Amount</th>
                    <th className="pb-2 pr-4 font-medium">Paid On</th>
                    <th className="pb-2 font-medium">Late</th>
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
                      <tr key={month} className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-medium text-slate-900">{formatMonthYear(month)}</td>
                        <td className="py-2 pr-4">
                          {firstPayment ? (
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              anyPaid ? "bg-green-100 text-green-800" :
                              firstPayment.status === "Partially Paid" ? "bg-amber-100 text-amber-800" :
                              "bg-red-100 text-red-800"
                            )}>
                              {anyPaid && <CheckCircle className="h-3 w-3" />}
                              {!anyPaid && firstPayment.status === "Pending" && <XCircle className="h-3 w-3" />}
                              {!anyPaid && firstPayment.status === "Partially Paid" && <AlertCircle className="h-3 w-3" />}
                              {statusLabel}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          {totalAmount > 0 ? formatCurrency(totalAmount) : "—"}
                        </td>
                        <td className="py-2 pr-4">
                          {firstPayment?.paymentDate 
                            ? formatDate(firstPayment.paymentDate) 
                            : "—"}
                        </td>
                        <td className="py-2">
                          {anyPaid && lateDays > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                              <Clock className="h-3 w-3" />
                              {lateDays}d
                            </span>
                          ) : anyPaid ? (
                            <span className="text-xs text-green-600">On time</span>
                          ) : (
                            "—"
                          )}
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
                  Total Paid (Last 12 months):{" "}
                  <strong>
                    {formatCurrency(
                      historyStaff.salaryPayments
                        .filter((p: SalaryPayment) => last12Months.includes(p.month) && p.status === "Paid")
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
    </div>
  );
}
