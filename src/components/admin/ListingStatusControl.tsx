'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUSES = ['active', 'sold', 'hidden'] as const;

const STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sold: 'bg-amber-50 text-amber-700 border-amber-200',
  hidden: 'bg-surface-100 text-ink-600 border-surface-300',
};

/** Inline status switch for a customer listing. */
export function ListingStatusControl({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <select
      value={status}
      disabled={busy}
      aria-label="Listing status"
      onChange={async (e) => {
        setBusy(true);
        try {
          const res = await fetch('/api/admin/listings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: e.target.value }),
          });
          if (res.ok) router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none disabled:opacity-50 ${
        STYLES[status] ?? STYLES.hidden
      }`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
