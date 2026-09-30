/**
 * Client-safe listing constants, types and validation.
 *
 * Deliberately separate from `listings.ts`, which is `server-only` because it
 * touches SQLite. Client components import from here so a "use client"
 * module never pulls the database into the browser bundle.
 */

export const LISTING_CATEGORIES = ['phone', 'tablet', 'laptop', 'accessory'] as const;
export const LISTING_CONDITIONS = ['new', 'used', 'refurbished'] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];
export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

export interface Listing {
  id: string;
  userId: string;
  title: string;
  description: string;
  pricePaise: number;
  category: string;
  condition: string;
  photos: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListingInput {
  title: string;
  description: string;
  pricePaise: number;
  category: string;
  condition: string;
  photos: string[];
}

/**
 * Price fields are entered in RUPEES ("25000" means ₹25,000), so the value is
 * always multiplied by 100 to reach the paise minor unit the app stores and
 * displays everywhere else.
 */
export function toPaise(rupees: unknown): number {
  const n = Number(String(rupees ?? '').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

export function validateListing(input: ListingInput): string | null {
  const title = input.title.trim();
  if (title.length < 3) return 'Please give your item a title.';
  if (title.length > 120) return 'That title is too long.';
  if (input.description.trim().length < 10) return 'Please add a short description.';
  if (input.description.length > 4000) return 'That description is too long.';
  if (input.pricePaise <= 0) return 'Please enter a valid price.';
  if (!LISTING_CATEGORIES.includes(input.category as ListingCategory)) {
    return 'Pick a valid category.';
  }
  if (!LISTING_CONDITIONS.includes(input.condition as ListingCondition)) {
    return 'Pick a valid condition.';
  }
  return null;
}
