'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Promotes or demotes a user. Locked for your own row to prevent self-lockout. */
export function RoleControl({
  userId,
  role,
  self,
}: {
  userId: string;
  role: string;
  self: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <select
      value={role}
      disabled={busy || self}
      title={self ? 'You cannot change your own role.' : undefined}
      aria-label="User role"
      onChange={async (e) => {
        setBusy(true);
        try {
          const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, role: e.target.value }),
          });
          if (res.ok) router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      className="rounded-lg border border-surface-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-700 outline-none disabled:opacity-60"
    >
      <option value="customer">Customer</option>
      <option value="admin">Admin</option>
    </select>
  );
}
