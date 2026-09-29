'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ProductCard } from '@/components/product/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { QuickViewModal } from '@/components/product/QuickViewModal';
import { products } from '@/data/products';
import { fadeUp, stagger, staggerItem } from '@/lib/motion';
import { usePrefersReducedMotion } from '@/components/providers/MotionProvider';
import type { Product } from '@/types';

const TABS = [
  { id: 'new', label: 'New' },
  { id: 'refurbished', label: 'Refurbished' },
  { id: 'best-seller', label: 'Best Sellers' },
  { id: 'deal', label: 'Deals' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/**
 * "Trending Phones" — tabbed product rail.
 *
 * On desktop the grid is a normal responsive grid; on mobile it becomes a
 * native snap-scrolling rail, which is the interaction people expect on a
 * phone and keeps the swipe momentum feeling native.
 */
export function TrendingPhones() {
  const [tab, setTab] = useState<TabId>('new');
  const [quickView, setQuickView] = useState<Product | null>(null);

  const visible = useMemo(() => {
    const byTag = (tag: (typeof TABS)[number]['id']) =>
      products.filter((p) => p.tags.includes(tag));
    // Every tab is guaranteed at least a few items in the catalogue; the
    // fallback keeps the section populated if the catalogue is trimmed.
    return byTag(tab).length ? byTag(tab) : products.slice(0, 8);
  }, [tab]);

  return (
    <section className="section bg-white" aria-labelledby="trending-heading">
      <div className="container">
        <SectionHeading
          id="trending-heading"
          eyebrow="Trending now"
          title="Phones people are buying"
          description="Hand-picked from what is actually moving this month — from ₹14,000 flagships to ₹1.3 lakh titans."
          action={
            <ButtonLink href="/shop" variant="outline" size="md">
              View all phones
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          }
        />

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Filter products by type"
          className="mt-8 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((item) => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                type="button"
                aria-selected={selected}
                onClick={() => setTab(item.id)}
                className="relative shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
              >
                {selected && (
                  <motion.span
                    layoutId="trending-tab"
                    className="absolute inset-0 rounded-xl bg-ink-900"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span
                  className={
                    selected
                      ? 'relative z-10 text-white'
                      : 'relative z-10 text-ink-600 hover:text-ink-900'
                  }
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid — rail on mobile, grid from sm up */}
        <motion.div
          key={tab}
          variants={stagger(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="scroll-rail mask-fade-r mt-7 grid grid-cols-2 gap-4 overflow-visible sm:gap-5 lg:grid-cols-4"
        >
          {visible.slice(0, 8).map((product, i) => (
            <motion.div
              key={product.id}
              variants={staggerItem}
              className="w-[68vw] shrink-0 sm:w-auto"
            >
              <ProductCard
                product={product}
                onQuickView={setQuickView}
                priority={i < 4}
              />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-8 text-center sm:hidden">
          <ButtonLink href="/shop" variant="outline" fullWidth>
            View all phones
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>

      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </section>
  );
}
