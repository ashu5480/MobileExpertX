import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { requireAdmin } from '@/lib/guards';
import { listQueue, type QueueName } from '@/lib/adminService';
import { QueueTable } from '@/components/admin/QueueTable';

export const dynamic = 'force-dynamic';

const CONFIG: Record<QueueName, { title: string; blurb: string }> = {
  orders: {
    title: 'Orders',
    blurb: 'Move each order through payment, shipping and delivery.',
  },
  bookings: {
    title: 'Repair bookings',
    blurb: 'Confirm the slot, then mark the repair in progress and ready.',
  },
  sellRequests: {
    title: 'Trade-in requests',
    blurb: 'Quote each device, then accept or decline.',
  },
  inquiries: {
    title: 'Enquiries',
    blurb: 'Messages sent through the contact form.',
  },
};

/** One page serves all four queues — they only differ by status vocabulary. */
export default async function AdminQueuePage({
  params,
  searchParams,
}: {
  params: { queue: string };
  searchParams: { page?: string };
}) {
  await requireAdmin();

  const queue = params.queue as QueueName;
  if (!(queue in CONFIG)) notFound();

  const page = Math.max(1, Number(searchParams.page ?? '1') || 1);
  const result = await listQueue(queue, page, 20);
  const copy = CONFIG[queue];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
        {copy.title}
      </h1>
      <p className="mt-1 text-sm text-ink-600">{copy.blurb}</p>

      <div className="mt-6">
        <QueueTable queue={queue} rows={result.items} />
      </div>

      {result.totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-between" aria-label="Pagination">
          {page > 1 ? (
            <Link
              href={`/admin/${params.queue}?page=${page - 1}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-300 bg-white px-4 py-2 text-sm font-semibold text-ink-800"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
            </Link>
          ) : (
            <span />
          )}

          <p className="text-sm text-ink-600">
            Page {result.page} of {result.totalPages}
          </p>

          {page < result.totalPages && (
            <Link
              href={`/admin/${params.queue}?page=${page + 1}`}
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
