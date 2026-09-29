import { siteConfig } from './config';
import { coupons, deliveryMethods } from '@/data/store';
import type {
  AccessoryProduct,
  CartLine,
  Coupon,
  DeliveryMethodId,
  OrderTotals,
  Product,
} from '@/types';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  Cart & pricing engine
 *  Pure functions shared by the cart drawer, the cart page and checkout, so the
 *  numbers can never disagree between screens. All amounts are in paise.
 * ────────────────────────────────────────────────────────────────────────────
 */

export const DELIVERY_FEE_STANDARD = 9900;
export const DELIVERY_FEE_EXPRESS = 24900;
export const FREE_SHIPPING_THRESHOLD = siteConfig.freeShippingThresholdPaise;

/** GST rate applied to the discounted subtotal. */
export const GST_RATE = 0.18;

/* ── Variants ───────────────────────────────────────────────────────────── */

export interface ResolvedVariant {
  color: string;
  storage: string;
  ram: string;
}

/** Builds a stable variant key from a product + selections. */
export function makeVariantKey(v: Partial<ResolvedVariant>): string {
  return [v.color ?? 'default', v.storage ?? 'default', v.ram ?? 'default'].join('|');
}

export function parseVariantKey(key: string): ResolvedVariant {
  const [color, storage, ram] = key.split('|');
  return { color: color || 'default', storage: storage || 'default', ram: ram || 'default' };
}

/** The default variant for a product — first color / storage / RAM. */
export function defaultVariant(product: Product): ResolvedVariant {
  return {
    color: product.colors[0]?.name ?? 'default',
    storage: product.storages[0] ?? 'default',
    ram: product.rams[0] ?? 'default',
  };
}

/** Storage tiers carry a price delta against the base storage. */
const storageMultiplier = (storage: string): number => {
  const m = storage.match(/(\d+)\s*(gb|tb)/i);
  if (!m) return 1;
  const size = Number(m[1]) * (m[2].toLowerCase() === 'tb' ? 1024 : 1);
  if (size <= 64) return 0.85;
  if (size <= 128) return 1;
  if (size <= 256) return 1.14;
  if (size <= 512) return 1.38;
  return 1.75;
};

/** Higher-RAM tiers add a modest premium. */
const ramMultiplier = (ram: string): number => {
  const n = Number(ram.replace(/\D/g, '')) || 8;
  if (n <= 4) return 0.97;
  if (n <= 6) return 1;
  if (n <= 8) return 1.03;
  if (n <= 12) return 1.06;
  return 1.12;
};

/** Unit price for a specific variant, rounded to the nearest rupee. */
export function variantPrice(product: Product, variantKey: string): number {
  const { storage, ram } = parseVariantKey(variantKey);
  const raw = product.price * storageMultiplier(storage) * ramMultiplier(ram);
  return Math.round(raw / 100) * 100;
}

/* ── Cart maths ─────────────────────────────────────────────────────────── */

export interface CartEntry {
  line: CartLine;
  product: Product;
  /** The accessory this line refers to, when the line is not a phone. */
  accessory: AccessoryProduct | null;
  unitPricePaise: number;
  lineTotalPaise: number;
  variant: ResolvedVariant;
  /** Display name — a phone model or an accessory. */
  title: string;
  href: string;
  accent: string;
  image: string;
}

/** Prefix that marks a cart line as an accessory rather than a phone. */
export const ACCESSORY_PREFIX = 'acc:';

export const accessoryId = (id: string) => `${ACCESSORY_PREFIX}${id}`;

export const isAccessoryLine = (productId: string) =>
  productId.startsWith(ACCESSORY_PREFIX);

/**
 * Resolves cart lines into full entries.
 *
 * Phone lines are re-priced against the live catalogue (so a stale
 * localStorage entry can never set a price) and dropped if the product no
 * longer exists. Accessory lines resolve from the accessory catalogue.
 */
