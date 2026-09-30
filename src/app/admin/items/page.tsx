import Link from 'next/link';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { requireAdmin } from '@/lib/guards';
import { listAll } from '@/lib/listings';
import { formatPrice } from '@/lib/utils';
import { ListingStatusControl } from '@/components/admin/ListingStatusControl';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

/** Every listing from every customer, with owner details attached. */
export default async function AdminItemsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  await requireAdmin();

  const page = Math.max(1, Number(searchParams.page ?? '1') || 1);
  const result = await listAll(page, PAGE_SIZE);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
        All items
      </h1>
      <p className="mt-1 text-sm text-ink-600">
        Every item listed by a customer. Mark them sold or hidden as needed.
      </p>

      {result.items.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-surface-300 bg-white p-10 text-center text-sm text-ink-500">
          No customer has listed anything yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-surface-200 bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-200 text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold">Seller</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {result.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-100">
                        {item.photos[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.photos[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-5 w-5 text-ink-300" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink-900">{item.title}</p>
                        <p className="line-clamp-1 text-xs text-ink-500">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-800">{item.ownerName}</p>
                    <p className="text-xs text-ink-500">{item.ownerEmail}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink-800">
                    {formatPrice(item.pricePaise)}
                  </td>
                  <td className="px-4 py-3">
                    <ListingStatusControl id={item.id} status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-between" aria-label="Pagination">
          {page > 1 ? (
            <Link
              href={`/admin/items?page=${page - 1}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-semibold text-ink-800"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
            </Link>
          ) : (
            <span />
          )}

          <p className="text-sm text-ink-600">
            Page {result.page} of {result.totalPages} · {result.total} items
          </p>

          {page < result.totalPages && (
            <Link
              href={`/admin/items?page=${page + 1}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-semibold text-ink-800"
            >
              Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
