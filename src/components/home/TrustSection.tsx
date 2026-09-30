'use client';

import { m } from 'framer-motion';
import {
  Headset,
  IndianRupee,
  Lock,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { trustPillars } from '@/data/catalog';
import { cn } from '@/lib/utils';
import { stagger, staggerItem, viewportOnce } from '@/lib/motion';
const ICONS = {
  'shield-check': ShieldCheck,
  'indian-rupee': IndianRupee,
  wrench: Wrench,
  lock: Lock,
  truck: Truck,
  headset: Headset,
} as const;
/**
 * "Why choose us" trust section.
 *
 * The one place the accent is used as a border wash rather than a fill —
 * six colourful cards would look like a template, but six bordered cards with
 * a glowing icon on hover still feel alive.
 */
export function TrustSection() {
  return (
    <section className="section relative overflow-hidden bg-surface-50" aria-labelledby="trust-heading">
      <div className="pointer-events-none absolute inset-0 bg-grid-light bg-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000,transparent)]" aria-hidden="true" />
      <div className="container relative">
        <SectionHeading
          id="trust-heading"
          eyebrow="Why MobilExpertX"
          title="Six reasons people keep coming back"
          description="We are not the only phone shop. These are the things we actually do differently."
          align="center"
        />
        <m.ul
          variants={stagger(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {trustPillars.map((pillar) => {
            const Icon = ICONS[pillar.icon as keyof typeof ICONS];
            return (
              <m.li
                key={pillar.title}
                variants={staggerItem}
                className="group relative"
              >
                <div
                  className={cn(
                    'relative h-full overflow-hidden rounded-3xl border border-surface-200 bg-white p-6',
                    'transition-all duration-400 ease-premium',
                    'hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-lift',
                  )}
                >
                  {/* Accent wash revealed on hover */}
                  <span
                    className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-500/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                  <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500 transition-all duration-400 group-hover:bg-brand-gradient group-hover:text-white group-hover:shadow-glow">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="relative mt-5 text-lg font-bold tracking-tight text-ink-900">
                    {pillar.title}
                  </h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-ink-600">
                    {pillar.body}
                  </p>
                </div>
              </m.li>
            );
          })}
        </m.ul>
      </div>
    </section>
  );
}
