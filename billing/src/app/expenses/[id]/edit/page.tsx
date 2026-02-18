
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useExpense } from "@/hooks/useStore";
import { updateExpenseAsync } from "@/lib/store-async";
import { Skeleton } from "@/components/ui";
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

export function EditExpensePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: expense, loading } = useExpense(id ?? "");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Labour");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formReady, setFormReady] = useState(false);

  useEffect(() => {
    if (!expense) return;
    setDate(expense.date);
    setCategory(expense.category);
    setAmount(expense.amount);
    setDescription(expense.description || "");
    setFormReady(true);
  }, [expense]);

  useEffect(() => {
    if (!loading && expense === null) {
      navigate("/expenses");
    }
  }, [loading, expense, navigate]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (amount <= 0) {
      alert("Amount must be greater than 0.");
      return;
    }
    setSubmitting(true);
    try {
      await updateExpenseAsync(id!, { date, category, amount, description: description.trim() });
      navigate("/expenses");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update expense.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || expense === null || !formReady) {
    return (
      <div className="animate-fadeIn">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
        <div className="max-w-md mt-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
        Edit Expense
      </h1>
      <p className="mt-2">
        <Link to="/expenses">Back to list</Link>
      </p>
      <form onSubmit={handleSubmit} className="max-w-md mt-4">
        <div className="mb-4">
          <label className="block mb-1" style={{ color: "var(--text-primary)" }}>
            Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1" style={{ color: "var(--text-primary)" }}>
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="input"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1" style={{ color: "var(--text-primary)" }}>
            Amount (₹) *
          </label>
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
          <label className="block mb-1" style={{ color: "var(--text-primary)" }}>
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Updating..." : "Update Expense"}
        </button>
      </form>
    </div>
  );
}
