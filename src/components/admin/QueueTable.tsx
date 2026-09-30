'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { readPayload, QUEUE_STATUSES, type QueueName, type QueueRow } from '@/lib/admin-shared';
import { formatPrice } from '@/lib/utils';

/**
 * Admin queue table with inline status changes.
 *
 * The dropdown is driven by the shared QUEUE_STATUSES allow-list, which the
 * API validates against too -- so the UI and the server can never disagree.
 */

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  new: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-sky-50 text-sky-700 border-sky-200',
  quoted: 'bg-sky-50 text-sky-700 border-sky-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
};

export function QueueTable({
  queue,
  rows: items,
}: {
  queue: QueueName;
  rows: QueueRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function update(id: string, status: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/${queue}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-surface-300 bg-white p-8 text-center text-sm text-ink-500">
        Nothing here yet.
      </p>
    );
  }

  return (
    <>
      {/* Mobile: a card per row. Four columns do not fit a phone, and the
          status dropdown is the whole point of this screen, so it must never
          sit off-screen behind a horizontal scroll. */}
      <ul className="space-y-3 lg:hidden">
        {items.map((row) => {
          const p = readPayload(row.payload);
          const amount = row.totalPaise ?? row.quotedPaise ?? 0;
          const who = String(p.name || p.fullName || p.customerName || '—');
          const what = String(
            p.brand && p.model ? `${p.brand} ${p.model}` : (p.subject || p.email || ''),
          );
          return (
            <li
              key={row.id}
              className="rounded-2xl border border-surface-200 bg-white p-4 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-ink-700">{row.reference}</p>
                  <p className="mt-0.5 text-[11px] text-ink-400">
                    {new Date(row.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                {amount > 0 ? (
                  <p className="shrink-0 whitespace-nowrap text-sm font-semibold text-ink-800">
                    {formatPrice(amount)}
                  </p>
                ) : null}
              </div>
              <p className="mt-2 truncate font-semibold text-ink-900">{who}</p>
              {what ? <p className="truncate text-xs text-ink-500">{what}</p> : null}
              <div className="mt-3">
                <StatusSelect
                  queue={queue}
                  id={row.id}
                  status={row.status}
                  busy={busy === row.id}
                  onChange={update}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* Desktop: the full table. */}
      <div className="hidden overflow-x-auto rounded-2xl border border-surface-200 bg-white shadow-soft lg:block">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-surface-200 text-xs uppercase tracking-wider text-ink-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Reference</th>
            <th className="px-4 py-3 font-semibold">Details</th>
            <th className="px-4 py-3 font-semibold">Amount</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {items.map((row) => {
            const p = readPayload(row.payload);
            const amount = row.totalPaise ?? row.quotedPaise ?? 0;
            const who = String(p.name || p.fullName || p.customerName || '—');
            const what = String(
              p.brand && p.model ? `${p.brand} ${p.model}` : (p.subject || p.email || ''),
            );

            return (
              <tr key={row.id}>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-700">
                  {row.reference}
                  <span className="mt-0.5 block font-sans text-[11px] text-ink-400">
                    {new Date(row.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="block font-semibold text-ink-900">{who}</span>
                  <span className="block text-xs text-ink-500">{what}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink-800">
                  {amount > 0 ? formatPrice(amount) : '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusSelect
                    queue={queue}
                    id={row.id}
                    status={row.status}
                    busy={busy === row.id}
                    onChange={update}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}

/**
 * The status dropdown, shared by the mobile card and the desktop table so the
 * two can never drift apart in behaviour or styling.
 *
 * `w-full` on mobile makes it a comfortable thumb-sized control; `sm:w-auto`
 * returns it to its natural size inside the desktop table cell.
 */
function StatusSelect({
  queue,
  id,
  status,
  busy,
  onChange,
}: {
  queue: QueueName;
  id: string;
  status: string;
  busy: boolean;
  onChange: (id: string, status: string) => void;
}) {
  return (
    <select
      value={status}
      disabled={busy}
      onChange={(e) => onChange(id, e.target.value)}
      aria-label={`Status for ${id}`}
      className={`w-full rounded-lg border px-2.5 py-2.5 text-xs font-semibold outline-none sm:w-auto sm:py-1 ${
        STATUS_STYLES[status] ?? 'border-surface-300 bg-white text-ink-700'
      }`}
    >
      {QUEUE_STATUSES[queue].map((s) => (
        <option key={s} value={s}>
          {s.replace('_', ' ')}
        </option>
      ))}
    </select>
  );
}

