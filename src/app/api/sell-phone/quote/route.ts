import { NextResponse } from 'next/server';
import { sellPhoneSchema, fieldErrors } from '@/lib/validation';
import { quoteSellPhone } from '@/services/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/sell-phone/quote
 *
 * Server-authoritative instant valuation. The wizard shows an optimistic
 * estimate as the visitor answers questions; this endpoint is the figure of
 * record and is what gets written to the sell-phone request.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = sellPhoneSchema
    .pick({
      brand: true,
      model: true,
      storage: true,
      condition: true,
      screen: true,
      battery: true,
      body: true,
      accessories: true,
      hasOriginalBox: true,
      purchaseAge: true,
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please correct the highlighted fields.', fieldErrors: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const quote = quoteSellPhone(parsed.data);
  return NextResponse.json({ quote });
}
