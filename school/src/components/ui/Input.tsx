import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const inputBaseClasses =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 transition-colors";
const inputBorderClasses =
  "border-slate-300 dark:border-slate-600 dark:bg-slate-800";
const inputErrorClasses = "border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          inputBaseClasses,
          error ? inputErrorClasses : inputBorderClasses,
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
