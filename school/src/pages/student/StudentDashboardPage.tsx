import { useAuth } from '../../context/AuthContext';
import { useStudent } from '../../hooks/useStudents';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { formatCurrency, formatDate } from '../../lib/utils';
import { SkeletonDashboard } from '../../components/ui/Skeleton';
import { GraduationCap, CreditCard, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function StudentDashboardPage() {
  const { user } = useAuth();
  const { data: student, isLoading, error } = useStudent(user?.studentId || '');

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  if (error || !student) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center text-red-600">
        <AlertCircle className="mx-auto mb-2 h-8 w-8" />
        <p>Unable to load your student information.</p>
        <p className="text-sm">Please contact the school administrator.</p>
      </div>
    );
  }

  // Calculate fee summary
  const totalFees = (student.registrationFees || 0) + 
                    (student.admissionFees || 0) + 
                    (student.annualFund || 0) +
                    ((student.monthlyFees || 0) * 12) +
                    ((student.transportFees || 0) * 12);
  
  const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalFees - totalPaid;
  const paidPercentage = totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0;

  // Get recent payments
  const recentPayments = [...student.payments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Calculate upcoming dues
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyPayments = student.payments.filter(p => p.feeCategory === 'monthly');
  const paidMonths = new Set(monthlyPayments.map(p => p.month));
  const isCurrentMonthPaid = paidMonths.has(currentMonth);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
          <GraduationCap className="h-8 w-8 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {student.name}</h1>
          <p className="text-slate-600">Student ID: {student.studentId}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Fees</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalFees)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-300" />
            </div>
            <div className="mt-2">
              <div className="h-2 w-full rounded-full bg-slate-200">
                <div 
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${paidPercentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">{paidPercentage}% paid</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Balance Due</p>
                <p className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
              {balance > 0 ? (
                <Clock className="h-8 w-8 text-red-300" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-300" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fee Structure */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-600">Registration Fees</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(student.registrationFees || 0)}</span>
                  {student.registrationPaid && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-600">Admission Fees</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(student.admissionFees || 0)}</span>
                  {student.admissionPaid && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-600">Annual Fund</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(student.annualFund || 0)}</span>
                  {student.annualFundPaid && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-600">Monthly Fees</span>
                <span className="font-medium">{formatCurrency(student.monthlyFees || 0)}/month</span>
              </div>
              {student.transportFees && student.transportFees > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Transport Fees</span>
                  <span className="font-medium">{formatCurrency(student.transportFees)}/month</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Month Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">{currentMonth}</span>
                {isCurrentMonthPaid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                    <Clock className="h-4 w-4" />
                    Pending
                  </span>
                )}
              </div>
              {!isCurrentMonthPaid && (
                <p className="mt-2 text-sm text-slate-500">
                  Due by {student.dueDayOfMonth || 10}th of this month
                </p>
              )}
            </div>

            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium text-slate-700">Recent Payments</h4>
              {recentPayments.length > 0 ? (
                <div className="space-y-2">
                  {recentPayments.map((payment) => (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(payment.date)} · {payment.method}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {payment.feeCategory}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No payments recorded yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
