import { NextResponse } from 'next/server';
import { createOrderSchema, fieldErrors } from '@/lib/validation';
import { createOrder, getOrderByNumber } from '@/services/repository';
import { publicConfigFor } from '@/services/paymentService';
import { apiUser } from '@/lib/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/orders
 * Creates a pending order from validated checkout input. Prices, stock and
 * discounts are recomputed server-side; the client's claimed total is ignored.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please correct the highlighted fields.', fieldErrors: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  try {
    // Guests may still check out; when someone is signed in the order is
    // stamped with their account so it appears under "My orders". Never
    // required — a missing session is not an error here.
    const user = await apiUser();
    const order = await createOrder(parsed.data, user?.id ?? null);
    return NextResponse.json(
      { order, payment: publicConfigFor(order) },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'We could not create your order.';
    return NextResponse.json({ error: message }, { status: 409 });
  }
}

/** GET /api/orders?orderNumber=MEX… — read-only order lookup. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('orderNumber');

  if (!orderNumber || !/^MEX[A-Z0-9]{6,20}$/i.test(orderNumber)) {
    return NextResponse.json({ error: 'A valid order number is required.' }, { status: 400 });
  }

  const order = await getOrderByNumber(orderNumber.toUpperCase());
  if (!order) {
    return NextResponse.json({ error: 'We could not find that order.' }, { status: 404 });
  }

  return NextResponse.json({ order });
}
