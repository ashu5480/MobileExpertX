'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Pencil, Trash2, Plus } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import type { Listing } from '@/lib/listing-shared';

/**
 * The customer's own items, one page at a time.
 *
 * `totalPages` comes from the server as a COUNT, so the pager shows exactly
 * as many links as there are pages of 10 -- adding a tenth item creates a
 * second page, and nothing beyond the current page is ever fetched.
 */

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sold: 'bg-amber-50 text-amber-700 border-amber-200',
  hidden: 'bg-surface-100 text-ink-600 border-surface-300',
};

export function ListingList({
  items,
  page,
  totalPages,
  total,
}: {
  items: Listing[];
  page: number;
  totalPages: number;
  total: number;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function remove(id: string) {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    setBusyId(id);
    try {
      await fetch(`/api/listings/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-surface-300 bg-white p-12 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface-100 text-ink-400">
          <Package className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-ink-900">No items yet</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-600">
          List a phone or accessory you want to sell. Add photos and a clear
          description — honest listings sell faster.
        </p>
        <ButtonLink href="/account/items/new" variant="primary" className="mt-5">
          <Plus className="h-4 w-4" aria-hidden="true" />
          List your first item
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-4 rounded-3xl border border-surface-200 bg-white p-4 shadow-soft"
          >
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-surface-100">
              {item.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photos[0]}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-7 w-7 text-ink-300" aria-hidden="true" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-sm font-bold text-ink-900">{item.title}</h3>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    STATUS_STYLES[item.status] ?? STATUS_STYLES.hidden
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <p className="mt-1 text-sm font-bold text-brand-600">
                {formatPrice(item.pricePaise)}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-ink-500">{item.description}</p>

              <div className="mt-3 flex items-center gap-2">
                <ButtonLink
                  href={`/account/items/${item.id}/edit`}
                  variant="outline"
                  size="sm"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </ButtonLink>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(item.id)}
                  disabled={busyId === item.id}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <nav
        className="flex items-center justify-between border-t border-surface-200 pt-4"
        aria-label="Pagination"
      >
        <p className="text-sm text-ink-600">
          Page {page} of {totalPages} · {total} item{total === 1 ? '' : 's'}
        </p>

        <div className="flex gap-2">
          {page > 1 && (
            <ButtonLink href={`/account/items?page=${page - 1}`} variant="outline" size="sm">
              Previous
            </ButtonLink>
          )}
          {page < totalPages && (
            <ButtonLink href={`/account/items?page=${page + 1}`} variant="outline" size="sm">
              Next
            </ButtonLink>
          )}
        </div>
      </nav>

      <p className="text-center text-sm">
        <Link
          href="/account/items/new"
          className="font-semibold text-brand-600 underline-offset-2 hover:underline"
        >
          + List another item
        </Link>
      </p>
    </div>
  );
}
