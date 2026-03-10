import { cn } from "../../lib/utils";

const baseClasses =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium";

const variants = {
  success:
    "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  info: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
  neutral:
    "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
} as const;

const sizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
} as const;

export type BadgeVariant = keyof typeof variants;
export type BadgeSize = keyof typeof sizes;

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "neutral",
  size = "sm",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(baseClasses, variants[variant], sizes[size], className)}
    >
      {children}
    </span>
  );
}
