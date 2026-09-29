import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { siteConfig } from './config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ── Money ────────────────────────────────────────────────────────────────── */

/** Formats paise as a localised currency string, e.g. `₹1,29,900`. */
export function formatPrice(paise: number, opts?: { compact?: boolean }) {
  const rupees = paise / 100;
  return new Intl.NumberFormat(siteConfig.locale, {
    style: 'currency',
    currency: siteConfig.currency,
    maximumFractionDigits: opts?.compact && rupees >= 100000 ? 0 : 2,
    minimumFractionDigits: 0,
    notation: opts?.compact && rupees >= 100000 ? 'compact' : 'standard',
  }).format(rupees);
}

/** Plain number formatting with Indian grouping. */
export const formatNumber = (value: number) =>
  new Intl.NumberFormat(siteConfig.locale).format(value);

/** Discount percentage, rounded. Returns 0 when there is no discount. */
export function discountPercent(price: number, mrp: number): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

/* ── Text ─────────────────────────────────────────────────────────────────── */

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function titleCase(value: string): string {
  return value.replace(/(^|[\s-])(\w)/g, (_, sep: string, ch: string) =>
    `${sep === '-' ? ' ' : sep}${ch.toUpperCase()}`,
  );
}

export const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;

/**
 * Defence-in-depth sanitiser for any user-supplied string before it is
 * persisted or echoed back (names, addresses, notes, review bodies).
 * React escapes on render; this also strips control chars and angle brackets.
 */
export function sanitizeText(value: string, maxLength = 500): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/** Preserves newlines (used for WhatsApp summaries) but still sanitises. */
export function sanitizeMultiline(value: string, maxLength = 1000): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

/* ── Arrays ───────────────────────────────────────────────────────────────── */

export const unique = <T,>(list: T[]): T[] => Array.from(new Set(list));

/** Stable, human-friendly reference generator, e.g. `MEX-7F3K2Q`. */
export function generateReference(prefix: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${suffix}`;
}

export function generateOrderNumber(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const rand = String(Math.floor(1000 + Math.random() * 8999));
  return `MEX${stamp}${rand}`;
}

/* ── Misc ─────────────────────────────────────────────────────────────────── */

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** `true` when the visitor is on a touch-first / narrow device. */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

/** Normalises a 10-digit Indian number to `+91XXXXXXXXXX`. */
export function normalisePhone(input: string): string {
  const d = input.replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `+91${d}` : input;
}

/** Today's date as `YYYY-MM-DD` (local, avoids UTC off-by-one). */
export function todayISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

export function formatDate(value: string | number | Date): string {
  return new Intl.DateTimeFormat(siteConfig.locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(value: string | number | Date): string {
  return new Intl.DateTimeFormat(siteConfig.locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

/** Relative time, e.g. `3 days ago`. */
export function timeAgo(value: string | number | Date): string {
  const diff = Date.now() - new Date(value).getTime();
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000000],
    ['month', 2592000000],
    ['week', 604800000],
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
  ];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms) return rtf.format(-Math.round(diff / ms), unit);
  }
  return 'just now';
}
