import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return `৳${amount}`;
}

export function formatPaymentMethod(method: 'cod' | 'bkash' | 'nagad') {
  if (method === 'cod') return 'Cash on Delivery';
  if (method === 'bkash') return 'bKash Manual';
  return 'Nagad Manual';
}

// ── Phone normalization ───────────────────────────────────────────────────────

/**
 * Normalize a Bangladesh mobile number to the 13-digit international form 8801XXXXXXXXX.
 * Returns an empty string if the number cannot be recognized.
 *
 * Valid inputs: 01XXXXXXXXX, 8801XXXXXXXXX, +8801XXXXXXXXX
 * Valid operator prefixes: 013–019
 */
export function sanitizePhoneForWhatsApp(phone: string): string {
  const raw = phone.trim();
  if (!raw || /x/i.test(raw)) return '';

  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  // +8801XXXXXXXXX / 8801XXXXXXXXX → 13 digits
  if (digits.startsWith('8801') && digits.length === 13) {
    return /^8801[3-9]\d{8}$/.test(digits) ? digits : '';
  }

  // 01XXXXXXXXX → 11 digits
  if (digits.startsWith('01') && digits.length === 11) {
    const normalized = `88${digits}`;
    return /^8801[3-9]\d{8}$/.test(normalized) ? normalized : '';
  }

  return '';
}

/**
 * Returns true if the phone string can be normalized to a valid Bangladesh mobile.
 */
export function isLikelyBangladeshMobile(phone: string): boolean {
  return sanitizePhoneForWhatsApp(phone) !== '';
}

export function buildWhatsAppLink(phone: string, message: string) {
  const sanitized = sanitizePhoneForWhatsApp(phone);
  const base = sanitized ? `https://wa.me/${sanitized}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

// ── Input sanitizers ──────────────────────────────────────────────────────────

/** Strip control characters and trim whitespace. */
export function sanitizeText(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

/** Trim and strip non-alphanumeric except common txn ID chars (-, /, space). */
export function sanitizeTransactionId(value: string): string {
  return value.replace(/[^\w\-/\s]/g, '').trim();
}
