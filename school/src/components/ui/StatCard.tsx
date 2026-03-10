import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

const colorClasses = {
  green: "text-green-600 dark:text-green-400",
  red: "text-red-600 dark:text-red-400",
  amber: "text-amber-600 dark:text-amber-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  slate: "text-slate-900 dark:text-slate-50",
} as const;

export type StatCardColor = keyof typeof colorClasses;

export interface StatCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: LucideIcon;
  color?: StatCardColor;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  subtext?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "slate",
  prefix,
  suffix,
  subtext,
  className,
}: StatCardProps) {
  const valueColorClass = colorClasses[color];
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
        <p className={cn("text-2xl font-bold", valueColorClass)}>
          {prefix}
          {value}
          {suffix}
        </p>
        {subtext != null && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {subtext}
          </p>
        )}
      </div>
      {Icon != null && (
        <Icon
          className={cn("h-8 w-8 shrink-0", valueColorClass)}
          aria-hidden
        />
      )}
    </div>
  );
}
