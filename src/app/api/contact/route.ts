import { NextResponse } from 'next/server';
import { contactSchema, fieldErrors } from '@/lib/validation';
import { createContactInquiry } from '@/services/repository';
import { siteConfig } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/contact — records a contact inquiry after server-side validation. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please correct the highlighted fields.', fieldErrors: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const inquiry = createContactInquiry(parsed.data);

  return NextResponse.json(
    {
      inquiry,
      message: `Thanks ${inquiry.name.split(' ')[0]}, we have your message. Expect a reply within one working day, or call us on ${siteConfig.contact.phoneDisplay}.`,
    },
    { status: 201 },
  );
}
