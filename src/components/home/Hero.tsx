'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useRef } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { ProductVisual } from '@/components/product/ProductVisual';
import { heroBadges } from '@/data/catalog';
import { products } from '@/data/products';
import { buildWhatsAppUrl, siteConfig, whatsappMessages } from '@/lib/config';
import { formatPrice } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/components/providers/MotionProvider';
import { stagger, staggerItem } from '@/lib/motion';

/**
 * The WebGL hero is code-split: Three.js is only downloaded on the home page,
 * and only once this canvas is about to paint.
 */
const HeroPhoneScene = dynamic(() => import('@/components/three/HeroPhoneScene'), {
  ssr: false,
  loading: () => <HeroFallback />,
});

const BADGE_ICONS = {
  'shield-check': ShieldCheck,
  wrench: Wrench,
  lock: Lock,
  'badge-check': BadgeCheck,
} as const;

/** Pure-CSS hero used while the 3D chunk loads, and for reduced motion. */
function HeroFallback() {
  return (
    <div className="phone-3d absolute inset-0 grid place-items-center">
      <div className="relative h-[62%] w-[32%] max-w-[190px] animate-float">
        <ProductVisual
          alt="Flagship smartphone"
          accent="#2563FF"
          colors={[{ name: 'Titanium', hex: '#1B2233', gradient: ['#3C4759', '#0B0F18'] }]}
          name="Flagship smartphone"
          rounded="rounded-none"
          className="h-full w-full"
        />
      </div>
    </div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const featured = products[0];

  // Pointer position drives a subtle parallax on the copy column.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 80, damping: 20, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 80, damping: 20, mass: 0.6 });
  const copyX = useTransform(sx, [-0.5, 0.5], [14, -14]);
  const copyY = useTransform(sy, [-0.5, 0.5], [10, -10]);

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduced || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section
      ref={sectionRef}
      onPointerMove={onPointerMove}
      aria-labelledby="hero-heading"
      className="dark-section relative isolate overflow-hidden bg-ink-900 pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-28 lg:pt-20"
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-aurora opacity-90" />
        <div className="absolute inset-0 bg-grid-dark bg-grid opacity-25 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000,transparent)]" />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/18 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-40 w-full bg-gradient-to-t from-ink-900 to-transparent" />
      </div>

      <div className="container relative">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-6">
          {/* ── Copy ──────────────────────────────────────────────────── */}
          <motion.div
            style={reduced ? undefined : { x: copyX, y: copyY }}
            className="lg:col-span-6"
          >
            <motion.div variants={stagger(0.08, 0.05)} initial="hidden" animate="show">
              <motion.p
                variants={staggerItem}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-md"
              >
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                Trusted by 12,400+ customers across India
              </motion.p>

              <motion.h1
                id="hero-heading"
                variants={staggerItem}
                className="mt-6 text-display-lg font-extrabold text-white"
              >
                Your Phone.
                <br />
                Your Upgrade.
                <br />
                <span className="bg-brand-gradient bg-clip-text text-transparent">
                  Your Expert.
                </span>
              </motion.h1>

              <motion.p
                variants={staggerItem}
                className="mt-6 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg"
              >
                Buy premium smartphones, sell your old device, get expert repairs,
                and shop genuine accessories — all in one place.
              </motion.p>

              <motion.div variants={staggerItem} className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/shop" size="lg">
                  Shop Phones
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="/sell-phone" size="lg" variant="dark">
                  Sell Your Phone
                </ButtonLink>
                <ButtonLink
                  href="/repair"
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  Book a Repair
                </ButtonLink>
              </motion.div>

              {/* Floating trust badges */}
              <motion.ul
                variants={staggerItem}
                className="mt-10 grid grid-cols-2 gap-2.5 sm:max-w-lg sm:grid-cols-4"
              >
                {heroBadges.map((badge) => {
                  const Icon = BADGE_ICONS[badge.icon];
                  return (
                    <li
                      key={badge.label}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/8"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
                      <span className="text-[11px] font-semibold leading-tight text-white/75">
                        {badge.label}
                      </span>
                    </li>
                  );
                })}
              </motion.ul>
            </motion.div>
          </motion.div>

          {/* ── 3D device ─────────────────────────────────────────────── */}
          <div className="relative lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="relative mx-auto aspect-square w-full max-w-[540px]"
            >
              {reduced ? <HeroFallback /> : <HeroPhoneScene color="#1B2233" accent="#2563FF" />}

              {/* Floating price chip */}
              <motion.div
                animate={reduced ? {} : { y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-0 top-[18%] sm:left-2"
              >
                <Link
                  href={`/shop/${featured.slug}`}
                  className="block rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl transition-colors hover:bg-white/15"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    Flagship pick
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-white">{featured.name}</p>
                  <p className="text-xs font-semibold text-cyan-400">
                    {formatPrice(featured.price)}
                  </p>
                </Link>
              </motion.div>

              {/* Floating rating chip */}
              <motion.div
                animate={reduced ? {} : { y: [0, 12, 0] }}
                transition={{
                  duration: 6.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.6,
                }}
                className="absolute bottom-[16%] right-0 sm:right-2"
              >
                <div className="rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-xl">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    Customer rating
                  </p>
                  <p className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-lg font-extrabold text-white">
                      {featured.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-white/50">/ 5.0</span>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="container mt-12 hidden lg:block"
        aria-hidden="true"
      >
        <div className="flex items-center gap-3 text-xs font-medium text-white/30">
          <span className="flex h-9 w-[22px] items-start justify-center rounded-full border border-white/15 pt-1.5">
            <motion.span
              animate={reduced ? {} : { y: [0, 9, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
              className="block h-1.5 w-0.5 rounded-full bg-white/50"
            />
          </span>
          Scroll to explore
        </div>
      </motion.div>
    </section>
  );
}
