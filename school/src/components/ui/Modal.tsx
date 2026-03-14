import { useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../lib/utils";

const activeModals = new Set<string>();

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const modalId = useId();
  const isRegistered = useRef(false);

  useEffect(() => {
    if (open) {
      activeModals.add(modalId);
      isRegistered.current = true;
    } else {
      if (isRegistered.current) {
        activeModals.delete(modalId);
        isRegistered.current = false;
      }
    }

    return () => {
      activeModals.delete(modalId);
      isRegistered.current = false;
    };
  }, [open, modalId, onClose]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handle);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handle);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/70"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-5xl max-h-[99vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1"
          >
            <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
