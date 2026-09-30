'use client';

import { m } from 'framer-motion';
import { ArrowRight, Clock, Phone, Wrench } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { RepairIcon } from '@/components/repair/RepairIcon';
import { repairServices } from '@/data/repairs';
import { siteConfig } from '@/lib/config';
import { formatPrice } from '@/lib/utils';
import { stagger, staggerItem, viewportOnce } from '@/lib/motion';
/**
 * Home-page repair teaser.
 *
 * Six services, not eleven — the full list lives on /repair. Each card links
 * to its own service page, which is also how these rank for long-tail
 * searches like "screen replacement Ahmedabad".
 */
export function RepairSection() {
  // Popular services first, then fill up to six.
  const shown = [
    ...repairServices.filter((s) => s.popular),
    ...repairServices.filter((s) => !s.popular),
  ].slice(0, 6);
  return (
    <section className="section bg-surface-50" aria-labelledby="repair-heading">
      <div className="container">
        <SectionHeading
          id="repair-heading"
          eyebrow="Expert repairs"
          title="Fixed by people who do this every day"
          description="Component-level work under a microscope by technicians with 8+ years on real hardware — with an upfront quote before we touch anything."
          action={
            <ButtonLink href="/repair" variant="outline">
              All repair services
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          }
        />
        <m.ul
          variants={stagger(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {shown.map((service) => (
            <m.li key={service.id} variants={staggerItem}>
              <a
                href={`/repair/${service.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white p-6 shadow-soft transition-all duration-400 ease-premium hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-lift"
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
                <div className="mt-5 space-y-2 border-t border-surface-200 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5 text-ink-500">
                      <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                      From
                    </span>
                    <span className="font-bold tabular-nums text-ink-900">
                      {formatPrice(service.startingPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5 text-ink-500">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      Turnaround
                    </span>
                    <span className="font-semibold text-ink-700">{service.turnaround}</span>
                  </div>
                </div>
              </a>
            </m.li>
          ))}
        </m.ul>
        <div className="mt-10 rounded-3xl border border-surface-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <h3 className="text-lg font-bold tracking-tight text-ink-900">
                Not sure what is wrong?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Book a general diagnostics appointment. You get a written report with
                photographs of anything we find, an honest repair-vs-replace
                recommendation, and the fee is waived if you go ahead with the repair.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/repair#book">Book a repair</ButtonLink>
              <a
                href={`tel:${siteConfig.contact.repairPhone}`}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-surface-300 bg-white px-5 text-sm font-semibold text-ink-900 transition-colors hover:border-brand-300 hover:text-brand-600"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call for repair
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
