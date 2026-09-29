/**
 * Typed browser-side API client.
 *
 * Every mutation in the app (orders, payments, repair bookings, sell-phone
 * requests, contact inquiries) goes through this module, so swapping the
 * backend means editing one file. It intentionally mirrors the Next.js route
 * handlers in `src/app/api/*`, but nothing here imports server secrets.
 */

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
      // Never cache mutations.
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(
      'We could not reach the server. Please check your connection and try again.',
      0,
    );
  }

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const payload = (body ?? {}) as {
      error?: string;
      message?: string;
      fieldErrors?: Record<string, string>;
    };
    throw new ApiError(
      payload.error ?? payload.message ?? `Request failed (${res.status}).`,
      res.status,
      payload.fieldErrors ?? {},
    );
  }

  return body as T;
}

const post = <T,>(path: string, data: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(data) });

const get = <T,>(path: string) => request<T>(path, { method: 'GET' });

/* ── Orders ─────────────────────────────────────────────────────────────── */

export interface CreateOrderPayload {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  deliveryMethod: 'standard' | 'express' | 'pickup';
  lines: Array<{ productId: string; variantKey: string; quantity: number }>;
  couponCode?: string | null;
  claimedSubtotalPaise?: number;
}

export interface CreateOrderResponse {
  order: import('@/types').Order;
  /** Public, browser-safe gateway configuration. */
  payment: PaymentConfig;
}

export const ordersApi = {
  create: (payload: CreateOrderPayload) => post<CreateOrderResponse>('/api/orders', payload),
  get: (orderNumber: string) =>
    get<{ order: import('@/types').Order }>(
      `/api/orders?orderNumber=${encodeURIComponent(orderNumber)}`,
    ),
};

/* ── Payments ───────────────────────────────────────────────────────────── */

export type PaymentProvider = 'razorpay' | 'stripe' | 'mock';

export interface PaymentConfig {
  provider: PaymentProvider;
  /** 'mock' means no real charge happens — test mode only. */
  isLive: boolean;
  currency: string;
  /** Public key / client token. Never a secret. */
  razorpayKeyId?: string;
  stripePublishableKey?: string;
  /** Amount the server expects, in paise. */
  expectedAmountPaise: number;
  orderId: string;
  orderNumber: string;
}

export const paymentsApi = {
  /** Creates (or re-uses) an order intent on the gateway. */
  createIntent: (orderId: string) =>
    post<{ payment: PaymentConfig }>('/api/payments/create-intent', { orderId }),
  /**
   * Server-side verification. The client NEVER decides that a payment
   * succeeded — the gateway response is checked here first.
   */
  verify: (payload: {
    orderId: string;
    provider: PaymentProvider;
    paymentReference: string;
    signature?: string;
  }) =>
    post<{
      verified: boolean;
      order: import('@/types').Order;
      message: string;
    }>('/api/payments/verify', payload),
};

/* ── Repair bookings ────────────────────────────────────────────────────── */

export type RepairBookingPayload = Omit<
  import('@/types').RepairBooking,
  'id' | 'reference' | 'createdAt' | 'estimatedFromPaise'
>;

export const repairsApi = {
  book: (payload: RepairBookingPayload) =>
    post<{ booking: import('@/types').RepairBooking; message: string }>(
      '/api/repairs',
      payload,
    ),
};

/* ── Sell-phone requests ────────────────────────────────────────────────── */

export type SellPhonePayload = Omit<
  import('@/types').SellPhoneRequest,
  'id' | 'reference' | 'createdAt' | 'estimatedValuePaise'
>;

export const sellPhoneApi = {
  submit: (payload: SellPhonePayload) =>
    post<{ request: import('@/types').SellPhoneRequest; message: string }>(
      '/api/sell-phone',
      payload,
    ),
  /** Server-authoritative re-quote — never trust the client estimate. */
  quote: (payload: Omit<SellPhonePayload, 'customerName' | 'customerPhone' | 'customerEmail' | 'address' | 'pickupDate' | 'pickupTime' | 'imageCount' | 'notes'>) =>
    post<{ quote: import('@/lib/pricing').SellQuote }>('/api/sell-phone/quote', payload),
};

/* ── Contact ────────────────────────────────────────────────────────────── */

export type ContactPayload = Omit<import('@/types').ContactInquiry, 'id' | 'createdAt'>;

export const contactApi = {
  submit: (payload: ContactPayload) =>
    post<{ inquiry: import('@/types').ContactInquiry; message: string }>('/api/contact', payload),
};
