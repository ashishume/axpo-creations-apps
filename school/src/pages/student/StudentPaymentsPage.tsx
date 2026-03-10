import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudent } from '../../hooks/useStudents';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Pagination, usePagination } from '../../components/ui/Pagination';
import { formatCurrency, formatDate, formatMonthYear } from '../../lib/utils';
import { Skeleton, SkeletonStats, SkeletonTable } from '../../components/ui/Skeleton';
import { Download, Receipt, CreditCard, AlertCircle, Filter } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  registration: 'Registration',
  admission: 'Admission',
  annualFund: 'Annual Fund',
  monthly: 'Monthly Fee',
  transport: 'Transport',
  other: 'Other',
};

export function StudentPaymentsPage() {
  const { user } = useAuth();
  const { data: student, isLoading, error } = useStudent(user?.studentId || '');
  const { page, pageSize, setPage, setPageSize } = usePagination(10);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const filteredPayments = useMemo(() => {
    if (!student) return [];
    
    let payments = [...student.payments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    if (categoryFilter) {
      payments = payments.filter(p => p.feeCategory === categoryFilter);
    }
    
    return payments;
  }, [student, categoryFilter]);

  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, page, pageSize]);

  const totalPages = Math.ceil(filteredPayments.length / pageSize);

  // Calculate totals
  const totalPaid = useMemo(() => {
    if (!student) return 0;
    return student.payments.reduce((sum, p) => sum + p.amount, 0);
  }, [student]);

  const paymentsByCategory = useMemo(() => {
    if (!student) return {};
    const result: Record<string, number> = {};
    student.payments.forEach(p => {
      if (!result[p.feeCategory]) result[p.feeCategory] = 0;
      result[p.feeCategory] += p.amount;
    });
    return result;
  }, [student]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <SkeletonStats count={4} />
        <SkeletonTable rows={8} columns={7} />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center text-red-600">
        <AlertCircle className="mx-auto mb-2 h-8 w-8" />
        <p>Unable to load your payment history.</p>
      </div>
    );
  }

  const handleDownloadReceipt = (paymentId: string) => {
    // In a real app, this would generate/download a PDF receipt
    const payment = student.payments.find(p => p.id === paymentId);
    if (!payment) return;
    
    const receiptContent = `
PAYMENT RECEIPT
===============
Receipt No: ${payment.receiptNumber || paymentId}
Date: ${formatDate(payment.date)}

Student: ${student.name}
Student ID: ${student.studentId}

Payment Details:
Category: ${CATEGORY_LABELS[payment.feeCategory] || payment.feeCategory}
Amount: ${formatCurrency(payment.amount)}
Method: ${payment.method}
${payment.month ? `Month: ${formatMonthYear(payment.month)}` : ''}

Thank you for your payment!
    `.trim();
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${payment.receiptNumber || paymentId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Payment History</h1>
        <p className="text-slate-600">View all your fee payments and download receipts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Payments</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{student.payments.length}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <p className="mb-2 text-sm text-slate-500">By Category</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(paymentsByCategory).map(([category, amount]) => (
                <span 
                  key={category}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm"
                >
                  {CATEGORY_LABELS[category] || category}: {formatCurrency(amount)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>All Payments</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="registration">Registration</option>
                <option value="admission">Admission</option>
                <option value="annualFund">Annual Fund</option>
                <option value="monthly">Monthly Fee</option>
                <option value="transport">Transport</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Receipt className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p>No payments found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="pb-2 pr-4 font-medium">Date</th>
                      <th className="pb-2 pr-4 font-medium">Receipt No.</th>
                      <th className="pb-2 pr-4 font-medium">Category</th>
                      <th className="pb-2 pr-4 font-medium">Month</th>
                      <th className="pb-2 pr-4 font-medium text-right">Amount</th>
                      <th className="pb-2 pr-4 font-medium">Method</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4 text-slate-900">
                          {formatDate(payment.date)}
                        </td>
                        <td className="py-3 pr-4 text-slate-600">
                          {payment.receiptNumber || '—'}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                            {CATEGORY_LABELS[payment.feeCategory] || payment.feeCategory}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-600">
                          {payment.month ? formatMonthYear(payment.month) : '—'}
                        </td>
                        <td className="py-3 pr-4 text-right font-medium text-green-600">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3 pr-4 text-slate-600">
                          {payment.method}
                        </td>
                        <td className="py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReceipt(payment.id)}
                            title="Download receipt"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={filteredPayments.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
