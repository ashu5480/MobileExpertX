import { NextResponse } from 'next/server';
import { verifyPaymentSchema } from '@/lib/validation';
import { verify } from '@/services/paymentService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/verify
 *
 * The ONLY place an order can become "paid". The client posts what it believes
 * happened; this handler asks the gateway using the server-held secret, checks
 * the signature and the captured amount, and only then updates the order.
 * A client-side success message alone is never trusted.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid verification payload.' }, { status: 422 });
  }

  const { orderId, provider, paymentReference, signature } = parsed.data;

  try {
    const result = await verify(orderId, provider, paymentReference, signature);

    if (!result.verified) {
      return NextResponse.json(
        { verified: false, order: result.order, message: result.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      verified: true,
      order: result.order,
      message: result.message,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Payment verification failed.';
    return NextResponse.json({ verified: false, message }, { status: 502 });
  }
}
