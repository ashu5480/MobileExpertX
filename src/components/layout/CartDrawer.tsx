'use client';

import { m, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';
import { useCart, useUI } from '@/store/cartStore';
import { useToast } from '@/store/toastStore';
import { ProductVisual } from '@/components/product/ProductVisual';
import { parseVariantKey, totalsFromCart } from '@/lib/pricing';
import { cn, formatPrice } from '@/lib/utils';
/**
 * Cart drawer.
 *
 * Slides in from the right on desktop and up from the bottom on mobile.
 * Line items animate out on removal, quantities are steppers rather than a
 * number input (bigger touch target, no keyboard on a phone), and the footer
 * total is always visible without scrolling.
 */
export function CartDrawer() {
  const { isCartOpen, closeCart, openCart } = useUI();
  const { entries, totals, setQuantity, removeItem, count, couponCode, deliveryMethod } = useCart();
  const { toast } = useToast();
  useEffect(() => {
    if (!isCartOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isCartOpen, closeCart]);
  const liveTotals = totalsFromCart(entries, { couponCode, deliveryMethod });
  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[108]" role="dialog" aria-modal="true" aria-label="Shopping cart">
          <m.button
            type="button"
            aria-label="Close cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="absolute inset-0 h-full w-full cursor-default bg-ink-900/55 backdrop-blur-sm"
          />
          <m.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-lift"
          >
            <header className="flex items-center justify-between border-b border-surface-200 px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-ink-900">
                <ShoppingBag className="h-5 w-5 text-brand-500" aria-hidden="true" />
                Your cart
                {count > 0 && (
                  <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-bold text-brand-600">
                    {count}
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="rounded-xl p-2 text-ink-500 transition-colors hover:bg-surface-100 hover:text-ink-900"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>
            {/* ── Lines ─────────────────────────────────────────────── */}
            {entries.length === 0 ? (
              <EmptyCart onBrowse={closeCart} />
            ) : (
              <ul className="flex-1 divide-y divide-surface-200 overflow-y-auto px-5">
                <AnimatePresence initial={false}>
                  {entries.map((entry) => {
                    const { line, unitPricePaise, lineTotalPaise, variant, title, href, accent } = entry;
                    const key = `${line.productId}-${line.variantKey}`;
                    return (
                      <m.li
                        key={key}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0, transition: { duration: 0.22 } }}
                        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-3.5 py-4">
                          <Link
                            href={href}
                            onClick={closeCart}
                            className="h-20 w-16 shrink-0 overflow-hidden rounded-xl"
                          >
                            <ProductVisual
                              image={entry.image ? { url: entry.image, alt: title } : undefined}
                              alt={title}
                              accent={accent}
                              name={title}
                              rounded="rounded-xl"
                              className="h-full w-full"
                            />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={href}
                                onClick={closeCart}
                                className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900 transition-colors hover:text-brand-600"
                              >
                                {title}
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  removeItem(line.productId, line.variantKey);
                                  toast({
                                    title: 'Removed from cart',
                                    description: title,
                                    tone: 'info',
                                  });
                                }}
                                aria-label={`Remove ${title} from cart`}
                                className="shrink-0 rounded-lg p-1 text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                            {!entry.accessory && (
                              <p className="mt-0.5 truncate text-xs text-ink-500">
                                {[variant.color, variant.storage, variant.ram]
                                  .filter((v) => v && v !== 'default')
                                  .join(' · ')}
                              </p>
                            )}
                            <div className="mt-2.5 flex items-center justify-between gap-2">
                              <div className="inline-flex items-center rounded-lg border border-surface-200 bg-surface-50">
                                <button
                                  type="button"
                                  onClick={() => setQuantity(line.productId, line.variantKey, line.quantity - 1)}
                                  aria-label="Decrease quantity"
                                  className="grid h-8 w-8 place-items-center rounded-l-lg text-ink-600 transition-colors hover:bg-surface-200 hover:text-ink-900"
                                >
                                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                                </button>
                                <span
                                  className="min-w-[2rem] text-center text-sm font-bold tabular-nums text-ink-900"
                                  aria-label={`Quantity ${line.quantity}`}
                                >
                                  {line.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setQuantity(line.productId, line.variantKey, line.quantity + 1)}
                                  disabled={line.quantity >= 10}
                                  aria-label="Increase quantity"
                                  className="grid h-8 w-8 place-items-center rounded-r-lg text-ink-600 transition-colors hover:bg-surface-200 hover:text-ink-900 disabled:opacity-40"
                                >
                                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                                </button>
                              </div>
                              <span className="text-sm font-bold tabular-nums text-ink-900">
                                {formatPrice(lineTotalPaise)}
                              </span>
                            </div>
                            {line.quantity > 1 && (
                              <p className="mt-1 text-right text-[11px] text-ink-400">
                                {formatPrice(unitPricePaise)} each
                              </p>
                            )}
                          </div>
                        </div>
                      </m.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
            {/* ── Footer ────────────────────────────────────────────── */}
            {entries.length > 0 && (
              <footer className="border-t border-surface-200 bg-surface-50 px-5 py-4 pb-safe">
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-ink-600">
                    <dt>Subtotal</dt>
                    <dd className="font-semibold tabular-nums text-ink-900">
                      {formatPrice(liveTotals.subtotalPaise)}
                    </dd>
                  </div>
                  {liveTotals.discountPaise > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <dt>Discount {liveTotals.couponCode && `(${liveTotals.couponCode})`}</dt>
                      <dd className="font-semibold tabular-nums">
                        −{formatPrice(liveTotals.discountPaise)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between text-ink-600">
                    <dt>Delivery</dt>
                    <dd className="font-semibold tabular-nums text-ink-900">
                      {liveTotals.shippingPaise === 0
                        ? 'Free'
                        : formatPrice(liveTotals.shippingPaise)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-surface-200 pt-2 text-base">
                    <dt className="font-bold text-ink-900">Total</dt>
                    <dd className="font-extrabold tabular-nums text-ink-900">
                      {formatPrice(liveTotals.grandTotalPaise)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-1 text-[11px] text-ink-400">
                  Inclusive of {formatPrice(liveTotals.taxPaise)} GST
                </p>
                <div className="mt-4 space-y-2.5">
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-lift transition-all duration-300 hover:shadow-glow hover:brightness-105"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <span className="relative z-10">Proceed to checkout</span>
                    <ArrowRight className="relative z-10 h-4 w-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={closeCart}
                    className="w-full rounded-xl border border-surface-300 bg-white px-6 py-3 text-sm font-semibold text-ink-900 transition-colors hover:border-brand-300 hover:text-brand-600"
                  >
                    Continue shopping
                  </button>
                </div>
                <p className="mt-3 text-center text-[11px] text-ink-400">
                  Secure checkout · UPI, cards, net banking &amp; cash on delivery
                </p>
              </footer>
            )}
          </m.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
/** Empty state with a helpful next action rather than a dead end. */
function EmptyCart({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="relative grid h-24 w-24 place-items-center rounded-3xl bg-brand-500/8">
        <ShoppingBag className="h-10 w-10 text-brand-500" aria-hidden="true" />
        <span className="absolute inset-0 rounded-3xl ring-1 ring-brand-500/15" />
      </div>
      <h3 className="mt-5 text-lg font-bold tracking-tight text-ink-900">
        Your cart is empty
      </h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-500">
        Browse our verified phones, or check what your old device is worth.
      </p>
      <div className="mt-6 w-full space-y-2.5">
        <Link
          href="/shop"
          onClick={onBrowse}
          className="flex w-full items-center justify-center rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-lift transition-colors hover:brightness-105"
        >
          Shop phones
        </Link>
        <Link
          href="/sell-phone"
          onClick={onBrowse}
          className="flex w-full items-center justify-center rounded-xl border border-surface-300 bg-white px-5 py-3 text-sm font-semibold text-ink-900 transition-colors hover:border-brand-300 hover:text-brand-600"
        >
          Sell my phone
        </Link>
      </div>
    </div>
  );
}
