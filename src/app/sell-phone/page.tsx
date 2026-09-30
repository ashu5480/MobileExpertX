import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SellPhoneFlow } from '@/components/forms/SellPhoneFlow';
import { ContactCTA } from '@/components/contact/ContactCTA';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, buildMetadata, faqSchema } from '@/lib/seo';
import { faqs } from '@/data/store';
import { sellBrands, sellPhases } from '@/data/sellPhone';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = buildMetadata({
  title: 'Sell Your Old Phone — Instant Resale Value',
  description:
    'Turn your old phone into cash in three steps. Answer a few quick questions for an instant valuation and a Superb/Good/Fair grade, then book a free doorstep pickup and get paid at your door.',
  path: '/sell-phone',
  keywords: [
    'sell old phone',
    'phone trade-in India',
    'used phone resale value',
    'mobile phone buyback',
  ],
});

const sellFaqs = faqs.filter((f) =>
  /valuation|trade-in|sell|buyback|resale|data/i.test(`${f.q} ${f.a}`),
);

export default function SellPhonePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Sell Your Phone', path: '/sell-phone' },
          ]),
          faqSchema(sellFaqs),
        ]}
      />

      <section className="light-section pb-16 pt-12 sm:pb-20 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="light-aurora" />
          <div className="light-grid" />
        </div>

        <div className="container">
          <Breadcrumbs
            items={[{ name: 'Home', href: '/' }, { name: 'Sell Your Phone' }]}
            dark
          />
          <div className="mt-6 max-w-2xl">
            <h1 className="text-display-lg font-extrabold text-ink-900">
              Turn your old phone into cash.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-ink-600 sm:text-lg">
              Three simple steps: tell us about your phone, see your price and the grade
              we would give it, then book a free pickup and get paid at your door. No
              lowball offers, and we never reduce a confirmed quote.
            </p>
          </div>
        </div>
      </section>

      <section className="section-tight bg-surface-50">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
            <div className="lg:col-span-2">
              <SellPhoneFlow />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft">
                <h2 className="text-sm font-bold text-ink-900">How it works</h2>
                <p className="mt-1 text-xs text-ink-500">
                  Three steps, about two minutes, cash in hand.
                </p>
                <ol className="mt-4 space-y-4">
                  {sellPhases.map((phase, i) => (
                    <li key={phase.id} className="flex gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-ink-900">
                          {phase.title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-600">
                          {phase.blurb}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 border-t border-surface-200 pt-4 text-xs leading-relaxed text-ink-600">
                  Pickup is free, and the quote you see is the quote we honour once the
                  phone matches your description. You are paid at the door — cash, UPI or
                  bank transfer.
                </p>
              </div>

              <div className="rounded-3xl border border-brand-500/20 bg-brand-500/5 p-6">
                <h2 className="text-sm font-bold text-ink-900">We buy from</h2>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {sellBrands
                    .filter((b) => b.slug !== 'other')
                    .map((b) => (
                      <li
                        key={b.slug}
                        className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-700 ring-1 ring-surface-200"
                      >
                        {b.name}
                      </li>
                    ))}
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-ink-600">
                  Not listed? Send us the details on WhatsApp and we will still quote you.
                </p>
              </div>

              <div className="rounded-3xl border border-surface-200 bg-white p-6">
                <h2 className="text-sm font-bold text-ink-900">Typical payouts</h2>
                <ul className="mt-3 space-y-2.5 text-sm">
                  {[
                    { label: 'iPhone 14, good condition', value: 4200000 },
                    { label: 'Galaxy S23, good condition', value: 3100000 },
                    { label: 'Pixel 7a, fair condition', value: 1250000 },
                    { label: 'Redmi Note 12, good condition', value: 600000 },
                  ].map((row) => (
                    <li key={row.label} className="flex justify-between gap-3">
                      <span className="text-ink-600">{row.label}</span>
                      <span className="font-bold tabular-nums text-emerald-600">
                        {formatPrice(row.value)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-ink-400">
                  Indicative only — your quote updates live as you answer.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {sellFaqs.length > 0 && (
        <section className="section bg-white">
          <div className="container max-w-3xl">
            <SectionHeading
              eyebrow="Questions"
              title="About selling your phone"
              align="center"
            />
            <dl className="mt-8 space-y-3">
              {sellFaqs.map((faq) => (
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
