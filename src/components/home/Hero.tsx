'use client';

import { m, useTransform, useSpring, useMotionValue } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
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
          accent="#10B981"
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
      className="light-section pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-28 lg:pt-20"
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="light-aurora" />
        <div className="light-grid" />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-200/45 blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface-50 to-transparent" />
      </div>
      <div className="container relative">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-6">
          {/* ── Copy ──────────────────────────────────────────────────── */}
          <m.div
            style={reduced ? undefined : { x: copyX, y: copyY }}
            className="lg:col-span-6"
          >
            <m.div variants={stagger(0.08, 0.05)} initial="hidden" animate="show">
              <m.p
                variants={staggerItem}
                className="light-chip px-3.5 py-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                Trusted by 12,400+ customers across India
              </m.p>
              <m.h1
                id="hero-heading"
                variants={staggerItem}
                className="mt-6 text-display-lg font-extrabold text-ink-900"
              >
                Your Phone.
                <br />
                Your Upgrade.
                <br />
                <span className="bg-brand-gradient bg-clip-text text-transparent">
                  Your Expert.
                </span>
              </m.h1>
              <m.p
                variants={staggerItem}
                className="mt-6 max-w-lg text-base leading-relaxed text-ink-600 sm:text-lg"
              >
                Buy premium smartphones, sell your old device, get expert repairs,
                and shop genuine accessories — all in one place.
              </m.p>
              <m.div variants={staggerItem} className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/shop" size="lg">
                  Shop Phones
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="/sell-phone" size="lg" variant="secondary">
                  Sell Your Phone
                </ButtonLink>
                <ButtonLink
                  href="/repair"
                  size="lg"
                  variant="outline"
                  className="border-surface-300 bg-white text-ink-800 shadow-soft hover:border-brand-300 hover:bg-brand-50"
                >
                  Book a Repair
                </ButtonLink>
              </m.div>
              {/* Floating trust badges */}
              <m.ul
                variants={staggerItem}
                className="mt-10 grid grid-cols-2 gap-2.5 sm:max-w-lg sm:grid-cols-4"
              >
                {heroBadges.map((badge) => {
                  const Icon = BADGE_ICONS[badge.icon];
                  return (
                    <li
                      key={badge.label}
                      className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white/80 px-3 py-2.5 shadow-soft backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                      <span className="text-[11px] font-semibold leading-tight text-ink-700">
                        {badge.label}
                      </span>
                    </li>
                  );
                })}
              </m.ul>
            </m.div>
          </m.div>
          {/* ── 3D device ─────────────────────────────────────────────── */}
          <div className="relative lg:col-span-6">
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="relative mx-auto aspect-square w-full max-w-[540px]"
            >
              {reduced ? <HeroFallback /> : <HeroPhoneScene color="#1B2233" accent="#10B981" />}
              {/* Floating price chip */}
              <m.div
                animate={reduced ? {} : { y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-0 top-[18%] sm:left-2"
              >
                <Link
                  href={`/shop/${featured.slug}`}
                  className="block rounded-2xl border border-surface-200 bg-white/85 p-3 shadow-card backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                    Flagship pick
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-ink-900">{featured.name}</p>
                  <p className="text-xs font-semibold text-brand-600">
                    {formatPrice(featured.price)}
                  </p>
                </Link>
              </m.div>
              {/* Floating rating chip */}
              <m.div
                animate={reduced ? {} : { y: [0, 12, 0] }}
                transition={{
                  duration: 6.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.6,
                }}
                className="absolute bottom-[16%] right-0 sm:right-2"
              >
                <div className="rounded-2xl border border-surface-200 bg-white/85 px-3.5 py-2.5 shadow-card backdrop-blur-xl">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                    Customer rating
                  </p>
                  <p className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-lg font-extrabold text-ink-900">
                      {featured.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-ink-500">/ 5.0</span>
                  </p>
                </div>
              </m.div>
            </m.div>
          </div>
        </div>
      </div>
      {/* Scroll cue */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="container mt-12 hidden lg:block"
        aria-hidden="true"
      >
        <div className="flex items-center gap-3 text-xs font-medium text-ink-500">
          <span className="flex h-9 w-[22px] items-start justify-center rounded-full border border-surface-300 bg-white pt-1.5">
            <m.span
              animate={reduced ? {} : { y: [0, 9, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
              className="block h-1.5 w-0.5 rounded-full bg-brand-600"
            />
          </span>
          Scroll to explore
        </div>
      </m.div>
    </section>
  );
}
