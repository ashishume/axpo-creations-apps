import { useMemo, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useStudentsBySession } from "../hooks/useStudents";
import { useStaffBySession } from "../hooks/useStaff";
import { useExpensesBySession } from "../hooks/useExpenses";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { formatCurrency } from "../lib/utils";
import { getTotalPaid, getPaymentStatus } from "../lib/studentUtils";
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
    const incomeCollected = sessionStudents.reduce((s, st) => s + getTotalPaid(st), 0);
    const incomeTarget = sessionStudents.reduce((s, st) => s + (st.targetAmount ?? 0), 0);
    const totalExpenses = sessionExpenses.reduce((s, e) => s + e.amount, 0);
    const byCategory: Record<string, number> = {};
    sessionExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    });
    const staffSalary = sessionStaff.reduce((s, st) => s + st.monthlySalary * 12, 0);
    const otherExpenses = totalExpenses; // in our data we don't separate salary payments from expenses; salary obligation is separate
    const net = incomeCollected - totalExpenses;
    const fullyPaid = sessionStudents.filter((st) => getPaymentStatus(st) === "Fully Paid").length;
    const completionRate = sessionStudents.length > 0 ? (fullyPaid / sessionStudents.length) * 100 : 0;
    return {
      incomeCollected,
      incomeTarget,
      totalExpenses,
      byCategory,
      staffSalary,
      otherExpenses,
      net,
      completionRate,
      studentCount: sessionStudents.length,
      fullyPaid,
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
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 print:border print:shadow-none">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {school?.name} – {session?.year}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {session?.startDate} to {session?.endDate}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Income</h4>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(report.incomeCollected)}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Target: {formatCurrency(report.incomeTarget)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Total expenses</h4>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(report.totalExpenses)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">Expenses by category</h4>
          <ul className="mt-2 space-y-1 text-sm">
            {Object.entries(report.byCategory).map(([cat, amt]) => (
              <li key={cat} className="flex justify-between text-slate-900 dark:text-slate-100">
                <span className="text-slate-600 dark:text-slate-300">{cat}</span>
                <span className="font-medium">{formatCurrency(amt)}</span>
              </li>
            ))}
            {Object.keys(report.byCategory).length === 0 && (
              <li className="text-slate-500 dark:text-slate-400">No expenses</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">Staff salary (annual obligation)</h4>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(report.staffSalary)}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{sessionStaff.length} staff</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">Net result</h4>
          <p
            className={`mt-1 text-2xl font-bold ${report.net >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            {formatCurrency(report.net)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">Student payment completion</h4>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
            {report.fullyPaid} / {report.studentCount} ({report.completionRate.toFixed(1)}%)
          </p>
        </div>
      </div>

    </div>
  );
}
