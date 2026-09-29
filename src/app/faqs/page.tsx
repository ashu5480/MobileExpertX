import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ContactCTA } from '@/components/contact/ContactCTA';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, buildMetadata, faqSchema } from '@/lib/seo';
import { faqs } from '@/data/store';
import { ChevronDown } from 'lucide-react';

export const metadata: Metadata = buildMetadata({
  title: 'Frequently Asked Questions',
  description:
    'Answers about refurbished phones, trade-in valuations, repair turnaround, warranties, delivery and payment at MobilExpertX.',
  path: '/faqs',
  keywords: ['mobile phone FAQ', 'refurbished phone questions', 'trade-in questions'],
});

export default function FaqsPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'FAQs', path: '/faqs' },
          ]),
          faqSchema(faqs),
        ]}
      />

      <div className="border-b border-surface-200 bg-surface-50">
        <div className="container py-8 sm:py-10">
          <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'FAQs' }]} />
          <h1 className="mt-4 text-display-sm font-extrabold tracking-tight text-ink-900">
            Frequently asked questions
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">
            The things people ask us most. If yours is not here, message us — we answer
            within a working day.
          </p>
        </div>
      </div>

      <div className="section-tight">
        <div className="container max-w-3xl">
          <dl className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-surface-200 bg-white shadow-soft open:border-brand-200 open:shadow-card"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-[15px] font-bold text-ink-900 marker:hidden [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-ink-400 transition-transform duration-300 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <dd className="border-t border-surface-200 p-5 text-sm leading-relaxed text-ink-600">
                  {faq.a}
                </dd>
              </details>
            ))}
          </dl>
        </div>
      </div>

      <ContactCTA />
    </>
  );
}
