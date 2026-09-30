import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, Clock, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { RepairForm } from '@/components/forms/RepairForm';
import { RepairIcon } from '@/components/repair/RepairIcon';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, buildMetadata, serviceSchema } from '@/lib/seo';
import { getRepairService, listRepairServices } from '@/services/catalogService';
import { buildTelUrl, buildWhatsAppUrl, siteConfig, whatsappMessages } from '@/lib/config';
import { formatPrice } from '@/lib/utils';

interface Params {
  params: { slug: string };
}

export function generateStaticParams() {
  return listRepairServices().then((services) =>
    services.map((s) => ({ slug: s.slug })),
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const service = await getRepairService(params.slug);
  if (!service) {
    return buildMetadata({
      title: 'Repair not found',
      description: 'This repair service is no longer offered.',
      path: `/repair/${params.slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${service.name} — From ${formatPrice(service.startingPrice)}`,
    description: `${service.description} Starting at ${formatPrice(service.startingPrice)}, ${service.turnaround}. ${service.warranty}.`,
    path: `/repair/${service.slug}`,
    keywords: [
      service.name.toLowerCase(),
      'mobile repair Ahmedabad',
      `${service.name.toLowerCase()} price`,
    ],
  });
}

export default async function RepairServicePage({ params }: Params) {
  const service = await getRepairService(params.slug);
  if (!service) notFound();

  const all = await listRepairServices();
  const others = all.filter((s) => s.id !== service.id).slice(0, 5);

  return (
    <>
      <JsonLd
        data={[
          serviceSchema(service),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Repair', path: '/repair' },
            { name: service.name, path: `/repair/${service.slug}` },
          ]),
        ]}
      />

      <section className="dark-section relative isolate overflow-hidden bg-ink-900 pb-14 pt-10 sm:pb-16 sm:pt-14">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute inset-0 bg-aurora opacity-75" />
          <div className="absolute inset-0 bg-grid-dark bg-grid opacity-20 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000,transparent)]" />
        </div>

        <div className="container">
          <Breadcrumbs
            items={[
              { name: 'Home', href: '/' },
              { name: 'Repair', href: '/repair' },
              { name: service.name },
            ]}
            dark
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <RepairIcon
                name={service.icon}
                className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-brand-600 ring-1 ring-white/15"
              />
              <h1 className="mt-6 text-display-md font-extrabold text-white">{service.name}</h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65">
                {service.longDescription}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Starting price', value: formatPrice(service.startingPrice) },
                  { label: 'Turnaround', value: service.turnaround },
                  { label: 'Warranty', value: service.warranty },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                      {item.label}
                    </p>
                    <p className="mt-1.5 text-sm font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />
                What is included
              </h2>
              <ul className="mt-4 space-y-2.5">
                {service.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/75">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>

              <h2 className="mt-7 flex items-center gap-2 text-sm font-bold text-white">
                <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
                Devices we service
              </h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {service.devices.map((device) => (
                  <li
                    key={device}
                    className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-white/70"
                  >
                    {device}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-surface-50">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
            <div className="lg:col-span-2">
              <RepairForm service={service} />
            </div>

            <aside className="space-y-3 lg:sticky lg:top-28 lg:self-start">
              <a
                href={buildWhatsAppUrl(
                  siteConfig.contact.whatsapp,
                  whatsappMessages.bookRepair(service.name),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-3xl bg-[#25D366] p-5 text-white shadow-[0_18px_48px_-12px_rgba(37,211,102,0.5)] transition-all hover:brightness-105"
              >
                <MessageCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-bold">Book on WhatsApp</span>
                  <span className="block text-xs opacity-80">Fastest way to get a quote</span>
                </span>
              </a>

              <a
                href={buildTelUrl(
                  siteConfig.contact.repairPhone,
                  whatsappMessages.bookRepair(service.name),
                )}
                className="flex items-center gap-3 rounded-3xl border border-surface-200 bg-white p-5 shadow-soft transition-colors hover:border-brand-300"
              >
                <Phone className="h-6 w-6 shrink-0 text-brand-500" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-bold text-ink-900">Call for repair</span>
                  <span className="block text-xs text-ink-500">
                    {siteConfig.contact.repairPhoneDisplay}
                  </span>
                </span>
              </a>

              <div className="flex items-center gap-3 rounded-3xl border border-surface-200 bg-white p-5 shadow-soft">
                <Clock className="h-6 w-6 shrink-0 text-ink-400" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-bold text-ink-900">
                    {service.turnaround}
                  </span>
                  <span className="block text-xs text-ink-500">Typical turnaround</span>
                </span>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="section border-t border-surface-200 bg-white">
          <div className="container">
            <h2 className="text-title-lg font-extrabold tracking-tight text-ink-900">
              Other repairs we do
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/repair/${item.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-surface-200 bg-white p-4 transition-all hover:border-brand-200 hover:shadow-soft"
                  >
                    <RepairIcon
                      name={item.icon}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/8 text-brand-500"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-900">
                        {item.name}
                      </span>
                      <span className="block text-xs text-ink-500">
                        From {formatPrice(item.startingPrice)}
                      </span>
                    </span>
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
