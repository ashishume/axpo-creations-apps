import { useRef } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Printer } from "lucide-react";
import { formatCurrency, formatDate } from "../../lib/utils";

interface PaymentReceiptModalProps {
  open: boolean;
  onClose: () => void;
  schoolName: string;
  sessionYear: string;
  studentName: string;
  studentId: string;
  payment: {
    date: string;
    amount: number;
    method: string;
    receiptNumber: string;
  };
  remainingAfter: number;
}

export function PaymentReceiptModal({
  open,
  onClose,
  schoolName,
  sessionYear,
  studentName,
  studentId,
  payment,
  remainingAfter,
}: PaymentReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Payment Receipt</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 24px; max-width: 400px; margin: 0 auto; }
          .receipt { border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; }
          h1 { font-size: 18px; margin: 0 0 8px; color: #1e293b; }
          .meta { font-size: 12px; color: #64748b; margin-bottom: 16px; }
          .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
          .label { color: #64748b; }
          .amount { font-size: 20px; font-weight: 700; margin: 16px 0; color: #0f172a; }
          .thanks { margin-top: 24px; font-size: 12px; color: #64748b; text-align: center; }
        </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  };

  return (
    <Modal open={open} onClose={onClose} title="Payment receipt">
      <div className="space-y-4">
        <div
          ref={printRef}
          className="rounded-lg border border-slate-200 bg-slate-50 p-6 print:border-0 print:bg-white dark:bg-slate-900"
        >
          <h1 className="text-lg font-bold text-slate-900">Payment Receipt</h1>
          <p className="text-xs text-slate-500">{schoolName} · Session {sessionYear}</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Student</span>
              <span className="font-medium text-slate-900">{studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Student ID</span>
              <span className="text-slate-700">{studentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="text-slate-700">{formatDate(payment.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="text-xl font-bold text-slate-900">{formatCurrency(payment.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Method</span>
              <span className="text-slate-700">{payment.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt no.</span>
              <span className="text-slate-700">{payment.receiptNumber}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
              <span className="text-slate-500">Balance after payment</span>
              <span className="font-medium text-slate-900">{formatCurrency(remainingAfter)}</span>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">Thank you for your payment.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
}
