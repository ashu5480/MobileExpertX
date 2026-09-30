import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, MessageCircle, Receipt, Shield, Smartphone, Wrench } from 'lucide-react';
import { requireUser } from '@/lib/guards';
import { listForCustomer, type CustomerRequestRow } from '@/services/repository';
import { SignOutButton } from '@/components/account/SignOutButton';
import { formatPrice } from '@/lib/utils';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: 'My Account',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Customer account dashboard.
 *
 * This is a BUYER's account, not a seller or admin console: it shows what this
 * customer has bought, traded in and booked, plus the next step they can take.
 * There is deliberately no "add a product" or "add a listing" affordance here
 * — the catalogue is managed exclusively by an admin under `/admin`.
 */
export default async function AccountPage() {
  const user = await requireUser();
  const { orders, sellRequests, repairs } = await listForCustomer(user.id);

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

          <div className="flex flex-wrap gap-2">
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-xl border border-surface-300 bg-white px-5 py-3 text-sm font-semibold text-ink-900 transition hover:border-brand-300"
              >
                Admin panel
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat
            href="#orders"
            icon={Receipt}
            label="Orders"
            value={orders.length}
            hint="Phones and accessories you bought"
          />
          <Stat
            href="#sell-requests"
            icon={Smartphone}
            label="Sell requests"
            value={sellRequests.length}
            hint="Devices you asked us to quote"
          />
          <Stat
            href="#repairs"
            icon={Wrench}
            label="Repairs"
            value={repairs.length}
            hint="Bookings and their status"
          />
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-ink-900">What would you like to do?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Action href="/shop" label="Buy a phone" hint="Browse the catalogue" />
            <Action href="/sell-phone" label="Sell my phone" hint="Get a trade-in quote" />
            <Action href="/repair" label="Book a repair" hint="Screen, battery, charging" />
          </div>
        </section>

        <section className="mt-10 space-y-8">
          <History
            id="orders"
            title="My orders"
            empty="You have not placed an order yet."
            cta={{ href: '/shop', label: 'Start shopping' }}
            rows={orders}
            showAmount
          />
          <History
            id="sell-requests"
            title="My sell requests"
            empty="No phones sent in for a quote yet."
            cta={{ href: '/sell-phone', label: 'Get a quote' }}
            rows={sellRequests}
            showAmount
          />
          <History
            id="repairs"
            title="My repair requests"
            empty="No repair bookings yet."
            cta={{ href: '/repair', label: 'Book a repair' }}
            rows={repairs}
          />
        </section>

        <section className="mt-10 rounded-3xl border border-surface-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-ink-900">Account settings &amp; help</h2>
          <p className="mt-1.5 text-sm text-ink-600">
            Need to change your details, or have a question about an order? Call{' '}
            {siteConfig.contact.phoneDisplay} or message us on WhatsApp — we reply
            within one working day.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`tel:${siteConfig.contact.phoneDialable}`}
              className="inline-flex items-center gap-2 rounded-xl border border-surface-300 bg-white px-5 py-3 text-sm font-semibold text-ink-900 transition hover:border-brand-300"
            >
              Call {siteConfig.contact.phoneDisplay}
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:brightness-105"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Contact us
            </Link>
          </div>
        </section>
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
  icon: typeof Receipt;
  label: string;
  value: number;
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
      {/* The number alone would be announced without meaning, so the count is
          repeated for screen readers next to its label. */}
      <p className="mt-4 font-display text-3xl font-extrabold text-ink-900" aria-hidden="true">
        {value}
      </p>
      <p className="text-sm font-semibold text-ink-800">
        {label} <span className="sr-only">({value})</span>
      </p>
      <p className="text-xs text-ink-500">{hint}</p>
    </a>
  );
}

function Action({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-surface-200 bg-white px-5 py-4 shadow-soft transition hover:border-brand-300"
    >
      <span>
        <span className="block font-semibold text-ink-900">{label}</span>
        <span className="block text-xs text-ink-500">{hint}</span>
      </span>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
        aria-hidden="true"
      />
    </Link>
  );
}

function History({
  id,
  title,
  rows,
  empty,
  cta,
  showAmount = false,
}: {
  id: string;
  title: string;
  rows: CustomerRequestRow[];
  empty: string;
  cta: { href: string; label: string };
  showAmount?: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-lg font-bold text-ink-900">{title}</h2>

      {rows.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-surface-300 bg-white p-8 text-center">
          <p className="text-sm text-ink-500">{empty}</p>
          <Link
            href={cta.href}
            className="mt-3 inline-flex text-sm font-semibold text-brand-600 underline-offset-2 hover:underline"
          >
            {cta.label} →
          </Link>
        </div>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-200 bg-white px-5 py-4 shadow-soft"
            >
              <div className="min-w-0">
                <p className="font-mono text-xs text-ink-600">{row.reference}</p>
                <p className="truncate font-semibold text-ink-900">{row.title}</p>
                <p className="text-xs text-ink-500">
                  {new Date(row.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {showAmount && row.amountPaise > 0 && (
                  <span className="whitespace-nowrap text-sm font-semibold text-ink-800">
                    {formatPrice(row.amountPaise)}
                  </span>
                )}
                <span className="whitespace-nowrap rounded-full bg-surface-100 px-3 py-1 text-xs font-semibold capitalize text-ink-700">
                  {row.status.replace(/_/g, ' ')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

