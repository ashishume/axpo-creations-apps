import { cn } from "../../lib/utils";

const labelClasses =
  "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";
const helperClasses = "mt-1 text-xs text-slate-500 dark:text-slate-400";
const errorClasses = "mt-1 text-xs text-red-600 dark:text-red-400";

export interface FormFieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  error?: React.ReactNode;
  helperText?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  helperText,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-0", className)}>
      <label htmlFor={htmlFor} className={labelClasses}>
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
      </label>
      {children}
      {error != null && <p className={errorClasses} role="alert">{error}</p>}
      {helperText != null && error == null && (
        <p className={helperClasses}>{helperText}</p>
      )}
    </div>
  );
}
