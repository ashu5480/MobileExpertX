import { generateOrderNumber, generateReference, sanitizeText } from '@/lib/utils';
import { bookings, inquiries, now, orders, sellRequests } from '@/lib/mongo';
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

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  In-memory caches -- OPTIMISATION ONLY, never the source of truth
 * ────────────────────────────────────────────────────────────────────────────
 *  These Maps used to be the primary store, with a SQLite write-through as a
 *  best-effort backup. That is fatal on Vercel: a serverless instance is
 *  destroyed between invocations, so an order written to a Map is simply gone
 *  before the customer ever sees the confirmation page.
 *
 *  MongoDB is now the ONLY store. A read still consults this cache first
 *  because `createOrder` needs the freshly built document back immediately,
 *  but every cache miss falls through to the database and every write goes to
 *  MongoDB first. Deleting the Maps would change nothing observable; they only
 *  save a round trip inside a single warm invocation.
 */
function store(): GlobalStore {
  const g = globalThis as typeof globalThis & { __mexStore?: GlobalStore };
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


/* - Persistence - */

type PersistTable = 'orders' | 'bookings' | 'sell_requests' | 'inquiries';

interface PersistInput {
  id: string;
  orderNumber?: string;
  reference?: string;
  totalPaise?: number;
  quotedPaise?: number;
  payload: Record<string, unknown>;
}

/**
 * Writes the record to MongoDB.
 *
 * This used to be a best-effort SQLite mirror wrapped in a try/catch that
 * swallowed failures, because the in-memory Map was the real store. It is now
 * the authoritative write, so it is NOT swallowed: if MongoDB rejects the
 * write the caller must find out, otherwise the customer gets a confirmation
 * for an order that was never recorded.
 *
 * `upsert` preserves the old `ON CONFLICT ... DO UPDATE` behaviour, keyed on
 * the human-facing reference (`orderNumber` for orders, `reference` for the
 * rest).
 */
async function persist(table: PersistTable, input: PersistInput): Promise<void> {
  const ts = now();

  if (table === 'orders') {
    await (await orders()).updateOne(
      { reference: input.orderNumber ?? input.id },
      {
        $set: { payload: input.payload, totalPaise: input.totalPaise ?? 0, updatedAt: ts },
        $setOnInsert: {
          _id: input.id,
          reference: input.orderNumber ?? input.id,
          status: 'pending',
          createdAt: ts,
        },
      },
      { upsert: true },
    );
    return;
  }

  if (table === 'inquiries') {
    // Enquiries have no reference of their own and are never re-submitted, so
    // a plain insert is correct here.
    await (await inquiries()).insertOne({
      _id: input.id,
      reference: input.id,
      payload: input.payload,
      status: 'new',
      createdAt: ts,
      updatedAt: ts,
    });
    return;
  }

  const collection = table === 'bookings' ? await bookings() : await sellRequests();

  await collection.updateOne(
    { reference: input.reference ?? input.id },
    {
      $set: {
        payload: input.payload,
        ...(table === 'sell_requests' ? { quotedPaise: input.quotedPaise ?? 0 } : {}),
        updatedAt: ts,
      },
      $setOnInsert: {
        _id: input.id,
        reference: input.reference ?? input.id,
        status: 'pending',
        createdAt: ts,
      },
    },
    { upsert: true },
  );
}


/* - Orders - */

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
 * catalogue ' the client only says which product and variant it wants.
 */
export async function createOrder(args: CreateOrderArgs): Promise<Order> {
  const lines: OrderLine[] = [];
  const problems: string[] = [];
  const accessories = new Map(seedAccessories.map((a) => [accessoryId(a.id), a]));

  for (const line of args.lines) {
    // - Accessory line -
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

    // - Phone line -
    const product = await getProductById(line.productId);
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

  // MongoDB first, then the cache. If the database write fails the error
  // propagates, so the customer never sees a confirmation for an order that
  // was not actually recorded.
  await persist('orders', {
    id: order.id,
    orderNumber: order.orderNumber,
    totalPaise: order.totals?.grandTotalPaise ?? 0,
    payload: order as unknown as Record<string, unknown>,
  });
  store().orders.set(order.id, order);
  return order;
}

/**
 * Reads an order, preferring the warm cache and falling back to MongoDB.
 *
 * The fallback is what makes this correct on Vercel: a follow-up request
 * (payment verification, order lookup) usually lands on a *different*
 * serverless instance with an empty cache, and the old code would have
 * reported "Order not found" for an order the customer had just placed.
 */
export async function getOrderById(id: string): Promise<Order | null> {
  const cached = store().orders.get(id);
  if (cached) return cached;

  const doc = await (await orders()).findOne({ _id: id });
  if (!doc) return null;
  return doc.payload as unknown as Order;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  for (const order of store().orders.values()) {
    if (order.orderNumber === orderNumber) return order;
  }

  const doc = await (await orders()).findOne({ reference: orderNumber });
  if (!doc) return null;
  return doc.payload as unknown as Order;
}

export async function updateOrder(id: string, patch: Partial<Order>): Promise<Order | null> {
  const existing = await getOrderById(id);
  if (!existing) return null;

  const next = { ...existing, ...patch };

  // The order lives in two places inside the document: the `payload` the
  // storefront reads back, and the top-level `status` / `totalPaise` the admin
  // dashboard aggregates over. Both must move together or the queue would
  // disagree with the order itself.
  //
  // `totalPaise` is a denormalised copy of `totals.grandTotalPaise` so the
  // dashboard can `$sum` it without decomposing every order.
  const totalPaise = next.totals?.grandTotalPaise ?? 0;
  await (await orders()).updateOne(
    { _id: id },
    { $set: { payload: next, totalPaise, updatedAt: now(), ...(patch.status !== undefined ? { status: patch.status } : {}) } },
  );

  store().orders.set(id, next);
  return next;
}


/* - Repair bookings - */

export async function createRepairBooking(
  input: Omit<RepairBooking, 'id' | 'reference' | 'createdAt' | 'estimatedFromPaise'>,
): Promise<RepairBooking> {
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

  await persist('bookings', {
    id: booking.id,
    reference: booking.reference,
    payload: booking as unknown as Record<string, unknown>,
  });
  store().bookings.set(booking.id, booking);
  return booking;
}

/* - Sell-phone requests - */

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

export async function createSellPhoneRequest(
  input: Omit<SellPhoneRequest, 'id' | 'reference' | 'createdAt' | 'estimatedValuePaise'>,
): Promise<SellPhoneRequest> {
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

  await persist('sell_requests', {
    id: request.id,
    reference: request.reference,
    quotedPaise: request.estimatedValuePaise,
    payload: request as unknown as Record<string, unknown>,
  });
  store().sellRequests.set(request.id, request);
  return request;
}

/* - Contact inquiries - */

export async function createContactInquiry(
  input: Omit<ContactInquiry, 'id' | 'createdAt'>,
): Promise<ContactInquiry> {
  const inquiry: ContactInquiry = {
    id: `inq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    name: sanitizeText(input.name, 80),
    phone: sanitizeText(input.phone, 20),
    email: sanitizeText(input.email, 160),
    subject: sanitizeText(input.subject, 120),
    message: sanitizeText(input.message, 1500),
  };
  await persist('inquiries', {
    id: inquiry.id,
    payload: inquiry as unknown as Record<string, unknown>,
  });
  store().inquiries.set(inquiry.id, inquiry);
  return inquiry;
}
