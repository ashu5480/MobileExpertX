import { generateOrderNumber, generateReference, sanitizeText } from '@/lib/utils';
import { getProductById } from './catalogService';
import {
  variantPrice,
  calculateTotals,
  estimateResaleValue,
  accessoryId,
  isAccessoryLine,
  type SellQuote,
} from '@/lib/pricing';
import { repairServices } from '@/data/repairs';
import { sellBrands } from '@/data/sellPhone';
import { accessories as seedAccessories } from '@/data/accessories';
import type {
  ContactInquiry,
  Order,
  OrderLine,
  RepairBooking,
  SellPhoneRequest,
} from '@/types';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  Server-side repository
 * ────────────────────────────────────────────────────────────────────────────
 *  A thin persistence layer that gives the app a working backend today. Every
 *  function is async-shaped and every write is sanitised, so swapping the Map
 *  for a real database is a change to this file only — route handlers and UI
 *  stay untouched.
 */

type GlobalStore = {
  orders: Map<string, Order>;
  bookings: Map<string, RepairBooking>;
  sellRequests: Map<string, SellPhoneRequest>;
  inquiries: Map<string, ContactInquiry>;
};

const g = globalThis as typeof globalThis & { __mexStore?: GlobalStore };

function store(): GlobalStore {
  if (!g.__mexStore) {
    g.__mexStore = {
      orders: new Map(),
      bookings: new Map(),
      sellRequests: new Map(),
      inquiries: new Map(),
    };
  }
  return g.__mexStore;
}

/* â”€â”€ Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export interface CreateOrderArgs {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  deliveryMethod: Order['deliveryMethod'];
  lines: Array<{ productId: string; variantKey: string; quantity: number }>;
  couponCode?: string | null;
}

/**
 * Builds an order from untrusted client input.
 *
 * Prices, stock and discounts are **always recomputed server-side** from the
 * catalogue â€” the client only says which product and variant it wants.
 */
export function createOrder(args: CreateOrderArgs): Order {
  const lines: OrderLine[] = [];
  const problems: string[] = [];
  const accessories = new Map(seedAccessories.map((a) => [accessoryId(a.id), a]));

  for (const line of args.lines) {
    // â”€â”€ Accessory line â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (isAccessoryLine(line.productId)) {
      const accessory = accessories.get(line.productId);
      if (!accessory) {
        problems.push('An accessory in your cart is no longer available.');
        continue;
      }
      if (accessory.stock < line.quantity) {
        problems.push(`Only ${accessory.stock} left of ${accessory.name}.`);
        continue;
      }
      lines.push({
        productId: line.productId,
        name: accessory.name,
        slug: accessory.slug,
        variantKey: line.variantKey,
        quantity: line.quantity,
        // Accessories are single-variant; the price comes from the catalogue.
        unitPricePaise: accessory.price,
        lineTotalPaise: accessory.price * line.quantity,
        image: accessory.image,
        accent: accessory.accent,
        kind: 'accessory',
      });
      continue;
    }

    // â”€â”€ Phone line â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const product = getProductById(line.productId);
    if (!product) {
      problems.push('An item in your cart is no longer available.');
      continue;
    }
    if (product.stock < line.quantity) {
      problems.push(`Only ${product.stock} left of ${product.name}.`);
      continue;
    }
    // Guard against a client inventing a colour/storage/RAM that is not sold.
    const [color, storage, ram] = line.variantKey.split('|');
    if (color !== 'default' && !product.colors.some((c) => c.name === color)) {
      problems.push(`An unavailable colour was selected for ${product.name}.`);
      continue;
    }
    if (storage !== 'default' && !product.storages.includes(storage)) {
      problems.push(`An unavailable storage was selected for ${product.name}.`);
      continue;
    }
    if (ram !== 'default' && !product.rams.includes(ram)) {
      problems.push(`An unavailable RAM was selected for ${product.name}.`);
      continue;
    }

    const unitPricePaise = variantPrice(product, line.variantKey);
    lines.push({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      variantKey: line.variantKey,
      quantity: line.quantity,
      unitPricePaise,
      lineTotalPaise: unitPricePaise * line.quantity,
      image: product.images[0]?.url ?? '',
      accent: product.accent,
      kind: 'phone',
    });
  }

  if (!lines.length) {
    throw new Error(problems[0] ?? 'None of the items in your cart are available.');
  }

  const subtotalPaise = lines.reduce((s, l) => s + l.lineTotalPaise, 0);
  const totals = calculateTotals({
    subtotalPaise,
    couponCode: args.couponCode,
    deliveryMethod: args.deliveryMethod,
  });

  const order: Order = {
    id: `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    orderNumber: generateOrderNumber(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    paymentStatus: 'created',
    paymentProvider: 'mock',
    paymentReference: null,
    customer: {
      fullName: sanitizeText(args.fullName, 80),
      phone: sanitizeText(args.phone, 20),
      email: sanitizeText(args.email, 160).toLowerCase(),
    },
    shippingAddress: {
      addressLine: sanitizeText(args.addressLine, 200),
      area: sanitizeText(args.area, 120),
      city: sanitizeText(args.city, 80),
      state: sanitizeText(args.state, 80),
      pincode: sanitizeText(args.pincode, 6),
      landmark: args.landmark ? sanitizeText(args.landmark, 160) : undefined,
    },
    deliveryMethod: args.deliveryMethod,
    lines,
    totals,
  };

  store().orders.set(order.id, order);
  return order;
}

export const getOrderById = (id: string): Order | null => store().orders.get(id) ?? null;

export const getOrderByNumber = (orderNumber: string): Order | null => {
  for (const order of store().orders.values()) {
    if (order.orderNumber === orderNumber) return order;
  }
  return null;
};

export function updateOrder(id: string, patch: Partial<Order>): Order | null {
  const existing = store().orders.get(id);
  if (!existing) return null;
  const next = { ...existing, ...patch };
  store().orders.set(id, next);
  return next;
}

/* â”€â”€ Repair bookings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function createRepairBooking(
  input: Omit<RepairBooking, 'id' | 'reference' | 'createdAt' | 'estimatedFromPaise'>,
): RepairBooking {
  const service = input.serviceSlug
    ? repairServices.find((s) => s.slug === input.serviceSlug)
    : undefined;

  const booking: RepairBooking = {
    id: `rep_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    reference: generateReference('REP'),
    createdAt: new Date().toISOString(),
    name: sanitizeText(input.name, 80),
    phone: sanitizeText(input.phone, 20),
    email: input.email ? sanitizeText(input.email, 160) : undefined,
    brand: sanitizeText(input.brand, 40),
    model: sanitizeText(input.model, 80),
    problem: sanitizeText(input.problem, 600),
    serviceSlug: input.serviceSlug,
    preferredDate: input.preferredDate,
    preferredTime: sanitizeText(input.preferredTime, 40),
    dropoff: input.dropoff,
    notes: input.notes ? sanitizeText(input.notes, 500) : undefined,
    estimatedFromPaise: service?.startingPrice ?? 29900,
  };

  store().bookings.set(booking.id, booking);
  return booking;
}

