import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const selectBaseClasses =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 transition-colors pr-8";
const selectBorderClasses =
  "border-slate-300 dark:border-slate-600 dark:bg-slate-800";
const selectErrorClasses = "border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          selectBaseClasses,
          error ? selectErrorClasses : selectBorderClasses,
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";
