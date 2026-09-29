import { LISTING_CATEGORIES, LISTING_CONDITIONS } from '@/lib/listings';

/** Shared listing input parsing/validation, used by both listing routes. */

export interface ListingInputShape {
  title: string;
  description: string;
  pricePaise: number;
  category: string;
  condition: string;
}

/**
 * Accepts "45000" (already paise) or "450.00" / "450" (rupees from a form
 * field) and returns paise. Values under 1000 with a decimal are treated as
 * rupees; anything else is read as paise, which is what the API client sends.
 */
export function toPaise(value: unknown): number {
  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  const n = Number(raw.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return raw.includes('.') && n < 1000 ? Math.round(n * 100) : Math.round(n);
}

export function validateListing(input: ListingInputShape): string | null {
  const title = input.title.trim();
  if (title.length < 3) return 'Please give your item a title.';
  if (title.length > 120) return 'That title is too long.';
  if (input.description.trim().length < 10) return 'Please add a short description.';
  if (input.description.length > 4000) return 'That description is too long.';
  if (input.pricePaise <= 0) return 'Please enter a valid price.';
  if (!LISTING_CATEGORIES.includes(input.category as never)) return 'Pick a valid category.';
  if (!LISTING_CONDITIONS.includes(input.condition as never)) return 'Pick a valid condition.';
  return null;
}