/* â”€â”€ Sell-phone requests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export interface QuoteInput {
  brand: string;
  model: string;
  storage: string;
  condition: string;
  screen: string;
  battery: string;
  body: string;
  accessories: string[];
  hasOriginalBox: boolean;
  purchaseAge: string;
}

/**
 * Server-authoritative valuation. The client shows an estimate for instant
 * feedback; this is the number of record.
 */
export function quoteSellPhone(input: QuoteInput): SellQuote {
  const brand = sellBrands.find((b) => b.name === input.brand);
  const model = brand?.models.find((m) => m.name === input.model);
  const base = model?.base ?? 100000;

  return estimateResaleValue({
    baseValuePaise: base,
    storage: input.storage,
    condition: input.condition,
    screen: input.screen,
    battery: input.battery,
    body: input.body,
    accessories: input.accessories ?? [],
    hasOriginalBox: input.hasOriginalBox,
    purchaseAge: input.purchaseAge,
  });
}

export function createSellPhoneRequest(
  input: Omit<SellPhoneRequest, 'id' | 'reference' | 'createdAt' | 'estimatedValuePaise'>,
): SellPhoneRequest {
  // Re-derive the valuation on the server so a tampered client cannot inflate
  // or deflate the recorded quote.
  const quote = quoteSellPhone(input);

  const request: SellPhoneRequest = {
    id: `sell_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    reference: generateReference('SELL'),
    createdAt: new Date().toISOString(),
    brand: sanitizeText(input.brand, 40),
    model: sanitizeText(input.model, 80),
    storage: sanitizeText(input.storage, 20),
    condition: sanitizeText(input.condition, 40),
    screen: sanitizeText(input.screen, 40),
    battery: sanitizeText(input.battery, 40),
    body: sanitizeText(input.body, 40),
    accessories: (input.accessories ?? []).map((a) => sanitizeText(a, 40)),
    hasOriginalBox: Boolean(input.hasOriginalBox),
    purchaseAge: sanitizeText(input.purchaseAge, 10),
    estimatedValuePaise: quote.estimatedValuePaise,
    customerName: sanitizeText(input.customerName, 80),
    customerPhone: sanitizeText(input.customerPhone, 20),
    customerEmail: sanitizeText(input.customerEmail, 160),
    address: sanitizeText(input.address, 300),
    pickupDate: input.pickupDate,
    pickupTime: sanitizeText(input.pickupTime, 40),
    imageCount: Math.max(0, Math.min(12, input.imageCount ?? 0)),
    notes: input.notes ? sanitizeText(input.notes, 500) : undefined,
  };

  store().sellRequests.set(request.id, request);
  return request;
}

/* â”€â”€ Contact inquiries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function createContactInquiry(
  input: Omit<ContactInquiry, 'id' | 'createdAt'>,
): ContactInquiry {
  const inquiry: ContactInquiry = {
    id: `inq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    name: sanitizeText(input.name, 80),
    phone: sanitizeText(input.phone, 20),
    email: sanitizeText(input.email, 160),
    subject: sanitizeText(input.subject, 120),
    message: sanitizeText(input.message, 1500),
  };
  store().inquiries.set(inquiry.id, inquiry);
  return inquiry;
}
