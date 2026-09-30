import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ContactCTA } from '@/components/contact/ContactCTA';
import { ButtonLink } from '@/components/ui/Button';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { companyStats } from '@/data/store';
import {
  addressLines,
  buildTelUrl,
  buildWhatsAppUrl,
  hasAddress,
  siteConfig,
  whatsappMessages,
} from '@/lib/config';
import {
  Building2,
  HeartHandshake,
  Microscope,
  Recycle,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

export const metadata: Metadata = buildMetadata({
  title: 'About Us',
  description:
    'MobilExpertX is a mobile marketplace and service studio — verified phones, honest trade-in value, and repairs by technicians with 8+ years on real hardware.',
  path: '/about',
  keywords: ['about MobilExpertX', 'mobile store Ahmedabad', 'trusted phone shop'],
});

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Say the real condition',
    body: 'Refurbished means Grade-A, with the battery health published on the page. We would rather lose a sale than call a B-grade unit a Grade-A one.',
  },
  {
    icon: HeartHandshake,
    title: 'Quote it, then honour it',
    body: 'The trade-in value you see in the wizard is the value we pay after inspection. We do not quietly deduct for things you already told us about.',
  },
  {
    icon: Microscope,
    title: 'Repair it properly',
    body: 'Component-level work under a microscope, not part-swapping. We show you the old part and we do not fix faults you did not ask about.',
  },
  {
    icon: Recycle,
    title: 'Keep devices in use',
    body: 'Every phone we buy is data-wiped, resold or responsibly recycled. A second-hand phone that still works beats a landfill.',
  },
];

const TEAM = [
  { name: 'Rishi Patel', role: 'Founder & Device Buyer', icon: Sparkles },
  { name: 'Nisha Desai', role: 'Head of Repairs', icon: Microscope },
  { name: 'Imran Sheikh', role: 'Trade-in Lead', icon: Recycle },
  { name: 'Kavya Rao', role: 'Customer Experience', icon: Users },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ])}
      />

      <section className="light-section pb-16 pt-12 sm:pb-20 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="light-aurora" />
          <div className="light-grid" />
        </div>
        <div className="container">
          <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'About' }]} dark />
          <div className="mt-6 max-w-3xl">
            <h1 className="text-display-lg font-extrabold text-ink-900">
              We built the phone shop we wanted to walk into.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-ink-600 sm:text-lg">
              MobilExpertX started in 2019 with one workbench and a simple frustration:
              nobody would tell you the actual condition of a refurbished phone, or the
              real trade-in value, or whether a repair was worth doing.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-600 sm:text-lg">
              Seven years later we sell phones, buy them back, and fix them under one
              roof — and we publish the numbers before you commit to anything.
            </p>
          </div>
        </div>
      </section>

      <section className="section-tight bg-white">
        <div className="container">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-surface-200 lg:grid-cols-4">
            {companyStats.map((stat) => (
              <div key={stat.label} className="bg-white px-6 py-8 text-center">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block bg-brand-gradient bg-clip-text text-3xl font-extrabold text-transparent">
                    {stat.value}
                  </span>
                  <span className="mt-1 block text-xs uppercase tracking-wider text-ink-500">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section bg-surface-50">
        <div className="container">
          <SectionHeading
            eyebrow="How we work"
            title="Four things we refuse to compromise on"
            align="center"
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {VALUES.map((value) => (
              <li
                key={value.title}
                className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500">
                  <value.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-lg font-bold tracking-tight text-ink-900">
                  {value.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{value.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <SectionHeading eyebrow="The team" title="Who you will actually deal with" />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member) => (
              <li
                key={member.name}
                className="rounded-3xl border border-surface-200 bg-surface-50 p-6 text-center"
              >
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-soft">
                  <member.icon className="h-7 w-7 text-brand-500" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-bold text-ink-900">{member.name}</h3>
                <p className="mt-1 text-xs text-ink-500">{member.role}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/shop">Browse phones</ButtonLink>
            <ButtonLink href="/sell-phone" variant="outline">
              Sell your phone
            </ButtonLink>
            <ButtonLink href="/repair" variant="ghost">
              Book a repair
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="section border-t border-surface-200 bg-surface-50">
        <div className="container">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow={hasAddress ? 'Visit us' : 'Talk to us'}
                title={hasAddress ? 'Come see the workshop' : 'You speak to the owner'}
                description={
                  hasAddress
                    ? 'The repair bench is behind the shop floor. If you want to see how a device is actually serviced, you are welcome to watch.'
                    : 'No call centre, no ticket queue. Message or call and you are talking to the person who does the work.'
                }
              />
              <div className="mt-6 not-italic text-sm leading-relaxed text-ink-600">
                {hasAddress ? (
                  <address className="flex items-start gap-2.5">
                    <Building2
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                      aria-hidden="true"
                    />
                    <span>
                      {addressLines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </span>
                  </address>
                ) : (
                  /* No public address yet — point people at the person instead. */
                  <p className="flex items-start gap-2.5">
                    <Building2
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                      aria-hidden="true"
                    />
                    <span>
                      Run by{' '}
                      <span className="font-semibold text-ink-900">
                        {siteConfig.ownerName}
                      </span>
                      . Walk-ins are welcome — message ahead so a technician is free.
                    </span>
                  </p>
                )}
                <p className="mt-3">Open {siteConfig.hours.display}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={buildWhatsAppUrl(
                    siteConfig.contact.whatsapp,
                    whatsappMessages.general(),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Message on WhatsApp
                </a>
                <a
                  href={buildTelUrl(siteConfig.contact.phone)}
                  className="inline-flex items-center gap-2 rounded-full border border-surface-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-400"
                >
                  Call {siteConfig.contact.phoneDisplay}
                </a>
              </div>
            </div>
            <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft">
              <h2 className="text-sm font-bold text-ink-900">Why buy locally?</h2>
              <ul className="mt-4 space-y-3 text-sm text-ink-600">
                {[
                  'See the actual device before you pay — no parcel-of-unknowns.',
                  'Trade in your old phone in the same visit and credit it instantly.',
                  'Get repairs and buybacks from the same people who stand behind the work.',
                  'A real person on WhatsApp, seven days a week.',
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <ContactCTA />
    </>
  );
}


