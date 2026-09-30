import { NextResponse } from 'next/server';
import { sellPhoneSchema, fieldErrors } from '@/lib/validation';
import { createSellPhoneRequest } from '@/services/repository';
import { siteConfig } from '@/lib/config';
import { apiUser } from '@/lib/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/sell-phone
 * Records a trade-in request. The valuation is recomputed server-side by the
 * repository from the model matrix, so a tampered client cannot inflate or
 * deflate the recorded quote.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = sellPhoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please correct the highlighted fields.', fieldErrors: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  // `estimatedValuePaise` arrives from the client for optimistic UI, but the
  // repository ignores it and derives its own figure. Guests can send a phone
  // in too; the account is stamped only when someone is signed in.
  const user = await apiUser();
  const record = await createSellPhoneRequest(parsed.data, user?.id ?? null);

  return NextResponse.json(
    {
      request: record,
      message: `Request ${record.reference} received. Our team will call ${siteConfig.contact.phoneDisplay} to confirm your pickup slot and final quote.`,
    },
    { status: 201 },
  );
}
