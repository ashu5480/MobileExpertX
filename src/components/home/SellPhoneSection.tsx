'use client';

import { m } from 'framer-motion';
import { ArrowRight, IndianRupee, MessageCircle, ShieldCheck, Zap } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { ProductVisual } from '@/components/product/ProductVisual';
import { buildWhatsAppUrl, siteConfig, whatsappMessages } from '@/lib/config';
import { formatPrice } from '@/lib/utils';
import { stagger, staggerItem, viewportOnce } from '@/lib/motion';
import { usePrefersReducedMotion } from '@/components/providers/MotionProvider';
/**
 * "Sell your old phone" — the trade-in section.
 *
 * The visual tells the story in one glance: a phone on the left dissolves into
 * banknotes on the right, with the quote between them. The transition is a
 * sweeping gradient rather than swapped images, which keeps it light and lets
 * the whole thing animate on pure transforms.
 */
export function SellPhoneSection() {
  const reduced = usePrefersReducedMotion();
  return (
    <section className="section relative overflow-hidden bg-white" aria-labelledby="sell-heading">
      <div className="container">
        <div className="relative overflow-hidden rounded-4xl border border-surface-200 bg-gradient-to-br from-surface-50 via-white to-brand-50 p-6 shadow-card sm:p-10 lg:p-14">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/12 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" aria-hidden="true" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <m.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={viewportOnce}>
              <m.p
                variants={staggerItem}
                className="text-[12px] font-bold uppercase tracking-[0.14em] text-brand-500"
              >
                Sell your phone
              </m.p>
              <m.h2
                id="sell-heading"
                variants={staggerItem}
                className="mt-3 text-display-sm font-extrabold tracking-tight text-ink-900"
              >
                Turn your old phone into cash.
              </m.h2>
              <m.p
                variants={staggerItem}
                className="mt-4 max-w-lg text-base leading-relaxed text-ink-600"
              >
                Answer eight quick questions and we will show you an honest
                estimate instantly. No lowball offers, and the price you see is
                the price you get after inspection.
              </m.p>
              <m.ul variants={staggerItem} className="mt-7 space-y-2.5">
                {[
                  { icon: Zap, text: 'Instant valuation — no waiting, no forms to download' },
                  { icon: IndianRupee, text: 'Cash in hand the same day at our Ahmedabad store' },
                  { icon: ShieldCheck, text: 'Factory-reset and data-wiped before it leaves our desk' },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-2.5 text-sm text-ink-700">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-500/10">
                      <item.icon className="h-3 w-3 text-brand-500" aria-hidden="true" />
                    </span>
                    {item.text}
                  </li>
                ))}
              </m.ul>
              <m.div variants={staggerItem} className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/sell-phone" size="lg">
                  Check your phone&apos;s value
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
                <a
                  href={buildWhatsAppUrl(
                    siteConfig.contact.whatsapp,
                    whatsappMessages.sellPhone(),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-[52px] items-center gap-2 rounded-xl border border-surface-300 bg-white px-6 text-[15px] font-semibold text-ink-900 shadow-soft transition-colors hover:border-[#25D366]/50 hover:text-[#128C4B]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Sell on WhatsApp
                </a>
              </m.div>
            </m.div>
            {/* Phone → cash visual */}
            <m.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={viewportOnce}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto aspect-[4/3] w-full max-w-md"
            >
              <m.div
                animate={reduced ? {} : { y: [0, -10, 0], rotate: [-6, -4, -6] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-0 top-1/2 w-[38%] -translate-y-1/2"
              >
                <div className="relative aspect-[9/18] w-full">
                  <ProductVisual
                    alt="Your old phone"
                    accent="#64748B"
                    colors={[{ name: 'Old', hex: '#5B6270', gradient: ['#8A93A3', '#2A3040'] }]}
                    name="Your old phone"
                    rounded="rounded-none"
                    className="h-full w-full"
                  />
                </div>
              </m.div>
              {/* Sweeping dissolve between the two */}
              <div
                className="absolute left-[34%] top-1/2 h-px w-[32%] -translate-y-1/2 overflow-hidden bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"
                aria-hidden="true"
              >
                <m.span
                  className="block h-full bg-brand-gradient"
                  animate={reduced ? {} : { scaleX: [0, 1], opacity: [0, 1, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              {/* Cash */}
              <m.div
                animate={reduced ? {} : { y: [0, 10, 0], rotate: [6, 9, 6] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute right-0 top-1/2 w-[40%] -translate-y-1/2"
              >
                <div className="relative aspect-[16/10] w-full">
                  {[
                    { top: '0%', rotate: -7, z: 10 },
                    { top: '26%', rotate: 5, z: 20 },
                    { top: '52%', rotate: -2, z: 30 },
                  ].map((note, i) => (
                    <div
                      key={i}
                      className="absolute inset-x-0 h-[34%] rounded-lg shadow-lift"
                      style={{ top: note.top, zIndex: note.z, transform: `rotate(${note.rotate}deg)` }}
                    >
                      <div className="h-full w-full rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 p-2.5">
                        <div className="flex items-center justify-between text-white">
                          <span className="font-display text-xs font-extrabold">₹</span>
                          <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[7px] font-bold">
                            CASH
                          </span>
                        </div>
                        <div className="mt-1 h-1 w-2/3 rounded-full bg-white/30" />
                        <div className="mt-0.5 h-1 w-1/2 rounded-full bg-white/20" />
                      </div>
                    </div>
                  ))}
                </div>
              </m.div>
              {/* Floating quote chip */}
              <m.div
                animate={reduced ? {} : { y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-1/2 top-0 -translate-x-1/2"
              >
                <div className="rounded-2xl border border-surface-200 bg-white/90 px-4 py-2.5 text-center shadow-lift backdrop-blur-xl">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                    You could get
                  </p>
                  <p className="text-lg font-extrabold text-emerald-600">
                    {formatPrice(2450000)}
                  </p>
                </div>
              </m.div>
            </m.div>
          </div>
        </div>
      </div>
    </section>
  );
}
