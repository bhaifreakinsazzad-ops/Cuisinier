import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return `\u09F3${amount}`;
}

export function formatPaymentMethod(method: 'cod' | 'bkash' | 'nagad') {
  if (method === 'cod') return 'Cash on Delivery';
  if (method === 'bkash') return 'bKash Manual';
  return 'Nagad Manual';
}

export function sanitizePhoneForWhatsApp(phone: string) {
  const raw = phone.trim();
  if (!raw || /x/i.test(raw)) {
    return '';
  }

  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  if (digits.startsWith('8801') && digits.length === 13) {
    return digits;
  }

  if (digits.startsWith('01') && digits.length === 11) {
    return `88${digits}`;
  }

  if (digits.startsWith('1') && digits.length === 10) {
    return `88${digits}`;
  }

  return digits.length >= 10 && digits.length <= 15 ? digits : '';
}

export function isLikelyBangladeshMobile(phone: string) {
  return sanitizePhoneForWhatsApp(phone).startsWith('8801');
}

export function buildWhatsAppLink(phone: string, message: string) {
  const sanitized = sanitizePhoneForWhatsApp(phone);
  const base = sanitized ? `https://wa.me/${sanitized}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}
