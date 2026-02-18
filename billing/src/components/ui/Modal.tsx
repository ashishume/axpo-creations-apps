import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-4xl",
    full: "max-w-[90vw]",
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${sizeClasses[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors hover:bg-opacity-10"
              style={{ color: "var(--text-secondary)" }}
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
        {message}
      </p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`btn ${variant === "danger" ? "btn-danger" : "btn-primary"}`}
          disabled={loading}
        >
          {loading && <span className="spinner" />}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
