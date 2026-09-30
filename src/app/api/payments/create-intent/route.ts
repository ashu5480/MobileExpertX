import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createIntent } from '@/services/paymentService';
import { getOrderById } from '@/services/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  orderId: z.string().trim().min(1).max(64),
});

/**
 * POST /api/payments/create-intent
 * Creates (or re-uses) the gateway order and returns ONLY public, browser-safe
 * configuration. Secrets are read server-side and never serialised here.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid orderId is required.' }, { status: 422 });
  }

  const order = await getOrderById(parsed.data.orderId);
  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }
  if (order.status === 'paid') {
    return NextResponse.json(
      { error: 'This order has already been paid.' },
      { status: 409 },
    );
  }

  try {
    const { config } = await createIntent(order.id);
    return NextResponse.json({ payment: config });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not start the payment.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
