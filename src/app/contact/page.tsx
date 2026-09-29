import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ContactForm } from '@/components/contact/ContactForm';
import { Avatar } from '@/components/ui/Avatar';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import {
  addressLines,
  buildTelUrl,
  buildWhatsAppUrl,
  hasAddress,
  siteConfig,
  whatsappMessages,
} from '@/lib/config';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

export const metadata: Metadata = buildMetadata({
  title: 'Contact Us',
  description:
    'Talk to MobilExpertX on WhatsApp, by phone, or by email. Real people, seven days a week.',
  path: '/contact',
  keywords: ['contact MobilExpertX', 'phone store Ahmedabad', 'mobile repair contact'],
});

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' },
        ])}
      />

      <div className="border-b border-surface-200 bg-surface-50">
        <div className="container py-8 sm:py-10">
          <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Contact' }]} />
          <h1 className="mt-4 text-display-sm font-extrabold tracking-tight text-ink-900">
            Get in touch
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">
            WhatsApp is fastest, but call, email or walk in — all three reach the same
            small team.
          </p>
        </div>
      </div>

      <div className="section-tight">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
            <aside className="space-y-4">
              <a
                id="whatsapp"
                href={buildWhatsAppUrl(
                  siteConfig.contact.whatsapp,
                  whatsappMessages.needHelp(),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 rounded-3xl bg-[#25D366] p-5 text-white shadow-[0_18px_48px_-14px_rgba(37,211,102,0.5)] transition-all hover:brightness-105"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-bold">WhatsApp</span>
                  <span className="mt-0.5 block text-sm opacity-90">
                    +{siteConfig.contact.whatsappDisplay}
                  </span>
                  <span className="mt-1 block text-xs opacity-75">
                    Replies in minutes during business hours
                  </span>
                </span>
              </a>

              <a
                id="call"
                href={buildTelUrl(
                  siteConfig.contact.phone,
                  whatsappMessages.general(),
                )}
                className="flex items-start gap-4 rounded-3xl border border-surface-200 bg-white p-5 shadow-soft transition-colors hover:border-brand-300"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-500/10 text-brand-500">
                  <Phone className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink-900">
                    Sales &amp; support
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-700">
                    +{siteConfig.contact.phoneDisplay}
                  </span>
                </span>
              </a>

              <a
                href={buildTelUrl(
                  siteConfig.contact.repairPhone,
                  whatsappMessages.bookRepair(),
                )}
                className="flex items-start gap-4 rounded-3xl border border-surface-200 bg-white p-5 shadow-soft transition-colors hover:border-brand-300"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-purple-500/10 text-purple-600">
                  <Phone className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink-900">Repair desk</span>
                  <span className="mt-0.5 block text-sm text-ink-700">
                    +{siteConfig.contact.repairPhoneDisplay}
                  </span>
                </span>
              </a>

              <a
                id="email"
                href={`mailto:${siteConfig.contact.email}`}
                className="flex items-start gap-4 rounded-3xl border border-surface-200 bg-white p-5 shadow-soft transition-colors hover:border-brand-300"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-600">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink-900">Email</span>
                  <span className="mt-0.5 block truncate text-sm text-ink-700">
                    {siteConfig.contact.email}
                  </span>
                  <span className="mt-1 block text-xs text-ink-500">
                    Support: {siteConfig.contact.supportEmail}
                  </span>
                </span>
              </a>

              {hasAddress ? (
                <div className="rounded-3xl border border-surface-200 bg-white p-5 shadow-soft">
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-100 text-ink-600">
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <address className="text-sm not-italic leading-relaxed text-ink-700">
                      <span className="block font-bold text-ink-900">Visit the store</span>
                      {addressLines.map((line) => (
                        <span key={line} className="mt-0.5 block">
                          {line}
                        </span>
                      ))}
                    </address>
                  </div>
                  <div className="mt-4 flex items-start gap-2.5 border-t border-surface-200 pt-4 text-sm">
                    <Clock
                      className="mt-0.5 h-4 w-4 shrink-0 text-ink-400"
                      aria-hidden="true"
                    />
                    <span className="text-ink-600">
                      <span className="block font-semibold text-ink-900">
                        {siteConfig.hours.weekday}
                      </span>
                      {siteConfig.hours.sunday}
                    </span>
                  </div>
                </div>
              ) : (
                /* No public address yet — lead with the person instead. */
                <div className="rounded-3xl border border-surface-200 bg-white p-5 shadow-soft">
                  <div className="flex items-start gap-4">
                    <Avatar name={siteConfig.ownerName} size={44} />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                        Owner
                      </p>
                      <p className="mt-0.5 text-base font-bold text-ink-900">
                        {siteConfig.ownerName}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-500">
                        Message or call and you will speak to a person, not a queue.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-start gap-2.5 border-t border-surface-200 pt-4 text-sm">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                    <span className="text-ink-600">
                      <span className="block font-semibold text-ink-900">
                        {siteConfig.hours.weekday}
                      </span>
                      {siteConfig.hours.sunday}
                    </span>
                  </div>
                </div>
              )}
            </aside>

            <div className="lg:col-span-2">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

