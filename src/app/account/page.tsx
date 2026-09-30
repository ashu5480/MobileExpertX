import type { Metadata } from 'next';
import { MessageCircle, Package, Plus, Shield } from 'lucide-react';
import { requireUser } from '@/lib/guards';
import { listForUser } from '@/lib/listings';
import { SignOutButton } from '@/components/account/SignOutButton';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'My Account',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/** Account overview — counts come from the customer's own rows only. */
export default async function AccountPage() {
  const user = await requireUser();
  const { total } = await listForUser(user.id, 1, 1);

  return (
    <main className="section bg-surface-50">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
              Hello, {user.name.split(' ')[0]}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-600">
              Signed in as {user.email}
              {user.role === 'admin' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                  <Shield className="h-3 w-3" aria-hidden="true" /> Admin
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            {user.role === 'admin' && (
              <ButtonLink href="/admin" variant="secondary">
                Admin panel
              </ButtonLink>
            )}
            <SignOutButton />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat
            href="/account/items"
            icon={Package}
            label="My items"
            value={String(total)}
            hint="Currently listed"
          />
          <Stat
            href="/account/items/new"
            icon={Plus}
            label="List an item"
            value="＋"
            hint="Add photos + description"
          />
          <Stat
            href="/contact"
            icon={MessageCircle}
            label="Need help?"
            value="→"
            hint="Talk to the shop"
          />
        </div>
      </div>
    </main>
  );
}

function Stat({
  href,
  icon: Icon,
  label,
  value,
  hint,
}: {
  href: string;
  icon: typeof Package;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <a
      href={href}
      className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft transition hover:border-brand-300"
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 font-display text-3xl font-extrabold text-ink-900">{value}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink-800">{label}</p>
      <p className="text-xs text-ink-500">{hint}</p>
    </a>
  );
}
