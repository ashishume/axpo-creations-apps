/**
 * Invoice number format: INV/2024-25/0001
 * Receipt number: RCP/2024-25/0001
 */

export function getFinancialYearSuffix(fyStart: number): string {
  const end = (fyStart + 1) % 100;
  return `${fyStart}-${end.toString().padStart(2, "0")}`;
}

export function formatInvoiceNumber(seq: number, fyStart: number): string {
  const suffix = getFinancialYearSuffix(fyStart);
  return `INV/${suffix}/${seq.toString().padStart(4, "0")}`;
}

export function formatReceiptNumber(seq: number, fyStart: number): string {
  const suffix = getFinancialYearSuffix(fyStart);
  return `RCP/${suffix}/${seq.toString().padStart(4, "0")}`;
}

export function formatPurchaseInvoiceNumber(seq: number, fyStart: number): string {
  const suffix = getFinancialYearSuffix(fyStart);
  return `PI/${suffix}/${seq.toString().padStart(4, "0")}`;
}

export function getCurrentFYStart(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, March = 2
  return month >= 3 ? year : year - 1;
}
