import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, MessageCircle, Phone, ShieldCheck, Truck } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { AccessoryVisual } from '@/components/product/ProductVisual';
import { Rating } from '@/components/ui/Rating';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { AddToCartButton } from '@/components/product/AddToCartButton';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { getAccessoryBySlug, getAllAccessories } from '@/services/catalogService';
import {
  buildTelUrl,
  buildWhatsAppUrl,
  siteConfig,
  whatsappMessages,
} from '@/lib/config';
import { discountPercent, formatPrice } from '@/lib/utils';

export interface Params {
  params: { slug: string };
}

/**
 * The catalogue is editable from the admin panel, so these pages are
 * incremental-static rather than frozen at build time. An admin save also calls
 * `revalidatePath` for the affected slug, which makes the change appear on the
 * next request; this interval is the safety net for anything that slips
 * through.
 */

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const item = await getAccessoryBySlug(params.slug);
  if (!item) {
    return buildMetadata({
      title: 'Accessory not found',
      description: 'This accessory is no longer available.',
      path: `/accessories/${params.slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${item.name} — ${formatPrice(item.price)}`,
    description: item.description,
    path: `/accessories/${item.slug}`,
    type: 'product',
    keywords: [item.name, item.brand, item.category.replace(/-/g, ' ')],
  });
}

export default async function AccessoryPage({ params }: Params) {
  const item = await getAccessoryBySlug(params.slug);
  if (!item) notFound();

  const all = await getAllAccessories();
  const related = all
    .filter((a) => a.id !== item.id && a.category === item.category)
    .slice(0, 4);
  const off = discountPercent(item.price, item.mrp);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Accessories', path: '/accessories' },
          { name: item.name, path: `/accessories/${item.slug}` },
        ])}
      />

      <div className="container py-6 sm:py-8">
        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: 'Accessories', href: '/accessories' },
            { name: item.name },
          ]}
        />
      </div>

      <div className="container">
        <div className="grid gap-8 pb-16 lg:grid-cols-2 lg:gap-12">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-surface-200">
            <AccessoryVisual accent={item.accent} name={item.name} image={item.image} alt={item.name} priority />
            {off > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white">
                {off}% OFF
              </span>
            )}
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-500">
              {item.brand} · {item.category.replace(/-/g, ' ')}
            </p>
            <h1 className="mt-3 text-display-sm font-extrabold tracking-tight text-ink-900">
              {item.name}
            </h1>
            <div className="mt-3">
              <Rating value={item.rating} size={16} showValue count={item.reviewCount} />
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="text-4xl font-extrabold tracking-tight text-ink-900">
                {formatPrice(item.price)}
              </span>
              {off > 0 && (
                <>
                  <span className="text-lg text-ink-400 line-through">
                    {formatPrice(item.mrp)}
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-sm font-bold text-emerald-600">
                    Save {formatPrice(item.mrp - item.price)}
                  </span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-sm text-ink-500">Inclusive of all taxes</p>

            <p className="mt-6 text-[15px] leading-relaxed text-ink-600">
              {item.description}
            </p>

            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {item.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm text-ink-700">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                  {h}
                </li>
              ))}
            </ul>

            <p
              className={
                item.stock > 20
                  ? 'mt-6 text-sm font-semibold text-emerald-600'
                  : 'mt-6 text-sm font-semibold text-amber-600'
              }
            >
              {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
            </p>

            <div className="mt-7 space-y-2.5">
              <AddToCartButton productId={item.id} disabled={item.stock <= 0} />
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={buildWhatsAppUrl(
                    siteConfig.contact.whatsapp,
                    whatsappMessages.priceEnquiry(item.name),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 px-4 py-3.5 text-sm font-semibold text-[#128C4B] transition-colors hover:bg-[#25D366]/20"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Ask on WhatsApp
                </a>
                <a
                  href={buildTelUrl(
                    siteConfig.contact.phone,
                    whatsappMessages.priceEnquiry(item.name),
                  )}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-100 px-4 py-3.5 text-sm font-semibold text-ink-800 transition-colors hover:bg-surface-200"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Call for price
                </a>
              </div>
            </div>

            <ul className="mt-6 space-y-2.5 border-t border-surface-200 pt-6">
              {[
                { icon: Truck, text: 'Free delivery on orders above ₹499' },
                {
                  icon: ShieldCheck,
                  text: '7-day replacement for manufacturing defects',
                },
                { icon: Check, text: '100% genuine — no mislabelled stock' },
              ].map((row) => (
                <li key={row.text} className="flex items-center gap-2 text-sm text-ink-600">
                  <row.icon
                    className="h-4 w-4 shrink-0 text-emerald-500"
                    aria-hidden="true"
                  />
                  {row.text}
                </li>
              ))}
            </ul>

            <h2 className="mt-7 text-sm font-bold text-ink-900">Compatibility</h2>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {item.compatibility.map((c) => (
                <li
                  key={c}
                  className="rounded-full bg-surface-100 px-2.5 py-1 text-[11px] font-semibold text-ink-700"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section border-t border-surface-200 bg-surface-50">
          <div className="container">
            <SectionHeading
              eyebrow="You might also like"
              title="More in this category"
              action={
                <Link
                  href={`/accessories?category=${item.category}`}
                  className="text-sm font-semibold text-brand-600 hover:underline"
                >
                  View all
                </Link>
              }
            />
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/accessories/${r.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-soft transition-all hover:-translate-y-1.5 hover:shadow-lift"
                  >
                    <div className="aspect-square overflow-hidden">
                      <AccessoryVisual accent={r.accent} name={r.name} image={r.image} alt={r.name} />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold text-ink-900 transition-colors group-hover:text-brand-600">
                        {r.name}
                      </h3>
                      <span className="mt-auto pt-3 text-base font-extrabold text-ink-900">
                        {formatPrice(r.price)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}



/**
 * Rendered per request, not prerendered.
 *
 * Two reasons. The catalogue is editable from the admin panel, so a frozen
 * build would show stale prices. And a statically generated route that
 * renders 
otFound() for an unknown slug answers 200 with a soft-404
 * body, which search engines index as a real page.
 */
export const dynamic = 'force-dynamic';
