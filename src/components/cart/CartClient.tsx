'use client';

import { m, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useCart, useUI } from '@/store/cartStore';
import { useToast } from '@/store/toastStore';
import { useWishlist } from '@/store/wishlistStore';
import { ProductVisual, AccessoryVisual } from '@/components/product/ProductVisual';
import { Button, ButtonLink } from '@/components/ui/Button';
import { checkCoupon, freeShippingProgress, amountToFreeShipping, type CartEntry } from '@/lib/pricing';
import { formatPrice, cn } from '@/lib/utils';
/**
 * Full cart page.
 *
 * Line items animate on add/remove, the coupon field validates against the same
 * engine the server uses, and the free-shipping progress bar is always visible
 * because it is the single strongest incentive to add a second item.
 */
export function CartClient() {
  const {
    entries,
    totals,
    setQuantity,
    removeItem,
    clearCart,
    couponCode,
    setCouponCode,
    isHydrated,
  } = useCart();
  const { openCart } = useUI();
  const { ids: wishlistIds, add: addToWishlist } = useWishlist();
  const { toast } = useToast();
  const [couponInput, setCouponInput] = useState(couponCode ?? '');
  const [couponError, setCouponError] = useState<string | null>(null);
  const applyCoupon = () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponCode(null);
      setCouponError(null);
      return;
    }
    const result = checkCoupon(code, totals.subtotalPaise);
    if (!result.valid) {
      setCouponError(result.reason ?? 'That coupon is not valid.');
      return;
    }
    setCouponCode(result.coupon?.code ?? null);
    setCouponError(null);
    toast({
      title: 'Coupon applied',
      description: result.reason,
      tone: 'success',
    });
  };
  const progress = freeShippingProgress(totals.subtotalPaise);
  const remaining = amountToFreeShipping(totals.subtotalPaise);
  if (!isHydrated) {
    return (
      <div className="container py-16">
        <div className="mx-auto h-64 max-w-md animate-pulse rounded-3xl bg-surface-100" />
      </div>
    );
  }
  if (entries.length === 0) {
    return (
      <div className="container py-16">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-dashed border-surface-300 bg-surface-50 px-8 py-16 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-3xl bg-white shadow-soft">
            <ShoppingBag className="h-9 w-9 text-ink-400" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-bold tracking-tight text-ink-900">
            Your cart is empty
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Browse verified phones, check what your old device is worth, or start with
            a charger you can trust.
          </p>
          <div className="mt-7 w-full space-y-2.5">
            <ButtonLink href="/shop" fullWidth size="lg">
              Shop phones
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/accessories" variant="outline" fullWidth>
              Browse accessories
            </ButtonLink>
            <ButtonLink href="/sell-phone" variant="ghost" fullWidth>
              Sell my old phone
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="container pb-24 pt-6 lg:pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200 pb-5">
        <h1 className="text-display-sm font-extrabold tracking-tight text-ink-900">
          Your cart
          <span className="ml-3 text-base font-semibold text-ink-400">
            {entries.reduce((s, e) => s + e.line.quantity, 0)} items
          </span>
        </h1>
        <button
          type="button"
          onClick={() => {
            clearCart();
            toast({ title: 'Cart cleared', tone: 'info' });
          }}
          className="text-sm font-semibold text-ink-500 underline-offset-4 transition-colors hover:text-rose-600 hover:underline"
        >
          Clear cart
        </button>
      </div>
      {/* Free-shipping progress — the strongest add-a-second-item incentive */}
      <div className="mt-5 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-ink-800">
            {remaining > 0 ? (
              <>
                Add <span className="text-brand-600">{formatPrice(remaining)}</span> more for
                free delivery
              </>
            ) : (
              <span className="text-emerald-600">You have qualified for free delivery</span>
            )}
          </p>
          <p className="shrink-0 text-xs text-ink-500">{Math.round(progress * 100)}%</p>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white">
          <m.div
            className="h-full rounded-full bg-brand-gradient"
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-surface-200 rounded-3xl border border-surface-200 bg-white px-5 shadow-soft">
            <AnimatePresence initial={false}>
              {entries.map((entry) => (
                <CartRow key={`${entry.line.productId}-${entry.line.variantKey}`} entry={entry} />
              ))}
            </AnimatePresence>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/shop" variant="outline">
              Continue shopping
            </ButtonLink>
          </div>
        </div>
        {/* ── Summary ────────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-bold tracking-tight text-ink-900">
              Order summary
            </h2>
            {/* Coupon */}
            <div className="mt-5">
              <label
                htmlFor="coupon"
                className="mb-1.5 block text-[13px] font-semibold text-ink-800"
              >
                Coupon code
              </label>
              <div className="flex gap-2">
                <input
                  id="coupon"
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setCouponError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyCoupon();
                  }}
                  placeholder="e.g. MEXNEW10"
                  aria-invalid={couponError ? true : undefined}
                  aria-describedby={couponError ? 'coupon-error' : undefined}
                  className={cn(
                    'h-11 min-w-0 flex-1 rounded-xl border bg-white px-3.5 text-sm uppercase text-ink-900 placeholder:normal-case placeholder:text-ink-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20',
                    couponError
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/25'
                      : 'border-surface-300 focus:border-brand-500',
                  )}
                />
                <Button variant="outline" onClick={applyCoupon}>
                  <Tag className="h-4 w-4" aria-hidden="true" />
                  Apply
                </Button>
              </div>
              {couponError ? (
                <p id="coupon-error" role="alert" className="mt-2 text-[13px] font-medium text-rose-600">
                  {couponError}
                </p>
              ) : (
                couponCode && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600">
                    <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                    {couponCode} applied
                    <button
                      type="button"
                      onClick={() => {
                        setCouponCode(null);
                        setCouponInput('');
                      }}
                      className="ml-1 rounded p-0.5 text-ink-400 hover:text-ink-700"
                      aria-label="Remove coupon"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </p>
                )
              )}
            </div>
            {/* Totals */}
            <dl className="mt-6 space-y-2.5 border-t border-surface-200 pt-5 text-sm">
              <Row label="Subtotal" value={formatPrice(totals.subtotalPaise)} />
              {totals.discountPaise > 0 && (
                <Row
                  label={`Discount${couponCode ? ` (${couponCode})` : ''}`}
                  value={`−${formatPrice(totals.discountPaise)}`}
                  tone="emerald"
                />
              )}
              <Row
                label="Delivery"
                value={
                  totals.shippingPaise === 0
                    ? 'Free'
                    : formatPrice(totals.shippingPaise)
                }
              />
              <Row label="GST (18%)" value={formatPrice(totals.taxPaise)} />
              <div className="flex items-center justify-between border-t border-surface-200 pt-3 text-base">
                <dt className="font-bold text-ink-900">Total</dt>
                <dd className="font-extrabold tabular-nums text-ink-900">
                  {formatPrice(totals.grandTotalPaise)}
                </dd>
              </div>
            </dl>
            <ButtonLink href="/checkout" size="lg" fullWidth className="mt-6">
              Proceed to checkout
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <p className="mt-4 text-center text-xs leading-relaxed text-ink-400">
              Secure payment · UPI, cards, net banking &amp; cash on delivery
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'emerald';
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-600">{label}</dt>
      <dd className={cn('font-semibold tabular-nums', tone === 'emerald' ? 'text-emerald-600' : 'text-ink-900')}>
        {value}
      </dd>
    </div>
  );
}
/** < single cart line: thumbnail, variant, stepper and remove/save actions. */
function CartRow({ entry }: { entry: CartEntry }) {
  const { setQuantity, removeItem } = useCart();
  const { add: addToWishlist, ids: wishlistIds } = useWishlist();
  const { toast } = useToast();
  const { line, unitPricePaise, lineTotalPaise, variant } = entry;
  const saved = wishlistIds.includes(line.productId);
  return (
    <m.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.22 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      className="overflow-hidden"
    >
      <div className="flex gap-4 py-5 sm:gap-5">
        <Link
          href={entry.href}
          className="h-24 w-20 shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-24"
        >
          {entry.accessory ? (
            <AccessoryVisual accent={entry.accent} name={entry.title} />
          ) : (
            <ProductVisual
              alt={entry.title}
              accent={entry.accent}
              name={entry.title}
              rounded="rounded-2xl"
              className="h-full w-full"
            />
          )}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={entry.href}
                className="text-[15px] font-bold leading-snug text-ink-900 transition-colors hover:text-brand-600"
              >
                {entry.title}
              </Link>
              {!entry.accessory && (
                <p className="mt-1 truncate text-xs text-ink-500">
                  {[variant.color, variant.storage, variant.ram]
                    .filter((v) => v && v !== 'default')
                    .join(' · ')}
                </p>
              )}
              {line.quantity > 1 && (
                <p className="mt-0.5 text-xs text-ink-400">
                  {formatPrice(unitPricePaise)} each
                </p>
              )}
            </div>
            <span className="shrink-0 text-base font-extrabold tabular-nums text-ink-900">
              {formatPrice(lineTotalPaise)}
            </span>
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
            <div className="inline-flex items-center rounded-xl border border-surface-200 bg-surface-50">
              <button
                type="button"
                onClick={() => setQuantity(line.productId, line.variantKey, line.quantity - 1)}
                aria-label={`Decrease quantity of ${entry.title}`}
                className="grid h-9 w-9 place-items-center rounded-l-xl text-ink-600 transition-colors hover:bg-surface-200 hover:text-ink-900"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span
                className="min-w-[2.5rem] text-center text-sm font-bold tabular-nums text-ink-900"
                aria-label={`Quantity ${line.quantity}`}
              >
                {line.quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(line.productId, line.variantKey, line.quantity + 1)}
                disabled={line.quantity >= 10}
                aria-label={`Increase quantity of ${entry.title}`}
                className="grid h-9 w-9 place-items-center rounded-r-xl text-ink-600 transition-colors hover:bg-surface-200 hover:text-ink-900 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                removeItem(line.productId, line.variantKey);
                toast({ title: 'Removed from cart', description: entry.title, tone: 'info' });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-ink-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Remove
            </button>
            {!saved && (
              <button
                type="button"
                onClick={() => addToWishlist(line.productId)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-ink-500 transition-colors hover:bg-surface-100 hover:text-brand-600"
              >
                <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                Save for later
              </button>
            )}
          </div>
        </div>
      </div>
    </m.li>
  );
}
