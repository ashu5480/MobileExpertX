import { Inbox, Package, Receipt, Users, Wrench, TrendingUp } from 'lucide-react';
import { requireAdmin } from '@/lib/guards';
import { adminStats, listQueue } from '@/lib/adminService';
import { formatPrice } from '@/lib/utils';
import { QueueTable } from '@/components/admin/QueueTable';

export const dynamic = 'force-dynamic';

/** Admin home — counts plus the two queues that need action today. */
export default async function AdminDashboard() {
  // The guard runs first and on its own: these counts and queues are customer
  // data, so nothing should be read until the admin check has passed.
  await requireAdmin();
  const [stats, sellQueue, bookingQueue] = await Promise.all([
    adminStats(),
    listQueue('sellRequests', 1, 5),
    listQueue('bookings', 1, 5),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-ink-600">
        Everything the shop has received, newest first.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={TrendingUp} label="Order value" value={formatPrice(stats.revenuePaise)} />
        <Card icon={Receipt} label="Orders" value={String(stats.orders)} />
        <Card icon={Inbox} label="Trade-in requests" value={String(stats.sellRequests)} />
        <Card icon={Wrench} label="Repair bookings" value={String(stats.bookings)} />
        <Card icon={Package} label="Items listed" value={String(stats.listings)} />
        <Card
          icon={Package}
          label="Active listings"
          value={String(stats.activeListings)}
        />
        <Card icon={Users} label="Customers" value={String(stats.customers)} />
        <Card icon={Inbox} label="Enquiries" value={String(stats.inquiries)} />
      </div>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="text-lg font-bold text-ink-900">Latest trade-in requests</h2>
          <div className="mt-3">
            <QueueTable queue="sellRequests" rows={sellQueue.items} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink-900">Latest repair bookings</h2>
          <div className="mt-3">
            <QueueTable queue="bookings" rows={bookingQueue.items} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-soft">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 font-display text-2xl font-extrabold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}
