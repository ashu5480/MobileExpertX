import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { requireUser } from '@/lib/guards';
import { getOwned } from '@/lib/listings';
import { ListingForm } from '@/components/account/ListingForm';

export const metadata: Metadata = {
  title: 'Edit Item',
  robots: { index: false, follow: false },
};

export default async function EditListingPage({
  params,
}: {
  params: { id: string };
}) {
  const user = requireUser(`/account/items/${params.id}/edit`);
  const listing = getOwned(user.id, params.id);

  // Scoped by owner, so another customer's id is a 404 rather than a 403 --
  // a 403 would confirm the row exists.
  if (!listing) notFound();

  return (
    <main className="section bg-surface-50">
      <div className="container max-w-3xl">
        <Link
          href="/account/items"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-brand-600"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> My items
        </Link>

        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink-900">
          Edit item
        </h1>
        <p className="mt-1.5 text-sm text-ink-600">{listing.title}</p>

        <div className="mt-8">
          <ListingForm listing={listing} />
        </div>
      </div>
    </main>
  );
}
