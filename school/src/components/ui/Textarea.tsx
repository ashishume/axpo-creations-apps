import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const textareaBaseClasses =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 transition-colors resize-y min-h-[80px]";
const textareaBorderClasses =
  "border-slate-300 dark:border-slate-600 dark:bg-slate-800";
const textareaErrorClasses = "border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          textareaBaseClasses,
          error ? textareaErrorClasses : textareaBorderClasses,
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
