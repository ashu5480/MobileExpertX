import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { requireUser } from '@/lib/guards';
import { ListingForm } from '@/components/account/ListingForm';

export const metadata: Metadata = {
  title: 'List an Item',
  robots: { index: false, follow: false },
};

export default async function NewListingPage() {
  await requireUser('/account/items/new');

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
          List an item
        </h1>
        <p className="mt-1.5 text-sm text-ink-600">
          Clear photos and an honest description get the most interest. You can
          edit or delete this listing whenever you like.
        </p>

        <div className="mt-8">
          <ListingForm />
        </div>
      </div>
    </main>
  );
}
