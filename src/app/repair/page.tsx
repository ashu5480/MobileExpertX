import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { RepairForm } from '@/components/forms/RepairForm';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { RepairIcon, RepairPhoneVisual } from '@/components/repair/RepairIcon';
import { ContactCTA } from '@/components/contact/ContactCTA';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, buildMetadata, faqSchema } from '@/lib/seo';
import { listRepairServices } from '@/services/catalogService';
import { faqs } from '@/data/store';
import { formatPrice } from '@/lib/utils';
import { Truck, ShieldCheck, Clock } from 'lucide-react';

export const metadata: Metadata = buildMetadata({
  title: 'Mobile Phone Repair Services',
  description:
    'Screen, battery, charging port, camera, water damage and motherboard repair by experienced technicians. Upfront quotes, same-day repairs and written warranties.',
  path: '/repair',
  keywords: [
    'mobile repair',
    'phone screen replacement',
    'phone battery replacement',
    'water damage repair',
    'phone repair Ahmedabad',
  ],
});

const repairFaqs = faqs.filter((f) =>
  /repair|warranty|turnaround|diagnos/i.test(`${f.q} ${f.a}`),
);

export default async function RepairPage() {
  const services = await listRepairServices();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Repair', path: '/repair' },
          ]),
          faqSchema(repairFaqs),
        ]}
      />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="light-section pb-16 pt-12 sm:pb-20 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="light-aurora" />
          <div className="light-grid" />
        </div>

        <div className="container">
          <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Repair' }]} dark />

          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h1 className="text-display-lg font-extrabold text-ink-900">
                Repairs by people who do this every day.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">
                Component-level work under a microscope, an upfront quote before we
                touch anything, and a written warranty on every repair we carry out.
              </p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Clock, label: 'Same-day', detail: 'Most repairs under 4 hrs' },
                  { icon: ShieldCheck, label: 'Warranted', detail: 'Up to 6 months' },
                  { icon: Truck, label: 'Free pickup', detail: '₹99 deducted from bill' },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="rounded-2xl border border-surface-200 bg-white/85 p-4 shadow-soft backdrop-blur-md"
                  >
                    <item.icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                    <p className="mt-2.5 text-sm font-bold text-ink-900">{item.label}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{item.detail}</p>
                  </li>
                ))}
              </ul>
            </div>

            <RepairPhoneVisual />
          </div>
        </div>
      </section>

      {/* ── Services ──────────────────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container">
          <SectionHeading
            id="services-heading"
            eyebrow="What we fix"
            title="Every repair, one transparent price"
            description="The price below is where your repair starts, not a teaser — the final quote is confirmed before any work begins."
          />

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li key={service.id} id={service.slug} className="scroll-mt-28">
                <a
                  href={`/repair/${service.slug}`}
                  className="group flex h-full flex-col rounded-3xl border border-surface-200 bg-white p-6 shadow-soft transition-all duration-400 ease-premium hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-lift"
                >
                  <div className="flex items-start justify-between gap-4">
                    <RepairIcon
                      name={service.icon}
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-500/10 text-brand-500 transition-transform duration-500 group-hover:scale-110"
                    />
                    {service.popular && (
                      <span className="rounded-full bg-brand-gradient px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        Popular
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-lg font-bold tracking-tight text-ink-900">
                    {service.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">
                    {service.description}
                  </p>

                  <ul className="mt-4 space-y-1.5">
                    {service.includes.slice(0, 3).map((item) => (
                      <li key={item} className="text-xs text-ink-500">
                        · {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex items-end justify-between border-t border-surface-200 pt-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-ink-400">From</p>
                      <p className="text-lg font-extrabold text-ink-900">
                        {formatPrice(service.startingPrice)}
                      </p>
                    </div>
                    <span className="text-right text-xs text-ink-500">
                      {service.turnaround}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Booking form ──────────────────────────────────────────────── */}
      <section id="book" className="section scroll-mt-24 bg-surface-50">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
            <div className="lg:col-span-2">
              <RepairForm />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft">
                <h2 className="text-sm font-bold text-ink-900">Devices we service</h2>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    'iPhone',
                    'Samsung',
                    'Xiaomi',
                    'OnePlus',
                    'Realme',
                    'Vivo',
                    'Oppo',
                    'Google',
                    'Nothing',
                    'Motorola',
                  ].map((brand) => (
                    <li
                      key={brand}
                      className="rounded-full bg-surface-100 px-2.5 py-1 text-[11px] font-semibold text-ink-700"
                    >
                      {brand}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-ink-500">
                  Not on the list? We likely still repair it — send the model on
                  WhatsApp and we will check.
                </p>
              </div>

              <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft">
                <h2 className="text-sm font-bold text-ink-900">Our promise</h2>
                <ul className="mt-3 space-y-2.5 text-sm text-ink-600">
                  {[
                    'You approve the price before we start.',
                    'We show you the old part we removed.',
                    'We do not repair a fault you did not ask about.',
                    'If the same fault returns, the repair is redone free.',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <ShieldCheck
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {repairFaqs.length > 0 && (
        <section className="section bg-white">
          <div className="container max-w-3xl">
            <SectionHeading eyebrow="Questions" title="About our repairs" align="center" />
            <dl className="mt-8 space-y-3">
              {repairFaqs.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-surface-200 bg-surface-50 p-5"
                >
                  <dt className="text-sm font-bold text-ink-900">{faq.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ink-600">{faq.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      <ContactCTA />
    </>
  );
}
