import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SellPhoneFlow } from '@/components/forms/SellPhoneFlow';
import { ContactCTA } from '@/components/contact/ContactCTA';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, buildMetadata, faqSchema } from '@/lib/seo';
import { faqs } from '@/data/store';
import { sellBrands } from '@/data/sellPhone';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = buildMetadata({
  title: 'Sell Your Old Phone — Instant Resale Value',
  description:
    'Turn your old phone into cash. Answer eight quick questions for an instant, honest valuation, then get a free in-person inspection and same-day payment.',
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

      <section className="dark-section relative isolate overflow-hidden bg-ink-900 pb-16 pt-12 sm:pb-20 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute inset-0 bg-aurora opacity-80" />
          <div className="absolute inset-0 bg-grid-dark bg-grid opacity-20 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000,transparent)]" />
        </div>

        <div className="container">
          <Breadcrumbs
            items={[{ name: 'Home', href: '/' }, { name: 'Sell Your Phone' }]}
            dark
          />
          <div className="mt-6 max-w-2xl">
            <h1 className="text-display-lg font-extrabold text-white">
              Turn your old phone into cash.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/60 sm:text-lg">
              Eight quick questions, an instant honest valuation, and cash in hand the
              same day. No lowball offers, and we never reduce a confirmed quote.
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
                <ol className="mt-4 space-y-4">
                  {[
                    {
                      title: 'Answer 8 questions',
                      body: 'Brand, model, condition, screen, battery, body, accessories and age.',
                    },
                    {
                      title: 'See your value instantly',
                      body: 'We apply our live market model — the same number we use at the counter.',
                    },
                    {
                      title: 'Free inspection',
                      body: 'Bring it in or share photos. We confirm the quote in about 15 minutes.',
                    },
                    {
                      title: 'Paid the same day',
                      body: 'Cash or UPI, with the data wipe and reset done in front of you.',
                    },
                  ].map((item, i) => (
                    <li key={item.title} className="flex gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-ink-900">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-600">
                          {item.body}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
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
