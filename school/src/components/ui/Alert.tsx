import { cn } from "../../lib/utils";

const baseClasses = "rounded-lg p-3 text-sm";

const variants = {
  error:
    "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/50",
  warning:
    "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200 dark:border-amber-800",
  info: "bg-indigo-50 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800",
  success:
    "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-200 dark:border-green-800",
} as const;

export type AlertVariant = keyof typeof variants;

export interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

export function Alert({
  variant = "info",
  children,
  className,
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(baseClasses, variants[variant], className)}
    >
      {children}
    </div>
  );
}
