
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { addExpenseAsync } from "@/lib/store-async";
import { useBusinessMode } from "@/contexts/BusinessModeContext";
import type { ExpenseCategory } from "@/lib/db/types";

const CATEGORIES: ExpenseCategory[] = [
  "Labour",
  "Raw material",
  "Fuel",
  "Electricity",
  "Maintenance",
  "Rent",
  "Other",
];

const today = new Date().toISOString().slice(0, 10);

export function NewExpensePage() {
  const navigate = useNavigate();
  const { mode } = useBusinessMode();
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState<ExpenseCategory>("Labour");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert("Amount must be greater than 0.");
      return;
    }
    setSubmitting(true);
    try {
      await addExpenseAsync({ date, category, amount, description: description.trim(), businessType: mode });
      navigate("/expenses");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save expense.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1>Add Expense</h1>
      <p className="mt-2">
        <Link to="/expenses">Back to list</Link>
      </p>
      <form onSubmit={handleSubmit} className="max-w-md mt-4">
        <div className="mb-4">
          <label className="block mb-1">Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="input"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1">Amount (₹) *</label>
          <input
            type="number"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="input"
            min={0.01}
            step={0.01}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            placeholder="e.g. Monthly labour, Diesel for kiln"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Save Expense"}
        </button>
      </form>
    </div>
  );
}
