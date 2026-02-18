/**
 * GST calculations for India: CGST+SGST (intrastate) or IGST (interstate)
 * Roundoff to rupee and amount in words (Indian numbering)
 */

export function roundToRupee(amount: number): number {
  return Math.round(amount);
}

export function getGstAmounts(
  taxableAmount: number,
  gstRate: number,
  isIntrastate: boolean
): { cgst: number; sgst: number; igst: number } {
  const rate = gstRate / 100;
  if (isIntrastate) {
    const half = (taxableAmount * rate) / 2;
    return {
      cgst: roundToRupee(half),
      sgst: roundToRupee(half),
      igst: 0,
    };
  }
  return {
    cgst: 0,
    sgst: 0,
    igst: roundToRupee(taxableAmount * rate),
  };
}

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

function twoDigits(n: number): string {
  if (n < 10) return ones[n];
  if (n < 20) return teens[n - 10];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return tens[t] + (o > 0 ? " " + ones[o] : "");
}

function threeDigits(n: number): string {
  if (n === 0) return "";
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const part = h > 0 ? ones[h] + " Hundred" : "";
  return part + (rest > 0 ? (part ? " " : "") + twoDigits(rest) : "");
}

/**
 * Convert number to Indian Rupee words (e.g. 12345 -> "Twelve Thousand Three Hundred Forty Five Rupees Only")
 */
export function amountToWords(num: number): string {
  const n = Math.floor(num);
  if (n === 0) return "Zero Rupees Only";

  const crore = Math.floor(n / 1e7);
  const lakh = Math.floor((n % 1e7) / 1e5);
  const thousand = Math.floor((n % 1e5) / 1e3);
  const rest = n % 1e3;

  const parts: string[] = [];
  if (crore > 0) parts.push(threeDigits(crore) + " Crore");
  if (lakh > 0) parts.push(threeDigits(lakh) + " Lakh");
  if (thousand > 0) parts.push(threeDigits(thousand) + " Thousand");
  if (rest > 0) parts.push(threeDigits(rest));

  return (parts.join(" ") || "Zero") + " Rupees Only";
}

export function getRoundOff(totalBeforeRound: number): number {
  const rounded = roundToRupee(totalBeforeRound);
  return rounded - totalBeforeRound;
}
