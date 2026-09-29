import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { AccessoriesClient } from '@/components/accessories/AccessoriesClient';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { ContactCTA } from '@/components/contact/ContactCTA';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { accessories } from '@/data/accessories';
import { ShieldCheck, Truck, Headset } from 'lucide-react';

export const metadata: Metadata = buildMetadata({
  title: 'Mobile Accessories — Chargers, Cases, Earbuds & More',
  description:
    'Shop genuine mobile accessories: 100W GaN chargers, braided cables, power banks, cases, screen protectors, earbuds, smartwatches and car chargers. Genuine products, honest prices.',
  path: '/accessories',
  keywords: [
    'mobile accessories',
    'phone charger India',
    'earbuds online',
    'phone cover',
    'power bank',
    'smartwatch',
  ],
});

export default function AccessoriesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Accessories', path: '/accessories' },
        ])}
      />

      <div className="border-b border-surface-200 bg-surface-50">
        <div className="container py-8 sm:py-10">
          <Breadcrumbs
            items={[{ name: 'Home', href: '/' }, { name: 'Accessories' }]}
          />
          <h1 className="mt-4 text-display-sm font-extrabold tracking-tight text-ink-900">
            Genuine mobile accessories
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">
            Chargers that actually fast-charge, cables that survive real use, and cases
            that fit properly. {accessories.length} products in stock, all covered by a
            7-day replacement window.
          </p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, label: 'Genuine products', detail: 'No mislabelled stock' },
              { icon: Truck, label: 'Free delivery', detail: 'Above ₹499' },
              { icon: Headset, label: 'Helpful support', detail: 'On WhatsApp or phone' },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-white p-4"
              >
                <item.icon className="h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-bold text-ink-900">{item.label}</span>
                  <span className="block text-xs text-ink-500">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="section-tight">
        <Suspense
          fallback={
            <div className="container py-8">
              <ProductGridSkeleton count={12} />
            </div>
          }
        >
          <AccessoriesClient />
        </Suspense>
      </div>

      <ContactCTA />
    </>
  );
}
