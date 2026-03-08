import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Format a date string for display (e.g. "26 May 2026"). Handles ISO and YYYY-MM-DD. */
export function formatDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format YYYY-MM to readable month and year (e.g. "March 2026"). */
export function formatMonthYear(monthStr: string): string {
  if (!monthStr || typeof monthStr !== "string") return "—";
  const [y, m] = monthStr.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return monthStr;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

// Class progression order
const CLASS_ORDER = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

/**
 * Get the next class name in progression
 * Returns null if student has graduated (completed Class 12)
 */
export function getNextClassName(currentClassName: string): string | null {
  const normalizedName = currentClassName.trim();
  const currentIndex = CLASS_ORDER.findIndex(
    (c) => c.toLowerCase() === normalizedName.toLowerCase()
  );
  
  if (currentIndex === -1) {
    // Try to match "Class X" pattern
    const match = normalizedName.match(/class\s*(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 12) return null; // Graduated
      return `Class ${num + 1}`;
    }
    return null; // Unknown class format
  }
  
  if (currentIndex >= CLASS_ORDER.length - 1) {
    return null; // Graduated from Class 12
  }
  
  return CLASS_ORDER[currentIndex + 1];
}

/**
 * Check if a session has ended (endDate is in the past)
 */
export function isSessionCompleted(endDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  return end < today;
}
