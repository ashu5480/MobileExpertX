'use client';

import { m, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, BatteryCharging, Recycle, ShieldCheck, Sparkles } from 'lucide-react';
import { useRef } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ProductCard } from '@/components/product/ProductCard';
import { products } from '@/data/products';
import { stagger, staggerItem, viewportOnce } from '@/lib/motion';
import { usePrefersReducedMotion } from '@/components/providers/MotionProvider';
/**
 * "Buy refurbished" — a dark band that breaks up the white page and gives the
 * value proposition room to breathe. The phone drifts with a slow parallax
 * while the copy column reveals on scroll.
 */
export function RefurbishedSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const refurbished = products.filter((p) => p.condition === 'refurbished').slice(0, 3);
  return (
    <section
      ref={ref}
      className="light-section-tint py-20 sm:py-24"
      aria-labelledby="refurbished-heading"
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="light-aurora" />
        <div className="light-grid" />
      </div>
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <m.div
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <m.p
              variants={staggerItem}
              className="light-chip px-3.5 py-1.5"
            >
              <Recycle className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
              Grade-A refurbished
            </m.p>
            <m.h2
              id="refurbished-heading"
              variants={staggerItem}
              className="mt-6 text-display-sm font-extrabold text-ink-900"
            >
              Flagship quality.
              <br />
              <span className="bg-brand-gradient bg-clip-text text-transparent">
                Up to 40% less.
              </span>
            </m.h2>
            <m.p
              variants={staggerItem}
              className="mt-5 max-w-lg text-base leading-relaxed text-ink-600"
            >
              Our refurbished phones are never B-grade sold as A. Every unit gets
              a replacement battery, a calibrated display, a zeroed data partition
              and a 42-point inspection — with the exact battery health published
              before you buy.
            </m.p>
            <m.ul
              variants={staggerItem}
              className="mt-8 grid gap-3 sm:grid-cols-3"
            >
              {[
                { icon: BatteryCharging, label: 'New battery', detail: '85%+ health' },
                { icon: ShieldCheck, label: '90-day warranty', detail: 'Battery & display' },
                { icon: Sparkles, label: '42-point tested', detail: 'Every single unit' },
              ].map((item) => (
                <li
                  key={item.label}
                  className="rounded-2xl border border-surface-200 bg-white/85 p-4 shadow-soft backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card"
                >
                  <item.icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                  <p className="mt-2.5 text-sm font-bold text-ink-900">{item.label}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{item.detail}</p>
                </li>
              ))}
            </m.ul>
            <m.div variants={staggerItem} className="mt-8">
              <ButtonLink href="/shop?condition=refurbished" size="lg">
                Shop refurbished
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            </m.div>
          </m.div>
          {/* Drifting cards */}
          <m.div
            style={reduced ? undefined : { y }}
            className="grid grid-cols-2 gap-4 sm:gap-5"
          >
            {refurbished.map((product, i) => (
              <div
                key={product.id}
                className={i === 0 ? 'col-span-2' : undefined}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </m.div>
        </div>
      </div>
    </section>
  );
}
