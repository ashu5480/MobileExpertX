import { z } from 'zod';
import { repairBrands } from '@/data/repairs';
import {
  sellAccessoryOptions,
  sellConditions,
  sellPurchaseAges,
  sellStorages,
} from '@/data/sellPhone';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  Validation schemas
 *  Shared by the client forms (for inline error states) and by the API route
 *  handlers (for authoritative server-side validation). The client check is a
 *  convenience — the server always re-validates and never trusts the browser.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Indian mobile number, optionally with +91 / 0 prefix, spaces or dashes. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .refine((v) => /^(?:\+?91)?[6-9]\d{9}$/.test(v), {
    message: 'Enter a valid 10-digit Indian mobile number.',
  });

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Please enter your full name.')
  .max(80, 'Name is too long.')
  .regex(/^[\p{L}\p{M}\s.'-]+$/u, 'Name contains invalid characters.');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, 'Enter a valid email address.')
  .max(160, 'Email is too long.')
  .regex(/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i, 'Enter a valid email address.');

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code.');

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.');

/** Rejects dates in the past. */
export const futureDateSchema = isoDateSchema.refine((v) => {
  const d = new Date(`${v}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(d.getTime()) && d >= today;
}, { message: 'Choose today or a future date.' });

const oneOf = (values: readonly string[], label: string) =>
  z.string().refine((v) => values.includes(v), { message: `Choose a valid ${label}.` });

/* ── Repair booking ─────────────────────────────────────────────────────── */

export const repairBookingSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: z.union([emailSchema, z.literal('')]).optional(),
  brand: oneOf(repairBrands, 'device brand'),
  model: z.string().trim().min(1, 'Choose your device model.').max(80),
  problem: z
    .string()
    .trim()
    .min(10, 'Please describe the problem in at least 10 characters.')
    .max(600, 'Please keep the description under 600 characters.'),
  serviceSlug: z.string().trim().max(80).optional(),
  preferredDate: futureDateSchema,
  preferredTime: z.string().trim().min(1, 'Choose a preferred time slot.').max(40),
  dropoff: z.enum(['walk-in', 'pickup'], {
    errorMap: () => ({ message: 'Choose how you would like to hand over the device.' }),
  }),
  notes: z.string().trim().max(500).optional(),
});

export type RepairBookingInput = z.infer<typeof repairBookingSchema>;

/* ── Sell-phone request ─────────────────────────────────────────────────── */

export const sellPhoneSchema = z.object({
  brand: z.string().trim().min(2, 'Choose your phone brand.').max(40),
  model: z.string().trim().min(2, 'Choose your phone model.').max(80),
  storage: oneOf(sellStorages, 'storage option'),
  condition: oneOf(sellConditions.map((c) => c.value), 'overall condition'),
  screen: z.string().trim().min(1, 'Describe the screen condition.').max(40),
  battery: z.string().trim().min(1, 'Describe the battery condition.').max(40),
  body: z.string().trim().min(1, 'Describe the body condition.').max(40),
  accessories: z.array(z.string().max(40)).max(sellAccessoryOptions.length).default([]),
  hasOriginalBox: z.boolean().default(false),
  purchaseAge: oneOf(sellPurchaseAges.map((a) => a.value), 'purchase age'),
  estimatedValuePaise: z.number().int().min(0).max(100000000),
  customerName: nameSchema,
  customerPhone: phoneSchema,
  customerEmail: emailSchema,
  address: z
    .string()
    .trim()
    .min(10, 'Please enter your full pickup address.')
    .max(300, 'Address is too long.'),
  pickupDate: futureDateSchema,
  pickupTime: z.string().trim().min(1, 'Choose a pickup slot.').max(40),
  imageCount: z.number().int().min(0).max(12).default(0),
  notes: z.string().trim().max(500).optional(),
});

export type SellPhoneInput = z.infer<typeof sellPhoneSchema>;

/* ── Checkout ───────────────────────────────────────────────────────────── */

export const checkoutSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  addressLine: z
    .string()
    .trim()
    .min(5, 'Enter your house / flat number and street.')
    .max(200, 'Address is too long.'),
  area: z.string().trim().min(2, 'Enter your area or locality.').max(120),
  city: z.string().trim().min(2, 'Enter your city.').max(80),
  state: z.string().trim().min(2, 'Enter your state.').max(80),
  pincode: pincodeSchema,
  landmark: z.string().trim().max(160).optional(),
  deliveryMethod: z.enum(['standard', 'express', 'pickup']),
  saveInfo: z.boolean().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/* ── Order creation (client -> server, untrusted) ───────────────────────── */

export const orderLineSchema = z.object({
  productId: z.string().trim().min(1).max(64),
  variantKey: z.string().trim().min(1).max(120),
  quantity: z.number().int().min(1).max(10),
});

export const createOrderSchema = z.object({
  ...checkoutSchema.shape,
  lines: z.array(orderLineSchema).min(1, 'Your cart is empty.').max(50),
  couponCode: z.string().trim().max(40).optional().nullable(),
  /**
   * The subtotal the client calculated. The server always recomputes from the
   * catalogue and ignores this value — it exists only for reconciliation logs.
   */
  claimedSubtotalPaise: z.number().int().min(0).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/* ── Contact ────────────────────────────────────────────────────────────── */

export const contactSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  subject: z.string().trim().min(3, 'Please add a subject.').max(120),
  message: z
    .string()
    .trim()
    .min(10, 'Please tell us a little more — at least 10 characters.')
    .max(1500, 'Message is too long.'),
});

export type ContactInput = z.infer<typeof contactSchema>;

/* ── Payment verification ───────────────────────────────────────────────── */

export const verifyPaymentSchema = z.object({
  orderId: z.string().trim().min(1).max(64),
  provider: z.enum(['razorpay', 'stripe', 'mock']),
  /** Gateway response signature / payment id. */
  paymentReference: z.string().trim().min(1).max(200),
  signature: z.string().trim().max(256).optional(),
  orderNumber: z.string().trim().max(40).optional(),
});

/* ── Helpers ────────────────────────────────────────────────────────────── */

/** Flattens a ZodError into a `{ field: message }` map for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
