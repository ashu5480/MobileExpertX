'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCw } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { buildWhatsAppUrl, siteConfig, whatsappMessages } from '@/lib/config';

/**
 * Route-level error boundary.
 *
 * A storefront that white-screens on a failed fetch loses the sale, so this
 * offers three real exits: retry, back to the shop, or message a human. In
 * development the underlying message is shown so the bug is diagnosable.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hook this into Sentry / your error reporter in production.
    console.error('Route error:', error);
  }, [error]);

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="container py-20">
      <div className="mx-auto max-w-lg rounded-3xl border border-surface-200 bg-white p-8 text-center shadow-card sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-xl font-bold tracking-tight text-ink-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          This is on us, not you. Try again — and if it keeps happening, message us
          and we will sort it out straight away.
        </p>

        {isDev && (
          <pre className="mt-5 max-h-40 overflow-auto rounded-xl bg-surface-100 p-4 text-left font-mono text-xs text-ink-700">
            {error.message}
            {error.digest ? `\n\nDigest: ${error.digest}` : ''}
          </pre>
        )}

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-white shadow-lift transition-colors hover:brightness-105"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
          <ButtonLink href="/shop" variant="outline">
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to shop
          </ButtonLink>
        </div>

        <a
          href={buildWhatsAppUrl(siteConfig.contact.whatsapp, whatsappMessages.needHelp())}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline"
        >
          Or message us on WhatsApp
        </a>
      </div>
    </div>
  );
}
