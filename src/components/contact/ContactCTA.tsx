'use client';

import { m } from 'framer-motion';
import { Clock, Mail, MapPin, MessageCircle, Phone, User } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import {
  addressOneLine,
  buildTelUrl,
  buildWhatsAppUrl,
  hasAddress,
  siteConfig,
  whatsappMessages,
} from '@/lib/config';
import { stagger, staggerItem, viewportOnce } from '@/lib/motion';
/**
 * Closing contact CTA.
 *
 * Three equally-weighted routes to a human — WhatsApp, phone, visit — because
 * different customers want different things, and picking for them is the
 * fastest way to lose the sale.
 */
export function ContactCTA() {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20" aria-labelledby="contact-heading">
      <div className="container">
        <m.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="light-section rounded-4xl border border-surface-200 bg-white px-6 py-12 shadow-card sm:px-10 sm:py-14 lg:px-16"
        >
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <div className="light-aurora" />
            <div className="light-grid" />
          </div>
          <div className="mx-auto max-w-3xl text-center">
            <m.h2
              id="contact-heading"
              variants={staggerItem}
              className="text-display-sm font-extrabold text-ink-900"
            >
              Need help choosing?
            </m.h2>
            <m.p
              variants={staggerItem}
              className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-600"
            >
              Talk to someone who actually knows the difference between the A17
              Pro and the 8 Gen 3. No call-centre scripts, no pressure to buy.
            </m.p>
            <m.div variants={staggerItem} className="mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={buildWhatsAppUrl(
                  siteConfig.contact.whatsapp,
                  whatsappMessages.needHelp('choosing a phone'),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex h-13 items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#25D366] px-7 text-[15px] font-semibold text-white shadow-[0_18px_48px_-12px_rgba(37,211,102,0.55)] transition-all duration-300 hover:brightness-105"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <MessageCircle className="relative z-10 h-5 w-5" aria-hidden="true" />
                <span className="relative z-10">Chat on WhatsApp</span>
              </a>
              <a
                href={buildTelUrl(siteConfig.contact.phone, whatsappMessages.general())}
                className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-surface-300 bg-white px-7 text-[15px] font-semibold text-ink-800 shadow-soft transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                <Phone className="h-5 w-5" aria-hidden="true" />
                Call {siteConfig.contact.phoneDisplay}
              </a>
              <ButtonLink href="/contact" size="lg" variant="secondary">
                All contact options
              </ButtonLink>
            </m.div>
          </div>
          {/* Practical details */}
          <m.dl
            variants={staggerItem}
            className="mt-12 grid gap-4 border-t border-surface-200 pt-8 sm:grid-cols-3"
          >
            {[
              {
                icon: Clock,
                label: 'Opening hours',
                value: siteConfig.hours.display,
              },
              {
                icon: Mail,
                label: 'Email us',
                value: siteConfig.contact.email,
                href: `mailto:${siteConfig.contact.email}`,
              },
              // The storefront address is optional — swap this row for the
              // owner when no public address has been published.
              hasAddress
                ? {
                    icon: MapPin,
                    label: 'Visit the store',
                    value: addressOneLine,
                  }
                : {
                    icon: User,
                    label: 'Talk to',
                    value: siteConfig.ownerName,
                  },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <item.icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 text-sm text-ink-800">
                    {item.href ? (
                      <a href={item.href} className="transition-colors hover:text-brand-700">
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              </div>
            ))}
          </m.dl>
        </m.div>
      </div>
    </section>
  );
}
