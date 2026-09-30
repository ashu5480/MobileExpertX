'use client';

import { m, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Bolt,
  IndianRupee,
  RefreshCw,
  Repeat,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useRef } from 'react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { phoneCategories } from '@/data/catalog';
import { ProductVisual } from '@/components/product/ProductVisual';
import { products } from '@/data/products';
import { fadeUp, stagger, staggerItem, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';
const ICONS = {
  sparkles: Sparkles,
  bolt: Bolt,
  wallet: Wallet,
  repeat: Repeat,
  refresh: RefreshCw,
} as const;
/**
 * "Shop by category" — the primary discovery surface on the home page.
 *
 * Parallax is applied to the background only (via `useScroll`), never to the
 * cards themselves, so reading and tapping stay rock steady while the section
 * still feels alive.
 */
export function CategoryGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  return (
    <section className="section bg-surface-50" aria-labelledby="categories-heading">
      <div className="container">
        <SectionHeading
          id="categories-heading"
          eyebrow="Shop by category"
          title="Find your next phone, faster"
          description="Five clear ways in — from uncompromising flagships to Grade-A refurbished value."
          action={
            <Link
              href="/shop"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              Explore the shop
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          }
        />
        <m.div
          ref={ref}
          variants={stagger(0.07)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {phoneCategories.map((category, i) => {
            const Icon = ICONS[category.icon];
            const sample = products.find((p) => p.category === category.id) ?? products[i];
            const isWide = category.id === 'refurbished';
            return (
              <m.div key={category.id} variants={staggerItem} className={cn(isWide && 'sm:col-span-2')}>
                <Link
                  href={category.href}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white p-6 shadow-soft transition-all duration-500 ease-premium hover:-translate-y-1.5 hover:border-transparent hover:shadow-lift"
                >
                  {/* Tinted wash that grows on hover */}
                  <span
                    className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: category.accent }}
                    aria-hidden="true"
                  />
                  <div className="relative flex items-start justify-between gap-4">
                    <span
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-transform duration-500 group-hover:scale-110"
                      style={{ background: `${category.accent}14`, color: category.accent }}
                    >
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div
                      className="pointer-events-none absolute -bottom-2 right-0 h-28 w-20 opacity-25 transition-all duration-500 group-hover:scale-110 group-hover:opacity-45"
                      aria-hidden="true"
                    >
                      <ProductVisual
                        alt={category.label}
                        accent={category.accent}
                        colors={sample?.colors}
                        name={category.label}
                        rounded="rounded-none"
                        className="h-full w-full"
                      />
                    </div>
                  </div>
                  <div className="relative mt-5 flex-1">
                    <p
                      className="text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: category.accent }}
                    >
                      {category.tagline}
                    </p>
                    <h3 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink-900">
                      {category.label}
                    </h3>
                    <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-600">
                      {category.description}
                    </p>
                  </div>
                  <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                    Browse
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </m.div>
            );
          })}
        </m.div>
      </div>
    </section>
  );
}
