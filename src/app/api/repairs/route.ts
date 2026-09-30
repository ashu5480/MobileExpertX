import { NextResponse } from 'next/server';
import { repairBookingSchema, fieldErrors } from '@/lib/validation';
import { createRepairBooking } from '@/services/repository';
import { listRepairServices } from '@/services/catalogService';
import { siteConfig } from '@/lib/config';
import { apiUser } from '@/lib/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/repairs — the service list.
 *
 * Public on purpose: the repair picker on /repair needs name, starting price,
 * turnaround and warranty for every service before anything is booked.
 */
export async function GET() {
  const services = await listRepairServices();
  return NextResponse.json({ services });
}

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

  // Guests can book a repair too; stamp the account when there is one.
  const user = await apiUser();
  const booking = await createRepairBooking(parsed.data, user?.id ?? null);

  return NextResponse.json(
    {
      booking,
      message: `Your repair slot on ${booking.preferredDate} is reserved. Our technician will call ${siteConfig.contact.phoneDisplay} to confirm.`,
    },
    { status: 201 },
  );
}
