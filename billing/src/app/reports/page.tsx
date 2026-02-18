
import { Link } from "react-router-dom";
import { Card } from "@/components/ui";

const reports = [
  { href: "/reports/profit", title: "Profit & Loss", description: "Revenue, cost, expenses, net profit" },
  { href: "/reports/yearly", title: "Yearly Summary (Tax Filing)", description: "FY turnover, GST totals for GSTR-9" },
  { href: "/reports/sales", title: "Sales Report", description: "Date range, invoices, export" },
  { href: "/reports/customer-revenue", title: "Revenue by Customer", description: "Yearly/period sales per customer (from invoices)" },
  { href: "/reports/outstanding", title: "Customer Outstanding", description: "Balance due by customer" },
  { href: "/reports/stock", title: "Stock Report", description: "Current stock, low stock highlight" },
  { href: "/reports/payments", title: "Payment Report", description: "Payments received by date range" },
  { href: "/reports/ledger", title: "Customer Ledger", description: "Transactions and running balance" },
];

export function ReportsPage() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Reports
      </h1>
      <ul className="mt-4 list-none space-y-2">
        {reports.map(({ href, title, description }) => (
          <li key={href}>
            <Link to={href} className="block">
              <Card
                padding="sm"
                className="transition-all duration-200 hover:shadow-md hover:border-(--border-strong) hover:bg-(--table-row-alt) cursor-pointer"
              >
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {title}
                </span>
                <span className="ml-2" style={{ color: "var(--text-secondary)" }}>
                  – {description}
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
