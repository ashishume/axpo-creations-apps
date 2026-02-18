import { TrendingUp, TrendingDown, DollarSign, Package, Receipt, BarChart3 } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import { cn } from "../../lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface AnalyticsMetric {
  label: string;
  value: number;
  format: "currency" | "number" | "percentage";
  trend?: "up" | "down" | "neutral";
}

export interface AnalyticsDetail {
  name: string;
  value: number;
}

export interface AnalyticsData {
  type:
    | "salary_summary"
    | "fee_collection_summary"
    | "expenses_summary"
    | "outstanding_fees"
    | "stock_balance"
    | "dashboard_overview"
    | "unknown";
  title: string;
  metrics: AnalyticsMetric[];
  details?: AnalyticsDetail[];
}

interface AnalyticsCardProps {
  data: AnalyticsData;
}

// ============================================================================
// Helper Components
// ============================================================================

function MetricIcon({ type }: { type: AnalyticsData["type"] }) {
  const iconClass = "h-5 w-5";
  switch (type) {
    case "salary_summary":
      return <DollarSign className={cn(iconClass, "text-green-600")} />;
    case "fee_collection_summary":
      return <Receipt className={cn(iconClass, "text-blue-600")} />;
    case "expenses_summary":
      return <TrendingDown className={cn(iconClass, "text-red-600")} />;
    case "outstanding_fees":
      return <TrendingUp className={cn(iconClass, "text-amber-600")} />;
    case "stock_balance":
      return <Package className={cn(iconClass, "text-purple-600")} />;
    case "dashboard_overview":
      return <BarChart3 className={cn(iconClass, "text-indigo-600")} />;
    default:
      return <BarChart3 className={cn(iconClass, "text-slate-600")} />;
  }
}

function formatValue(value: number, format: AnalyticsMetric["format"]): string {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percentage":
      return `${value.toFixed(1)}%`;
    case "number":
    default:
      return value.toLocaleString();
  }
}

function getBackgroundClass(type: AnalyticsData["type"]): string {
  switch (type) {
    case "salary_summary":
      return "from-green-50 to-emerald-50 border-green-200";
    case "fee_collection_summary":
      return "from-blue-50 to-sky-50 border-blue-200";
    case "expenses_summary":
      return "from-red-50 to-rose-50 border-red-200";
    case "outstanding_fees":
      return "from-amber-50 to-yellow-50 border-amber-200";
    case "stock_balance":
      return "from-purple-50 to-violet-50 border-purple-200";
    case "dashboard_overview":
      return "from-indigo-50 to-blue-50 border-indigo-200";
    default:
      return "from-slate-50 to-gray-50 border-slate-200";
  }
}

// ============================================================================
// Component
// ============================================================================

export function AnalyticsCard({ data }: AnalyticsCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-xl border bg-gradient-to-br p-4 shadow-sm",
        getBackgroundClass(data.type)
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
          <MetricIcon type={data.type} />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">{data.title}</h4>
      </div>

      {/* Metrics Grid */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        {data.metrics.map((metric, idx) => (
          <div
            key={idx}
            className={cn(
              "rounded-lg bg-white/80 p-3 backdrop-blur-sm",
              idx === 0 && "col-span-2 sm:col-span-1"
            )}
          >
            <p className="mb-0.5 text-xs text-slate-500">{metric.label}</p>
            <p
              className={cn(
                "text-lg font-bold",
                metric.format === "currency" && metric.value >= 0
                  ? "text-slate-900"
                  : metric.format === "currency" && metric.value < 0
                  ? "text-red-600"
                  : "text-slate-900"
              )}
            >
              {formatValue(metric.value, metric.format)}
            </p>
            {metric.trend && (
              <div className="mt-1 flex items-center gap-1">
                {metric.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : metric.trend === "down" ? (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                ) : null}
                <span
                  className={cn(
                    "text-xs",
                    metric.trend === "up"
                      ? "text-green-600"
                      : metric.trend === "down"
                      ? "text-red-600"
                      : "text-slate-500"
                  )}
                >
                  {metric.trend === "up" ? "Increased" : metric.trend === "down" ? "Decreased" : "No change"}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Details List (if any) */}
      {data.details && data.details.length > 0 && (
        <div className="rounded-lg bg-white/60 p-3">
          <p className="mb-2 text-xs font-medium text-slate-600">Details</p>
          <div className="space-y-1.5">
            {data.details.map((detail, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{detail.name}</span>
                <span className="font-medium text-slate-900">{formatCurrency(detail.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
