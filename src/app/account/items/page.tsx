import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, Plus } from 'lucide-react';
import { requireUser } from '@/lib/guards';
import { listForUser } from '@/lib/listings';
import { ListingList } from '@/components/account/ListingList';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'My Items',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 10;

/**
 * The customer's listings, ten per page.
 *
 * The page count is a real `COUNT(*)` from SQLite, so it is always exactly
 * right — 10 items shows one page, the 11th creates a second.
 */
export default async function MyItemsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const user = requireUser('/account/items');
  const page = Math.max(1, Number(searchParams.page ?? '1') || 1);
  const result = listForUser(user.id, page, PAGE_SIZE);

  return (
    <main className="section bg-surface-50">
      <div className="container">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-brand-600"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Account
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
              My items
            </h1>
            <p className="mt-1.5 text-sm text-ink-600">
              Everything you have listed. Edit or remove any of it at any time.
            </p>
          </div>
          <ButtonLink href="/account/items/new" variant="primary" icon={Plus}>
            List an item
          </ButtonLink>
        </div>

        <div className="mt-8">
          <ListingList
            items={result.items}
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
          />
        </div>
      </div>
    </main>
  );
}
