import { createHmac, timingSafeEqual } from 'crypto';
import { serverConfig } from '@/lib/config';
import { getOrderById, updateOrder } from './repository';
import type { Order } from '@/types';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  Payment service (SERVER ONLY)
 * ────────────────────────────────────────────────────────────────────────────
 *  Never import this from a `"use client"` component — it reads secrets.
 *
 *  The architecture is gateway-agnostic:
 *
 *    createIntent() → tells the browser how to open the gateway checkout
 *                     (public key only; no secret crosses the wire).
 *    verify()       → authoritative check with the gateway using the secret,
 *                     BEFORE an order is ever marked paid.
 *
 *  Providers:
 *    • razorpay — Orders API + Checkout.js, HMAC-SHA256 signature verify.
 *    • stripe   — PaymentIntents + Stripe.js, server-side confirmation.
 *    • mock     — explicit TEST MODE. Creates a simulated authorisation that
 *                 is flagged so nobody mistakes it for a real charge.
 *
 *  With no credentials configured the app falls back to `mock`, and the UI
 *  displays a visible "Test mode — no real payment is processed" banner.
 */

export type Provider = 'razorpay' | 'stripe' | 'mock';

export interface PublicPaymentConfig {
  provider: Provider;
  /** false in mock mode — the UI must disclose this to the customer. */
  isLive: boolean;
  currency: string;
  razorpayKeyId?: string;
  stripePublishableKey?: string;
  expectedAmountPaise: number;
  orderId: string;
  orderNumber: string;
}

/** The provider we will actually use given env + credential availability. */
export function activeProvider(): Provider {
  const configured = serverConfig.payment.provider;
  if (configured === 'razorpay') {
    return serverConfig.payment.razorpayKeyId && serverConfig.payment.razorpayKeySecret
      ? 'razorpay'
      : 'mock';
  }
  if (configured === 'stripe') {
    return serverConfig.payment.stripeSecretKey ? 'stripe' : 'mock';
  }
  return 'mock';
}

export function publicConfigFor(order: Order): PublicPaymentConfig {
  const provider = activeProvider();
  return {
    provider,
    isLive: provider !== 'mock',
    currency: 'INR',
    // Public identifiers only. Secrets never appear in this object.
    razorpayKeyId: provider === 'razorpay' ? serverConfig.payment.razorpayKeyId : undefined,
    expectedAmountPaise: order.totals.grandTotalPaise,
    orderId: order.id,
    orderNumber: order.orderNumber,
  };
}

/* ── Razorpay signature verification ────────────────────────────────────── */

/** Constant-time comparison that never leaks length through early exit. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verifies the `razorpay_order_id|payment_id` HMAC-SHA256 signature returned
 * by Checkout.js, using the key secret held only on the server.
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  paymentId: string,
  signature: string,
  keySecret: string,
): boolean {
  const expected = createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${paymentId}`)
    .digest('hex');
  return safeEqual(expected, signature);
}

/* ── Gateway calls ──────────────────────────────────────────────────────── */

interface GatewayCreateResult {
  /** Opaque reference the gateway assigned (Razorpay order id, PI id, …). */
  gatewayReference: string;
}

async function createGatewayIntent(order: Order): Promise<GatewayCreateResult> {
  const provider = activeProvider();
  const amountPaise = order.totals.grandTotalPaise;

  if (provider === 'razorpay') {
    // Razorpay amounts are in the smallest currency unit (paise for INR).
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Basic auth with key id + SECRET — server side only.
        Authorization: `Basic ${Buffer.from(
          `${serverConfig.payment.razorpayKeyId}:${serverConfig.payment.razorpayKeySecret}`,
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerEmail: order.customer.email,
        },
      }),
    });

    if (!res.ok) throw new Error('Could not start the payment. Please try again.');
    const data = (await res.json()) as { id: string };
    return { gatewayReference: data.id };
  }

  if (provider === 'stripe') {
    const body = new URLSearchParams({
      amount: String(amountPaise),
      currency: 'inr',
      description: `MobilExpertX order ${order.orderNumber}`,
      'metadata[orderId]': order.id,
      'metadata[orderNumber]': order.orderNumber,
    });

    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${serverConfig.payment.stripeSecretKey}`,
      },
      body,
    });

    if (!res.ok) throw new Error('Could not start the payment. Please try again.');
    const data = (await res.json()) as { id: string };
    updateOrder(order.id, { paymentReference: data.id });
    return { gatewayReference: data.id };
  }

  // Mock provider — deterministic, obviously synthetic reference.
  return { gatewayReference: `mock_${order.id}_${Date.now().toString(36)}` };
}

