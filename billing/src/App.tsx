import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ToastProvider } from "@/components/ui/Toast";
import { AppLayout } from "@/components/AppLayout";
import { LoginPage } from "@/app/login/page";
import { SignupPage } from "@/app/signup/page";
import { DashboardPage } from "@/app/page";
import { SetupPage } from "@/app/setup/page";
import { ProductsPage } from "@/app/products/page";
import { NewProductPage } from "@/app/products/new/page";
import { EditProductPage } from "@/app/products/[id]/edit/page";
import { CustomersPage } from "@/app/customers/page";
import { NewCustomerPage } from "@/app/customers/new/page";
import { EditCustomerPage } from "@/app/customers/[id]/edit/page";
import { InvoicesPage } from "@/app/invoices/page";
import { NewInvoicePage } from "@/app/invoices/new/page";
import { ViewInvoicePage } from "@/app/invoices/[id]/page";
import { PrintInvoicePage } from "@/app/invoices/[id]/print/page";
import { PaymentsPage } from "@/app/payments/page";
import { NewPaymentPage } from "@/app/payments/new/page";
import { PrintPaymentPage } from "@/app/payments/[id]/print/page";
import { ExpensesPage } from "@/app/expenses/page";
import { NewExpensePage } from "@/app/expenses/new/page";
import { EditExpensePage } from "@/app/expenses/[id]/edit/page";
import { StockPage } from "@/app/stock/page";
import { SubscriptionPage } from "@/app/subscription/page";
import { ReportsPage } from "@/app/reports/page";
import { ProfitReportPage } from "@/app/reports/profit/page";
import { SalesReportPage } from "@/app/reports/sales/page";
import { OutstandingReportPage } from "@/app/reports/outstanding/page";
import { YearlyReportPage } from "@/app/reports/yearly/page";
import { StockReportPage } from "@/app/reports/stock/page";
import { PaymentReportPage } from "@/app/reports/payments/page";
import { LedgerReportPage } from "@/app/reports/ledger/page";
import { CustomerRevenueReportPage } from "@/app/reports/customer-revenue/page";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/*" element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="setup" element={<SetupPage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="products/new" element={<NewProductPage />} />
                  <Route path="products/:id/edit" element={<EditProductPage />} />
                  <Route path="customers" element={<CustomersPage />} />
                  <Route path="customers/new" element={<NewCustomerPage />} />
                  <Route path="customers/:id/edit" element={<EditCustomerPage />} />
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="invoices/new" element={<NewInvoicePage />} />
                  <Route path="invoices/:id" element={<ViewInvoicePage />} />
                  <Route path="invoices/:id/print" element={<PrintInvoicePage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="payments/new" element={<NewPaymentPage />} />
                  <Route path="payments/:id/print" element={<PrintPaymentPage />} />
                  <Route path="expenses" element={<ExpensesPage />} />
                  <Route path="expenses/new" element={<NewExpensePage />} />
                  <Route path="expenses/:id/edit" element={<EditExpensePage />} />
                  <Route path="stock" element={<StockPage />} />
                  <Route path="subscription" element={<SubscriptionPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="reports/profit" element={<ProfitReportPage />} />
                  <Route path="reports/sales" element={<SalesReportPage />} />
                  <Route path="reports/outstanding" element={<OutstandingReportPage />} />
                  <Route path="reports/yearly" element={<YearlyReportPage />} />
                  <Route path="reports/stock" element={<StockReportPage />} />
                  <Route path="reports/payments" element={<PaymentReportPage />} />
                  <Route path="reports/ledger" element={<LedgerReportPage />} />
                  <Route path="reports/customer-revenue" element={<CustomerRevenueReportPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Route>
            </Routes>
          </ToastProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
