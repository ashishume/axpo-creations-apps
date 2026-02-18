export function validateGstin(gstin: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(gstin.trim());
}

export function validatePan(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim().toUpperCase());
}

export function validatePhone(phone: string): boolean {
  return /^[0-9]{10}$/.test(phone.replace(/\s/g, ""));
}