export function resolveCart(
  products: Product[],
  lines: CartLine[],
  accessories: AccessoryProduct[] = [],
): CartEntry[] {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const accessoryMap = new Map(accessories.map((a) => [a.id, a]));

  return lines
    .map((line): CartEntry | null => {
      // ── Accessory line ─────────────────────────────────────────────
      if (isAccessoryLine(line.productId)) {
        const accessory = accessoryMap.get(line.productId.slice(ACCESSORY_PREFIX.length));
        if (!accessory) return null;
        return {
          line,
          product: null as unknown as Product,
          accessory,
          unitPricePaise: accessory.price,
          lineTotalPaise: accessory.price * line.quantity,
          variant: { color: 'default', storage: 'default', ram: 'default' },
          title: accessory.name,
          href: `/accessories/${accessory.slug}`,
          accent: accessory.accent,
          image: accessory.image,
        };
      }

      // ── Phone line ─────────────────────────────────────────────────
      const product = productMap.get(line.productId);
      if (!product) return null;
      const unitPricePaise = variantPrice(product, line.variantKey);
      return {
        line,
        product,
        accessory: null,
        unitPricePaise,
        lineTotalPaise: unitPricePaise * line.quantity,
        variant: parseVariantKey(line.variantKey),
        title: product.name,
        href: `/shop/${product.slug}`,
        accent: product.accent,
        image: product.images[0]?.url ?? '',
      };
    })
    .filter((e): e is CartEntry => e !== null);
}

/* ── Coupons ────────────────────────────────────────────────────────────── */

export interface CouponCheck {
  valid: boolean;
  coupon: Coupon | null;
  discountPaise: number;
  reason?: string;
}

export function findCoupon(code: string): Coupon | null {
  return coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase()) ?? null;
}

const formatRupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;

/** Validates a coupon against a subtotal and the current date. */
export function checkCoupon(code: string, subtotalPaise: number): CouponCheck {
  const coupon = findCoupon(code);
  if (!coupon) {
    return { valid: false, coupon: null, discountPaise: 0, reason: 'That coupon code is not recognised.' };
  }
  if (!coupon.active || new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, coupon, discountPaise: 0, reason: 'This coupon has expired.' };
  }
  if (subtotalPaise < coupon.minCartPaise) {
    return {
      valid: false,
      coupon,
      discountPaise: 0,
      reason: `Add ${formatRupees(coupon.minCartPaise - subtotalPaise)} more to use this coupon.`,
    };
  }

  let discountPaise =
    coupon.type === 'percentage'
      ? Math.round((subtotalPaise * coupon.value) / 100)
      : coupon.value;

  if (coupon.maxDiscountPaise) {
    discountPaise = Math.min(discountPaise, coupon.maxDiscountPaise);
  }
  // Never discount more than the subtotal itself.
  discountPaise = Math.min(discountPaise, subtotalPaise);

  return { valid: true, coupon, discountPaise, reason: `${coupon.description} applied.` };
}

/* ── Totals ─────────────────────────────────────────────────────────────── */

export interface TotalsInput {
  subtotalPaise: number;
  couponCode?: string | null;
  deliveryMethod?: DeliveryMethodId;
  /** Set false for flows where GST is not applicable. */
  applyTax?: boolean;
}

export function calculateTotals({
  subtotalPaise,
  couponCode,
  deliveryMethod = 'standard',
  applyTax = true,
}: TotalsInput): OrderTotals {
  const couponResult = couponCode ? checkCoupon(couponCode, subtotalPaise) : null;
  const discountPaise = couponResult?.valid ? couponResult.discountPaise : 0;

  const taxableBase = Math.max(0, subtotalPaise - discountPaise);
  const taxPaise = applyTax ? Math.round(taxableBase * GST_RATE) : 0;

  const method = deliveryMethods.find((m) => m.id === deliveryMethod);
  let shippingPaise = method?.pricePaise ?? DELIVERY_FEE_STANDARD;
  let freeShippingApplied = false;

  if (deliveryMethod === 'pickup') {
    shippingPaise = 0;
    freeShippingApplied = true;
  } else if (method?.freeAbovePaise && taxableBase >= method.freeAbovePaise) {
    shippingPaise = 0;
    freeShippingApplied = true;
  }

  return {
    subtotalPaise,
    discountPaise,
    shippingPaise,
    taxPaise,
    grandTotalPaise: taxableBase + taxPaise + shippingPaise,
    couponCode: couponResult?.valid ? couponResult.coupon?.code ?? null : null,
    freeShippingApplied,
  };
}

