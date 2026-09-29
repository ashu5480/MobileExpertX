'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { ProductVisual } from '@/components/product/ProductVisual';
import { products } from '@/data/products';
import { formatPrice } from '@/lib/utils';
import { stagger, staggerItem, viewportOnce } from '@/lib/motion';
import { usePrefersReducedMotion } from '@/components/providers/MotionProvider';

/**
 * "Upgrade Today" — the promotional band.
 *
 * A full-bleed dark panel with a large phone visual and one very clear call to
 * action. A single strong offer beats a wall of coupons.
 */
export function OffersSection() {
  const newPhone = products[0];
  const tradeIn = products.find((p) => p.condition === 'refurbished') ?? products[1];
  const reduced = usePrefersReducedMotion();
  const tradeInCredit = 2450000;

  return (
    <section className="section bg-white" aria-labelledby="offers-heading">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="dark-section relative isolate overflow-hidden rounded-4xl bg-ink-900 px-6 py-12 sm:px-10 sm:py-16 lg:px-16"
        >
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <div className="absolute inset-0 bg-aurora opacity-80" />
            <div className="absolute inset-0 bg-grid-dark bg-grid opacity-20 [mask-image:radial-gradient(ellipse_at_center,#000,transparent_75%)]" />
            <div className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-brand-500/25 blur-[100px]" />
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={viewportOnce}>
              <motion.span
                variants={staggerItem}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md"
              >
                <TrendingUp className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                Upgrade offer
              </motion.span>

              <motion.h2
                id="offers-heading"
                variants={staggerItem}
                className="mt-6 text-display-sm font-extrabold text-white"
              >
                Upgrade today.
                <br />
                <span className="bg-brand-gradient bg-clip-text text-transparent">
                  Get more from your old phone.
                </span>
              </motion.h2>

              <motion.p
                variants={staggerItem}
                className="mt-5 max-w-lg text-base leading-relaxed text-white/60"
              >
                Trade in your current device and we credit its full quoted value
                straight against your next phone — in store, in one visit, with
                the paperwork handled for you.
              </motion.p>

              {/* Saving maths, shown transparently */}
              <motion.dl variants={staggerItem} className="mt-8 grid max-w-md grid-cols-3 gap-3">
                {[
                  { label: 'New phone', value: formatPrice(newPhone.price, { compact: true }), hi: false },
                  { label: 'Old phone', value: '−₹24,500', hi: false },
                  { label: 'You pay', value: formatPrice(newPhone.price - tradeInCredit, { compact: true }), hi: true },
                ].map((row) => (
                  <div
                    key={row.label}
                    className={
                      row.hi
                        ? 'rounded-2xl border border-cyan-400/25 bg-cyan-400/10 p-3.5'
                        : 'rounded-2xl border border-white/10 bg-white/5 p-3.5'
                    }
                  >
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                      {row.label}
                    </dt>
                    <dd
                      className={
                        row.hi
                          ? 'mt-1 text-base font-extrabold text-cyan-300'
                          : 'mt-1 text-base font-bold text-white'
                      }
                    >
                      {row.value}
                    </dd>
                  </div>
                ))}
              </motion.dl>

              <motion.p variants={staggerItem} className="mt-3 text-xs text-white/40">
                Indicative example using a {newPhone.name} trade-in. Final value
                confirmed after a free inspection.
              </motion.p>

              <motion.div variants={staggerItem} className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/sell-phone" size="lg">
                  Check your phone&apos;s value
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="/shop" size="lg" variant="dark">
                  Browse upgrade options
                </ButtonLink>
              </motion.div>
            </motion.div>

            {/* Phones */}
            <div className="relative mx-auto h-[340px] w-full max-w-md sm:h-[400px]">
              <motion.div
                animate={reduced ? {} : { y: [0, -12, 0] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-0 top-1/2 w-[46%] -translate-y-1/2"
              >
                <div className="aspect-[9/18] w-full">
                  <ProductVisual
                    image={newPhone.images[0]}
                    alt={newPhone.name}
                    accent={newPhone.accent}
                    colors={newPhone.colors}
                    name={newPhone.name}
                    rounded="rounded-none"
                    className="h-full w-full"
                  />
                </div>
              </motion.div>

              <motion.div
                animate={reduced ? {} : { y: [0, 12, 0] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
                className="absolute right-0 top-1/2 w-[46%] -translate-y-1/2"
              >
                <div className="aspect-[9/18] w-full">
                  <ProductVisual
                    image={tradeIn.images[0]}
                    alt={tradeIn.name}
                    accent={tradeIn.accent}
                    colors={tradeIn.colors}
                    name={tradeIn.name}
                    rounded="rounded-none"
                    className="h-full w-full"
                  />
                </div>
              </motion.div>

              <motion.div
                animate={reduced ? {} : { y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-1/2 top-0 -translate-x-1/2"
              >
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-center backdrop-blur-xl">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    Instant credit
                  </p>
                  <p className="text-lg font-extrabold text-cyan-300">₹24,500</p>
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2"
                animate={reduced ? {} : { opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="h-6 w-6 text-white/30" aria-hidden="true" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
