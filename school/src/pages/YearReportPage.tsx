import { useMemo, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useStudentsBySession } from "../hooks/useStudents";
import { useStaffBySession } from "../hooks/useStaff";
import { useExpensesBySession } from "../hooks/useExpenses";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { formatCurrency } from "../lib/utils";
import {
  getTotalPaid,
  getPaymentStatus,
  getPaymentsByCategory,
  getSiblingDiscount,
  getTotalAnnualFees,
} from "../lib/studentUtils";
import { FileDown } from "lucide-react";

export function YearReportPage() {
  const { sessions, schools, selectedSessionId } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: sessionStudents = [] } = useStudentsBySession(selectedSessionId ?? "");
  const { data: sessionStaff = [] } = useStaffBySession(selectedSessionId ?? "");
  const { data: sessionExpenses = [] } = useExpensesBySession(selectedSessionId ?? "");

  const session = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId),
    [sessions, selectedSessionId]
  );
  const school = useMemo(
    () => (session ? schools.find((s) => s.id === session.schoolId) : null),
    [session, schools]
  );

  const report = useMemo(() => {
    // --- Student Fee Analysis ---
    const incomeCollected = sessionStudents.reduce((s, st) => s + getTotalPaid(st), 0);
    const incomeTarget = sessionStudents.reduce((s, st) => s + getTotalAnnualFees(st), 0);

    // Fee breakdown by category
    const feeByCategory = { registration: 0, admission: 0, annualFund: 0, monthly: 0, transport: 0, other: 0 };
    sessionStudents.forEach((st) => {
      const cats = getPaymentsByCategory(st);
      feeByCategory.registration += cats.registration;
      feeByCategory.admission += cats.admission;
      feeByCategory.annualFund += cats.annualFund;
      feeByCategory.monthly += cats.monthly;
      feeByCategory.transport += cats.transport;
      feeByCategory.other += cats.other;
    });

    // Sibling discounts
    const totalSiblingDiscount = sessionStudents.reduce((s, st) => s + getSiblingDiscount(st), 0);
    const studentsWithSiblingDiscount = sessionStudents.filter((st) => st.siblingId).length;

    // Payment status breakdown
    const fullyPaid = sessionStudents.filter((st) => getPaymentStatus(st) === "Fully Paid").length;
    const partiallyPaid = sessionStudents.filter((st) => getPaymentStatus(st) === "Partially Paid").length;
    const notPaid = sessionStudents.filter((st) => getPaymentStatus(st) === "Not Paid").length;
    const completionRate = sessionStudents.length > 0 ? (fullyPaid / sessionStudents.length) * 100 : 0;

    // --- Expense Analysis ---
    const totalExpenses = sessionExpenses.reduce((s, e) => s + e.amount, 0);
    const expenseByCategory: Record<string, number> = {};
    sessionExpenses.forEach((e) => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] ?? 0) + e.amount;
    });

    // --- Staff Salary Analysis ---
    const staffSalaryObligation = sessionStaff.reduce((s, st) => s + st.monthlySalary * 12, 0);

    // Aggregate all salary payments
    const allSalaryPayments = sessionStaff.flatMap((st) => st.salaryPayments || []);
    const totalSalaryPaid = allSalaryPayments.reduce((s, p) => s + (p.calculatedSalary || p.amount || 0), 0);
    const totalLeaveDeductions = allSalaryPayments.reduce((s, p) => s + (p.leaveDeduction || 0), 0);
    const totalExtraAllowances = allSalaryPayments.reduce((s, p) => s + (p.extraAllowance || 0), 0);
    const totalExtraDeductions = allSalaryPayments.reduce((s, p) => s + (p.extraDeduction || 0), 0);
    const totalLeavesTaken = allSalaryPayments.reduce((s, p) => s + (p.leavesTaken || 0), 0);
    const totalExcessLeaves = allSalaryPayments.reduce((s, p) => s + (p.excessLeaves || 0), 0);

    // Staff by role
    const staffByRole: Record<string, number> = {};
    sessionStaff.forEach((st) => {
      staffByRole[st.role] = (staffByRole[st.role] ?? 0) + 1;
    });

    // Salary payment status
    const paidSalaryPayments = allSalaryPayments.filter((p) => p.status === "Paid").length;
    const pendingSalaryPayments = allSalaryPayments.filter((p) => p.status === "Pending").length;
    const partialSalaryPayments = allSalaryPayments.filter((p) => p.status === "Partially Paid").length;

    // --- Net Calculation ---
    const net = incomeCollected - totalExpenses - totalSalaryPaid;

    return {
      // Students
      incomeCollected,
      incomeTarget,
      feeByCategory,
      totalSiblingDiscount,
      studentsWithSiblingDiscount,
      studentCount: sessionStudents.length,
      fullyPaid,
      partiallyPaid,
      notPaid,
      completionRate,
      // Expenses
      totalExpenses,
      expenseByCategory,
      // Staff
      staffCount: sessionStaff.length,
      staffByRole,
      staffSalaryObligation,
      totalSalaryPaid,
      totalLeaveDeductions,
      totalExtraAllowances,
      totalExtraDeductions,
      totalLeavesTaken,
      totalExcessLeaves,
      paidSalaryPayments,
      pendingSalaryPayments,
      partialSalaryPayments,
      // Net
      net,
    };
  }, [sessionStudents, sessionExpenses, sessionStaff]);

  const handlePrint = () => {
    if (!printRef.current) return;
    const prevTitle = document.title;
    document.title = `Year Report - ${school?.name} - ${session?.year}`;
    window.print();
    document.title = prevTitle;
  };

  if (!selectedSessionId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Year-End Report</h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-slate-500 dark:text-slate-400">
            Select a school and session to view the report.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Year-End Report</h2>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint}>
            <FileDown className="mr-2 h-4 w-4" />
            Print / Save as PDF
          </Button>
        </div>
      </div>

      <div ref={printRef} className="year-report-print space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 print:border print:shadow-none">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {school?.name} – {session?.year}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {session?.startDate} to {session?.endDate}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3 print:grid-cols-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Fee Income</h4>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(report.incomeCollected)}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Target: {formatCurrency(report.incomeTarget)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Total Expenses</h4>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(report.totalExpenses)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Net Result</h4>
            <p
              className={`mt-1 text-2xl font-bold ${report.net >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {formatCurrency(report.net)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Income − Expenses − Salary Paid</p>
          </div>
        </div>

        {/* Student Section */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Student Fee Summary</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Fee Collection by Category</p>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Registration</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(report.feeByCategory.registration + report.feeByCategory.admission)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Annual Fund</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(report.feeByCategory.annualFund)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Monthly Fees</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(report.feeByCategory.monthly)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Transport</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(report.feeByCategory.transport)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Other</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(report.feeByCategory.other)}</span>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Payment Status</p>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-green-600 dark:text-green-400">Fully Paid</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{report.fullyPaid} students</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-yellow-600 dark:text-yellow-400">Partially Paid</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{report.partiallyPaid} students</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-red-600 dark:text-red-400">Not Paid</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{report.notPaid} students</span>
                </li>
                <li className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-1 mt-1">
                  <span className="text-slate-600 dark:text-slate-400">Total Students</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{report.studentCount}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Completion Rate</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{report.completionRate.toFixed(1)}%</span>
                </li>
              </ul>
            </div>
          </div>
          {report.studentsWithSiblingDiscount > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Sibling Discounts: {report.studentsWithSiblingDiscount} students receiving {formatCurrency(report.totalSiblingDiscount)} total discount
              </p>
            </div>
          )}
        </div>

        {/* Expenses Section */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Expenses by Category</h4>
          <ul className="space-y-1 text-sm">
            {Object.entries(report.expenseByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, amt]) => (
                <li key={cat} className="flex justify-between text-slate-900 dark:text-slate-100">
                  <span className="text-slate-600 dark:text-slate-300">{cat}</span>
                  <span className="font-medium">{formatCurrency(amt)}</span>
                </li>
              ))}
            {Object.keys(report.expenseByCategory).length === 0 && (
              <li className="text-slate-500 dark:text-slate-400">No expenses recorded</li>
            )}
          </ul>
        </div>

        {/* Staff Section */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Staff & Salary Summary</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Staff by Role</p>
              <ul className="space-y-1 text-sm">
                {Object.entries(report.staffByRole)
                  .sort(([, a], [, b]) => b - a)
                  .map(([role, count]) => (
                    <li key={role} className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">{role}</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{count}</span>
                    </li>
                  ))}
                <li className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-1 mt-1">
                  <span className="text-slate-600 dark:text-slate-400">Total Staff</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{report.staffCount}</span>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Salary Overview</p>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Annual Obligation</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(report.staffSalaryObligation)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Paid</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(report.totalSalaryPaid)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Leave Deductions</span>
                  <span className="font-medium text-red-600 dark:text-red-400">−{formatCurrency(report.totalLeaveDeductions)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Extra Allowances</span>
                  <span className="font-medium text-green-600 dark:text-green-400">+{formatCurrency(report.totalExtraAllowances)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Extra Deductions</span>
                  <span className="font-medium text-red-600 dark:text-red-400">−{formatCurrency(report.totalExtraDeductions)}</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Leave Statistics</p>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Leaves Taken</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{report.totalLeavesTaken} days</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Excess Leaves (unpaid)</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{report.totalExcessLeaves} days</span>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Payment Status</p>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-green-600 dark:text-green-400">Paid</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{report.paidSalaryPayments} payments</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-yellow-600 dark:text-yellow-400">Partially Paid</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{report.partialSalaryPayments} payments</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-red-600 dark:text-red-400">Pending</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{report.pendingSalaryPayments} payments</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
