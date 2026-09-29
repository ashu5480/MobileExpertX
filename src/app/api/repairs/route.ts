import { NextResponse } from 'next/server';
import { repairBookingSchema, fieldErrors } from '@/lib/validation';
import { createRepairBooking } from '@/services/repository';
import { siteConfig } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/repairs — validates and records a repair booking. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = repairBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please correct the highlighted fields.', fieldErrors: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const booking = createRepairBooking(parsed.data);

  return NextResponse.json(
    {
      booking,
      message: `Your repair slot on ${booking.preferredDate} is reserved. Our technician will call ${siteConfig.contact.phoneDisplay} to confirm.`,
    },
    { status: 201 },
  );
}
