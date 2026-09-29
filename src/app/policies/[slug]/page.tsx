import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ContactCTA } from '@/components/contact/ContactCTA';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { policies, policyBySlug } from '@/data/policies';
import { siteConfig } from '@/lib/config';

interface Params {
  params: { slug: string };
}

export function generateStaticParams() {
  return policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const policy = policyBySlug(params.slug);
  if (!policy) {
    return buildMetadata({
      title: 'Policy not found',
      description: 'This policy page does not exist.',
      path: `/policies/${params.slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: policy.title,
    description: policy.summary,
    path: `/policies/${policy.slug}`,
  });
}

export default function PolicyPage({ params }: Params) {
  const policy = policyBySlug(params.slug);
  if (!policy) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'FAQs', path: '/faqs' },
          { name: policy.title, path: `/policies/${policy.slug}` },
        ])}
      />

      <div className="border-b border-surface-200 bg-surface-50">
        <div className="container py-8 sm:py-10">
          <Breadcrumbs
            items={[
              { name: 'Home', href: '/' },
              { name: 'FAQs', href: '/faqs' },
              { name: policy.title },
            ]}
          />
          <h1 className="mt-4 text-display-sm font-extrabold tracking-tight text-ink-900">
            {policy.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">
            {policy.summary}
          </p>
          <p className="mt-3 text-xs text-ink-400">Last updated {policy.updated}</p>
        </div>
      </div>

      <div className="section-tight">
        <div className="container max-w-3xl">
          <div className="space-y-8">
            {policy.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-lg font-bold tracking-tight text-ink-900">
                  {section.heading}
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {section.body.map((para) => (
                    <li
                      key={para}
                      className="flex gap-3 text-[15px] leading-relaxed text-ink-600"
                    >
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {para}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-10 rounded-2xl bg-surface-50 p-5 text-sm leading-relaxed text-ink-600">
            Questions about this policy? Email{' '}
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="font-semibold text-brand-600 hover:underline"
            >
              {siteConfig.contact.email}
            </a>{' '}
            or call {siteConfig.contact.phoneDisplay}.
          </p>
        </div>
      </div>

      <ContactCTA />
    </>
  );
}
