'use client';

import { m } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ButtonLink } from '@/components/ui/Button';
import { AccessoryVisual } from '@/components/product/ProductVisual';
import { Rating } from '@/components/ui/Rating';
import { accessories } from '@/data/accessories';
import { accessoryCategories } from '@/data/catalog';
import { discountPercent, formatPrice } from '@/lib/utils';
import { fadeUp, stagger, staggerItem, viewportOnce } from '@/lib/motion';
import { usePrefersReducedMotion } from '@/components/providers/MotionProvider';
/**
 * Home-page accessories strip.
 *
 * A grid of category tiles with one floating product each, and a rail of
 * best-sellers beneath. Deliberately light: no extra client state, and no
 * per-item animation beyond a scroll reveal.
 */
export function AccessoriesSection() {
  const featured = accessories.slice(0, 4);
  const reduced = usePrefersReducedMotion();
  return (
    <section className="section bg-white" aria-labelledby="accessories-heading">
      <div className="container">
        <SectionHeading
          id="accessories-heading"
          eyebrow="Genuine accessories"
          title="Everything your phone needs"
          description="Chargers that actually fast-charge, cables that survive real use, and cases that fit properly. No filler."
          action={
            <ButtonLink href="/accessories" variant="outline">
              Shop all accessories
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          }
        />
        <m.ul
          variants={stagger(0.05)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          {accessoryCategories.slice(0, 8).map((category, i) => {
            const product =
              accessories.find((a) => a.category === category.id) ?? accessories[i];
            return (
              <m.li key={category.id} variants={staggerItem}>
                <Link
                  href={`/accessories?category=${category.id}`}
                  className="group relative flex aspect-square flex-col overflow-hidden rounded-3xl border border-surface-200 bg-surface-50 p-4 transition-all duration-400 ease-premium hover:-translate-y-1.5 hover:border-brand-200 hover:bg-white hover:shadow-lift sm:p-5"
                >
                  <m.span
                    animate={reduced ? {} : { y: [0, -6, 0] }}
                    transition={{
                      duration: 5 + (i % 4),
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.18,
                    }}
                    className="pointer-events-none absolute inset-x-4 bottom-10 top-4"
                    aria-hidden="true"
                  >
                    <AccessoryVisual accent={product.accent} name={product.name} image={product.image} alt={product.name} />
                  </m.span>
                  <div className="relative mt-auto">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-brand-500">
                      {category.label}
                    </p>
                    <h3 className="mt-0.5 text-[11px] leading-snug text-ink-500 sm:text-xs">
                      {product.name}
                    </h3>
                  </div>
                  <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white text-ink-700 opacity-0 shadow-soft transition-opacity duration-300 group-hover:opacity-100">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              </m.li>
            );
          })}
        </m.ul>
        {/* Best sellers */}
        <m.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12"
        >
          <h3 className="text-lg font-bold tracking-tight text-ink-900">
            Best-selling accessories
          </h3>
          <ul className="scroll-rail mask-fade-r mt-5 grid grid-cols-2 gap-4 overflow-visible sm:gap-5 lg:grid-cols-4">
            {featured.map((item) => {
              const off = discountPercent(item.price, item.mrp);
              return (
                <li key={item.id} className="w-[68vw] shrink-0 sm:w-auto">
                  <Link
                    href={`/accessories/${item.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-soft transition-all duration-400 ease-premium hover:-translate-y-1.5 hover:shadow-lift"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <AccessoryVisual accent={item.accent} name={item.name} image={item.image} alt={item.name} />
                      {off > 0 && (
                        <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white">
                          {off}% OFF
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                        {item.brand}
                      </p>
                      <h4 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink-900 transition-colors group-hover:text-brand-600">
                        {item.name}
                      </h4>
                      <Rating value={item.rating} size={11} className="mt-1.5" />
                      <div className="mt-auto flex items-baseline gap-2 pt-3">
                        <span className="text-base font-extrabold text-ink-900">
                          {formatPrice(item.price)}
                        </span>
                        {off > 0 && (
                          <span className="text-xs text-ink-400 line-through">
                            {formatPrice(item.mrp)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </m.div>
      </div>
    </section>
  );
}