/** Convenience: full totals straight from a resolved cart. */
export function totalsFromCart(
  entries: CartEntry[],
  opts: { couponCode?: string | null; deliveryMethod?: DeliveryMethodId; applyTax?: boolean } = {},
): OrderTotals {
  const subtotalPaise = entries.reduce((sum, e) => sum + e.lineTotalPaise, 0);
  return calculateTotals({
    subtotalPaise,
    couponCode: opts.couponCode,
    deliveryMethod: opts.deliveryMethod,
    applyTax: opts.applyTax,
  });
}

export const cartCount = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.quantity, 0);

/** Progress towards the free-shipping threshold, 0–1. */
export function freeShippingProgress(subtotalPaise: number): number {
  return Math.min(1, subtotalPaise / FREE_SHIPPING_THRESHOLD);
}

export const amountToFreeShipping = (subtotalPaise: number) =>
  Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalPaise);

/* ── Sell-phone valuation ───────────────────────────────────────────────── */

const CONDITION_FACTOR: Record<string, number> = {
  'like-new': 1,
  good: 0.9,
  fair: 0.76,
  broken: 0.3,
};

const SCREEN_FACTOR: Record<string, number> = {
  perfect: 1,
  minor: 0.96,
  cracked: 0.82,
  broken: 0.62,
};

const BATTERY_FACTOR: Record<string, number> = {
  new: 1.03,
  healthy: 1,
  worn: 0.9,
  poor: 0.78,
};

const BODY_FACTOR: Record<string, number> = {
  pristine: 1,
  minor: 0.97,
  damaged: 0.86,
};

const AGE_FACTOR: Record<string, number> = {
  '0-6': 1.05,
  '6-12': 1,
  '12-24': 0.9,
  '24-36': 0.79,
  '36-48': 0.66,
  '48+': 0.5,
};

const ACCESSORY_BONUS: Record<string, number> = {
  'Original box': 0.05,
  Charger: 0.02,
  'USB cable': 0.01,
  'Warranty card': 0.01,
  'Case / cover': 0.01,
  'SIM ejector': 0.005,
};

export interface SellQuoteInput {
  baseValuePaise: number;
  storage: string;
  condition: string;
  screen: string;
  battery: string;
  body: string;
  accessories: string[];
  hasOriginalBox: boolean;
  purchaseAge: string;
}

export interface SellQuote {
  estimatedValuePaise: number;
  /** Low/high band, ±7% to reflect real inspection variance. */
  lowPaise: number;
  highPaise: number;
  breakdown: Array<{ label: string; factor: number }>;
}

const storageFactor = (storage: string): number => {
  const m = storage.match(/(\d+)\s*(gb|tb)/i);
  if (!m) return 1;
  const size = Number(m[1]) * (m[2].toLowerCase() === 'tb' ? 1024 : 1);
  if (size <= 32) return 0.62;
  if (size <= 64) return 0.78;
  if (size <= 128) return 1;
  if (size <= 256) return 1.28;
  if (size <= 512) return 1.62;
  return 2.05;
};

/** Applies every multiplier in sequence and returns a transparent breakdown. */
export function estimateResaleValue(input: SellQuoteInput): SellQuote {
  const breakdown: Array<{ label: string; factor: number }> = [];
  let value = input.baseValuePaise;

  const apply = (label: string, factor: number) => {
    value *= factor;
    breakdown.push({ label, factor });
  };

  apply('Storage', storageFactor(input.storage));
  apply('Overall condition', CONDITION_FACTOR[input.condition] ?? 0.85);
  apply('Screen condition', SCREEN_FACTOR[input.screen] ?? 0.9);
  apply('Battery condition', BATTERY_FACTOR[input.battery] ?? 0.95);
  apply('Body condition', BODY_FACTOR[input.body] ?? 0.95);
  apply('Purchase age', AGE_FACTOR[input.purchaseAge] ?? 0.8);

  let accessoryFactor = 0;
  for (const acc of input.accessories) accessoryFactor += ACCESSORY_BONUS[acc] ?? 0.005;
  if (input.hasOriginalBox) accessoryFactor += 0.06;
  if (accessoryFactor > 0) apply('Original box & accessories', 1 + accessoryFactor);

  const estimatedValuePaise = Math.max(50000, Math.round(value / 10000) * 10000);
  return {
    estimatedValuePaise,
    lowPaise: Math.max(50000, Math.round((estimatedValuePaise * 0.93) / 10000) * 10000),
    highPaise: Math.round((estimatedValuePaise * 1.07) / 10000) * 10000,
    breakdown,
  };
}