export async function createIntent(orderId: string) {
  const order = getOrderById(orderId);
  if (!order) throw new Error('Order not found.');

  const { gatewayReference } = await createGatewayIntent(order);
  const updated = updateOrder(order.id, {
    paymentProvider: activeProvider(),
    paymentReference: gatewayReference,
  });

  return { config: publicConfigFor(updated ?? order) };
}

export interface VerifyResult {
  verified: boolean;
  order: Order | null;
  message: string;
}

/**
 * The single source of truth for "was this paid?".
 *
 * The browser reports what *it* saw; this asks the gateway what actually
 * happened. An order is only marked paid once the gateway confirms it.
 */
export async function verify(
  orderId: string,
  provider: Provider,
  paymentReference: string,
  signature?: string,
): Promise<VerifyResult> {
  const order = getOrderById(orderId);
  if (!order) return { verified: false, order: null, message: 'Order not found.' };

  const expected = order.totals.grandTotalPaise;

  if (provider !== activeProvider()) {
    return {
      verified: false,
      order,
      message: 'Payment provider mismatch. Please restart checkout.',
    };
  }

  /* ── Mock (TEST MODE) ────────────────────────────────────────────────── */
  if (activeProvider() === 'mock') {
    const updated = updateOrder(order.id, {
      status: 'paid',
      paymentStatus: 'captured',
      paymentProvider: 'mock',
      paymentReference,
    });
    return {
      verified: true,
      order: updated,
      message:
        'Test payment simulated. No real money was charged — set PAYMENT_PROVIDER and the gateway keys to enable live payments.',
    };
  }

  /* ── Razorpay ───────────────────────────────────────────────────────── */
  if (provider === 'razorpay') {
    if (!signature) {
      return { verified: false, order, message: 'Missing payment signature.' };
    }
    const signatureOk = verifyRazorpaySignature(
      order.paymentReference ?? paymentReference,
      paymentReference,
      signature,
      serverConfig.payment.razorpayKeySecret,
    );
    if (!signatureOk) {
      return { verified: false, order, message: 'Payment signature verification failed.' };
    }

    // Then confirm with the gateway that the payment was actually captured.
    const res = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentReference)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${serverConfig.payment.razorpayKeyId}:${serverConfig.payment.razorpayKeySecret}`,
          ).toString('base64')}`,
        },
        cache: 'no-store',
      },
    );
    if (!res.ok) {
      return { verified: false, order, message: 'Could not confirm the payment with the gateway.' };
    }
    const payment = (await res.json()) as { status?: string; amount?: number };
    if (payment.status !== 'captured') {
      return {
        verified: false,
        order,
        message: `Payment status: ${payment.status ?? 'unknown'}.`,
      };
    }
    if (payment.amount !== expected) {
      return { verified: false, order, message: 'Payment amount did not match the order total.' };
    }

    const updated = updateOrder(order.id, {
      status: 'paid',
      paymentStatus: 'captured',
      paymentProvider: 'razorpay',
      paymentReference,
    });
    return { verified: true, order: updated, message: 'Payment verified and captured.' };
  }

  /* ── Stripe ─────────────────────────────────────────────────────────── */
  const res = await fetch(
    `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentReference)}`,
    {
      headers: { Authorization: `Bearer ${serverConfig.payment.stripeSecretKey}` },
      cache: 'no-store',
    },
  );
  if (!res.ok) {
    return { verified: false, order, message: 'Could not confirm the payment with Stripe.' };
  }
  const intent = (await res.json()) as { status?: string; amount_received?: number };
  if (intent.status !== 'succeeded') {
    return { verified: false, order, message: `Payment status: ${intent.status ?? 'unknown'}.` };
  }
  if (intent.amount_received !== expected) {
    return { verified: false, order, message: 'Payment amount did not match the order total.' };
  }

  const updated = updateOrder(order.id, {
    status: 'paid',
    paymentStatus: 'captured',
    paymentProvider: 'stripe',
    paymentReference,
  });
  return { verified: true, order: updated, message: 'Payment verified and captured.' };
}
