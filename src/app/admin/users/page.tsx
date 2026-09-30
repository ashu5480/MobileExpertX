import { requireAdmin } from '@/lib/guards';
import { listUsersWithCounts } from '@/lib/adminService';
import { RoleControl } from '@/components/admin/RoleControl';

export const dynamic = 'force-dynamic';

/** Customer accounts, with their listing counts. */
export default async function AdminUsersPage() {
  // Sequential on purpose: the guard must finish before any customer data is
  // read, not alongside it.
  const me = await requireAdmin();
  const users = await listUsersWithCounts();

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
        Users
      </h1>
      <p className="mt-1 text-sm text-ink-600">
        Everyone with an account. Promote someone to admin only if they need it.
      </p>

      {users.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-surface-300 bg-white p-10 text-center text-sm text-ink-500">
          No accounts yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-surface-200 bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-200 text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {users.map((u) => (
                <tr key={String(u.id)}>
                  <td className="px-4 py-3 font-semibold text-ink-900">{String(u.name)}</td>
                  <td className="px-4 py-3 text-ink-700">{String(u.email)}</td>
                  <td className="px-4 py-3 text-ink-600">{u.phone ? String(u.phone) : '—'}</td>
                  <td className="px-4 py-3 text-ink-700">{String(u.listingCount ?? 0)}</td>
                  <td className="px-4 py-3">
                    <RoleControl
                      userId={String(u.id)}
                      role={String(u.role)}
                      self={String(u.id) === me.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
