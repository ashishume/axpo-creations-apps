import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudent } from '../../hooks/useStudents';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { formatCurrency, formatMonthYear } from '../../lib/utils';
import { Skeleton, SkeletonTable } from '../../components/ui/Skeleton';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { SessionStudent, FeePayment } from '../../types';

export function StudentFeesPage() {
  const { user } = useAuth();
  const { data: rawStudent, isLoading, error } = useStudent(user?.studentId || '');

  // Generate last 12 months
  const months = useMemo(() => {
    const result: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    return result;
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <SkeletonTable rows={4} columns={3} />
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <SkeletonTable rows={12} columns={4} />
        </div>
      </div>
    );
  }

  if (error || !rawStudent) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-6 text-center text-red-600 dark:text-red-400">
        <AlertCircle className="mx-auto mb-2 h-8 w-8" />
        <p>Unable to load your fee information.</p>
      </div>
    );
  }

  const student = rawStudent as unknown as SessionStudent;
  const payments: FeePayment[] = student.payments ?? [];

  const paymentsByMonth = new Map<string, FeePayment[]>();
  payments.forEach((p: FeePayment) => {
    const month = p.month || p.date.slice(0, 7);
    if (!paymentsByMonth.has(month)) {
      paymentsByMonth.set(month, []);
    }
    paymentsByMonth.get(month)!.push(p);
  });

  const oneTimeFees = [
    { 
      name: 'Registration/Admission fees', 
      amount: student.registrationFees || 0, 
      paid: student.registrationPaid,
      category: 'registration'
    },
    { 
      name: 'Annual Fund', 
      amount: student.annualFund || 0, 
      paid: student.annualFundPaid,
      category: 'annualFund'
    },
  ];

  const monthlyFee = student.monthlyFees || 0;
  const transportFee = student.transportFees || 0;
  const totalMonthly = monthlyFee + transportFee;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Fee Details</h1>
        <p className="text-slate-600 dark:text-slate-400">View your complete fee structure and payment status</p>
      </div>

      {/* One-time Fees */}
      <Card>
        <CardHeader>
          <CardTitle>One-time Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-600 dark:text-slate-300">
                  <th className="pb-2 pr-4 font-medium">Fee Type</th>
                  <th className="pb-2 pr-4 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {oneTimeFees.map((fee) => (
                  <tr key={fee.category} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">{fee.name}</td>
                    <td className="py-3 pr-4 text-right">{formatCurrency(fee.amount)}</td>
                    <td className="py-3 text-center">
                      {fee.paid ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/50 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                          <CheckCircle className="h-3 w-3" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-800">
                  <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100">Total</td>
                  <td className="py-3 pr-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(oneTimeFees.reduce((sum, f) => sum + f.amount, 0))}
                  </td>
                  <td className="py-3 text-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {oneTimeFees.filter(f => f.paid).length}/{oneTimeFees.length} paid
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Fees */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tuition Fee</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(monthlyFee)}</p>
              </div>
              {transportFee > 0 && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Transport Fee</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(transportFee)}</p>
                </div>
              )}
              <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Monthly</p>
                <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">{formatCurrency(totalMonthly)}</p>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Due Date</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{(student.dueDayOfMonth) || 10}th of each month</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-600 dark:text-slate-300">
                  <th className="pb-2 pr-4 font-medium">Month</th>
                  <th className="pb-2 pr-4 font-medium text-right">Due</th>
                  <th className="pb-2 pr-4 font-medium text-right">Paid</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {months.map((month) => {
                  const monthPayments = payments.filter(
                    (p: FeePayment) => (p.month === month || p.date.startsWith(month)) && 
                         (p.feeCategory === 'monthly' || p.feeCategory === 'transport')
                  );
                  const paidAmount = monthPayments.reduce((sum: number, p: FeePayment) => sum + p.amount, 0);
                  const isPaid = paidAmount >= totalMonthly;
                  const isPartial = paidAmount > 0 && paidAmount < totalMonthly;

                  return (
                    <tr key={month} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">{formatMonthYear(month)}</td>
                      <td className="py-3 pr-4 text-right">{formatCurrency(totalMonthly)}</td>
                      <td className="py-3 pr-4 text-right">{formatCurrency(paidAmount)}</td>
                      <td className="py-3 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/50 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                            <CheckCircle className="h-3 w-3" />
                            Paid
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
                            <AlertCircle className="h-3 w-3" />
                            Partial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/50 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-200">
                            <Clock className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Late Fee Info */}
      {(student.lateFeeAmount ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Late Fee Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/30 p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Late Fee:</strong> {formatCurrency(student.lateFeeAmount ?? 0)} applied{' '}
                {(student.lateFeeFrequency) === 'daily' ? 'per day' : 'per week'} after the due date.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
