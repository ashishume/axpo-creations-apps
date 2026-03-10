import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  message: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ message, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8 text-center",
        className
      )}
    >
      {Icon && (
        <Icon className="mb-2 h-10 w-10 text-slate-400 dark:text-slate-500" aria-hidden />
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {action != null && <div className="mt-3">{action}</div>}
    </div>
  );
}
