import { useState } from "react";
import { Modal } from "@/components/ui";
import { addExpenseAsync } from "@/lib/store-async";
import { useBusinessMode } from "@/contexts/BusinessModeContext";
import type { ExpenseCategory } from "@/lib/db/types";

const CATEGORIES: ExpenseCategory[] = [
  "Labour", "Raw material", "Fuel", "Electricity", "Maintenance", "Rent", "Other",
];

const today = new Date().toISOString().slice(0, 10);

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddExpenseModal({ isOpen, onClose, onSaved }: AddExpenseModalProps) {
  const { mode } = useBusinessMode();
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState<ExpenseCategory>("Labour");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) { alert("Amount must be greater than 0."); return; }
    setSubmitting(true);
    try {
      await addExpenseAsync({ date, category, amount, description: description.trim(), businessType: mode });
      setDate(today); setCategory("Labour"); setAmount(0); setDescription("");
      onSaved();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save expense.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Expense" size="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Date *</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Category *</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Amount (₹) *</label>
            <input type="number" className="input" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value) || 0)} min={0.01} step={0.01} required />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Description (optional)</label>
            <input type="text" className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Monthly labour, Diesel" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Save Expense"}</button>
        </div>
      </form>
    </Modal>
  );
}
