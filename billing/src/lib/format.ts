/**
 * Formatting utilities for dates and currency
 */

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get the first day of the current month in ISO format (YYYY-MM-01)
 */
export function getFirstOfMonthISO(): string {
  return new Date().toISOString().slice(0, 7) + "-01";
}

/**
 * Get the financial year start year (April to March)
 * If current month is April or later, FY starts this year; otherwise last year
 */
export function getFinancialYearStart(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();
  return month >= 3 ? year : year - 1; // April is month 3
}

/**
 * Format a date string or Date object
 * @param date - ISO date string or Date object
 * @param style - "short" (12 Mar 2026) or "long" (12 March 2026)
 */
export function formatDate(date: string | Date, style: "short" | "long" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: style === "short" ? "short" : "long",
    year: "numeric",
  });
}

/**
 * Format a date for month-year display (Mar 2026 or March 2026)
 */
export function formatMonthYear(date: string | Date, style: "short" | "long" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    month: style === "short" ? "short" : "long",
    year: "numeric",
  });
}

/**
 * Format currency in Indian format with rupee symbol
 * @param value - Number to format
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted string like "₹1,23,456.00"
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return "₹" + value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency in compact form for large numbers
 * @param value - Number to format
 * @returns Formatted string like "₹1.2L" or "₹10Cr"
 */
export function formatCurrencyCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  
  if (abs >= 1_00_00_000) {
    // Crores (10 million)
    return sign + "₹" + (abs / 1_00_00_000).toFixed(1).replace(/\.0$/, "") + "Cr";
  }
  if (abs >= 1_00_000) {
    // Lakhs (100 thousand)
    return sign + "₹" + (abs / 1_00_000).toFixed(1).replace(/\.0$/, "") + "L";
  }
  if (abs >= 1000) {
    // Thousands
    return sign + "₹" + (abs / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return sign + "₹" + abs.toFixed(0);
}
