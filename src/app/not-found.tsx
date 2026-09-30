import Link from 'next/link';
import { Compass, Home, Search } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { ButtonLink } from '@/components/ui/Button';
import { siteConfig } from '@/lib/config';

const SUGGESTIONS = [
  { label: 'Shop all phones', href: '/shop' },
  { label: 'Sell your phone', href: '/sell-phone' },
  { label: 'Book a repair', href: '/repair' },
  { label: 'Accessories', href: '/accessories' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Contact us', href: '/contact' },
];

/**
 * 404 page — helpful, on-brand, and never a dead end.
 *
 * Deliberately a server component. Marking the root `not-found.tsx` as
 * `'use client'` makes Next.js answer 200 with the 404 body instead of a real
 * 404 status, which search engines then index as a genuine page.
 *
 * The buttons below are client components, which a server component may
 * render, so nothing is lost.
 */
export default function NotFound() {
  return (
    <div className="container py-20 sm:py-28">
      <div className="mx-auto max-w-xl text-center">
        <p className="bg-brand-gradient bg-clip-text text-7xl font-extrabold text-transparent sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 text-display-sm font-extrabold tracking-tight text-ink-900">
          This page has moved on
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-600">
          The link may be out of date, or the product may have sold out. Here is where
          most people were heading.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" size="lg">
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to home
          </ButtonLink>
          <ButtonLink href="/shop" variant="outline" size="lg">
            <Search className="h-4 w-4" aria-hidden="true" />
            Browse phones
          </ButtonLink>
        </div>

        <nav className="mt-10" aria-label="Suggested pages">
          <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400">
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            Try one of these
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-block rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-600"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-10 text-sm text-ink-500">
          Looking for something specific?{' '}
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="font-semibold text-brand-600 hover:underline"
          >
            Email us
          </a>{' '}
          and we will find it.
        </p>

        <div className="mt-6 flex justify-center">
          <BackButton />
        </div>
      </div>
    </div>
  );
}
