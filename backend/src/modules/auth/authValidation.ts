/**
 * Email Validation for Backend
 * Supports any standard, valid email address (Gmail, Outlook, campus, personal, etc.)
 */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailFormat(email: string): boolean {
  const normalized = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

// Backward-compatible alias that allows any valid email
export function isVitEmail(email: string): boolean {
  return isValidEmailFormat(email);
}

export function isValidEmail(email: string): boolean {
  return isValidEmailFormat(email);
}

export const EMAIL_ERROR = "Please enter a valid email address.";
export const VIT_EMAIL_ERROR = EMAIL_ERROR;

