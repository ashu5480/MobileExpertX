import type { Metadata } from 'next';
import Link from 'next/link';
import { LayoutDashboard, Package, Users, LogOut, Wrench, Inbox, Receipt } from 'lucide-react';
import { requireAdmin } from '@/lib/guards';
import { SignOutButton } from '@/components/account/SignOutButton';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

/** Force per-request rendering: admin data must never be cached. */
export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/items', label: 'All items', icon: Package },
  { href: '/admin/sellRequests', label: 'Trade-ins', icon: Inbox },
  { href: '/admin/bookings', label: 'Repairs', icon: Wrench },
  { href: '/admin/orders', label: 'Orders', icon: Receipt },
  { href: '/admin/inquiries', label: 'Enquiries', icon: Inbox },
  { href: '/admin/users', label: 'Users', icon: Users },
];

/**
 * Admin shell.
 *
 * `requireAdmin()` runs before anything renders, so an unauthenticated or
 * non-admin request never reaches the children. Middleware also filters these
 * paths early, but this check is the actual security boundary.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = requireAdmin();

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="border-b border-surface-200 bg-white">
        <div className="container flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900 text-white">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-sm font-extrabold tracking-tight text-ink-900">
                MobilExpertX Admin
              </p>
              <p className="text-xs text-ink-500">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-surface-100"
            >
              View store
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="container flex flex-col gap-8 py-8 lg:flex-row">
        <nav className="lg:w-56 lg:shrink-0" aria-label="Admin sections">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {NAV.map((item) => (
              <li key={item.href} className="shrink-0 lg:shrink">
                <Link
                  href={item.href}
                  className="flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-white hover:text-brand-600"
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
