'use client';

import { m } from 'framer-motion';
import Link from 'next/link';
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { ProductVisual } from './ProductVisual';
import { ConditionBadge, DiscountBadge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { useCart, useUI } from '@/store/cartStore';
import { useWishlist } from '@/store/wishlistStore';
import { useToast } from '@/store/toastStore';
import { makeVariantKey } from '@/lib/pricing';
import { cn, discountPercent, formatPrice } from '@/lib/utils';
import type { Product } from '@/types';
/**
 * Premium product card.
 *
 * Interaction model:
 *  • Pointer devices get a subtle 3D tilt driven by CSS custom properties
 *    (`--tilt-x` / `--tilt-y`) rather than a React re-render per frame, so
 *    hover stays on the compositor.
 *  • Touch devices skip tilt entirely — it feels broken without a cursor.
 *  • Quick view is pointer-only; the add-to-cart button is always visible
 *    because tap is the only "hover" a phone has.
 */
export function ProductCard({
  product,
  onQuickView,
  className,
  priority,
  compact,
}: {
  product: Product;
  onQuickView?: (product: Product) => void;
  className?: string;
  priority?: boolean;
  compact?: boolean;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const { addItem } = useCart();
  const { registerFlySource } = useUI();
  const { has, toggle, isHydrated } = useWishlist();
  const { success, toast } = useToast();
  const saved = isHydrated && has(product.id);
  const off = discountPercent(product.price, product.mrp);
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    // Coarse pointers have no hover state — tilting there is just noise.
    if (e.pointerType !== 'mouse') return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--tilt-x', `${(px * 8).toFixed(2)}deg`);
    el.style.setProperty('--tilt-y', `${(-py * 8).toFixed(2)}deg`);
  }, []);
  const onPointerLeave = useCallback(() => {
    setIsHovering(false);
    cardRef.current?.style.setProperty('--tilt-x', '0deg');
    cardRef.current?.style.setProperty('--tilt-y', '0deg');
  }, []);
  const handleAdd = useCallback(() => {
    if (outOfStock) return;
    if (imageRef.current) registerFlySource(imageRef.current, product.accent);
    addItem(product, makeVariantKey({}));
    success('Added to cart', `${product.name} is in your bag.`);
  }, [addItem, outOfStock, product, registerFlySource, success]);
  const handleWishlist = useCallback(() => {
    const nowSaved = toggle(product.id);
    toast({
      title: nowSaved ? 'Saved to wishlist' : 'Removed from wishlist',
      description: product.name,
      tone: nowSaved ? 'success' : 'info',
    });
  }, [product.name, toast, toggle]);
  return (
    <m.article
      ref={cardRef}
      onPointerMove={onPointerMove}
      onPointerEnter={() => setIsHovering(true)}
      onPointerLeave={onPointerLeave}
      onFocus={() => setIsHovering(true)}
      onBlur={() => setIsHovering(false)}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className={cn(
        'ring-gradient group/card relative flex flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-soft transition-shadow duration-400 ease-premium hover:shadow-lift',
        className,
      )}
    >
      {/* ── Media ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <Link
          href={`/shop/${product.slug}`}
          className="tilt-3d block"
          aria-label={`View ${product.name}`}
        >
          <div
            ref={imageRef}
            className={cn('relative overflow-hidden', compact ? 'aspect-square' : 'aspect-[4/5]')}
          >
            <div className="absolute inset-0 transition-transform duration-700 ease-premium group-hover/card:scale-[1.06]">
              <ProductVisual
                image={product.images[0]}
                alt={product.name}
                accent={product.accent}
                colors={product.colors}
                view="front"
                name={product.name}
                highlights={product.highlights}
                rounded="rounded-none"
                priority={priority}
                className="h-full w-full"
              />
            </div>
          </div>
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <DiscountBadge percent={off} />
          {product.tags.includes('best-seller') && !off && (
            <span className="rounded-full bg-brand-gradient px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-soft">
              Best seller
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
          className={cn(
            'absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur-md transition-all duration-300',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-1',
            saved
              ? 'bg-rose-500 text-white shadow-lift'
              : 'bg-white/85 text-ink-700 shadow-soft hover:bg-white hover:text-rose-500',
          )}
        >
          <Heart className={cn('h-4 w-4 transition-transform', saved && 'scale-110 fill-current')} />
        </button>
        {outOfStock && (
          <div className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-[2px]">
            <span className="rounded-full bg-ink-800 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
              Out of stock
            </span>
          </div>
        )}
        {onQuickView && (
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className={cn(
              'absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand-gradient px-3.5 py-2 text-xs font-semibold text-white shadow-lift backdrop-blur-md transition-all duration-300',
              'hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2',
              isHovering ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
              'hidden md:inline-flex',
            )}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            Quick view
          </button>
        )}
      </div>
      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <ConditionBadge condition={product.condition} />
          {lowStock && (
            <span className="text-[11px] font-semibold text-amber-600">Only {product.stock} left</span>
          )}
        </div>
        <h3 className="mt-2.5 line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-ink-900">
          <Link
            href={`/shop/${product.slug}`}
            className="transition-colors hover:text-brand-600 focus-visible:outline-none"
          >
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5 flex items-center gap-2">
          <Rating value={product.rating} size={12} />
          <span className="truncate text-xs text-ink-400">
            {product.storages[0]} · {product.rams[0]}
          </span>
        </div>
        {/* Spacer keeps the price row aligned across a grid of varying titles */}
        <div className="mt-auto pt-3.5">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-lg font-extrabold tracking-tight tabular-nums text-ink-900">
                  {formatPrice(product.price)}
                </span>
                {off > 0 && (
                  <span className="text-xs font-medium text-ink-400 line-through">
                    {formatPrice(product.mrp)}
                  </span>
                )}
              </div>
              <p className="truncate text-[11px] font-medium text-emerald-600">
                {product.condition === 'refurbished' && product.batteryHealth
                  ? `${product.batteryHealth}% battery health`
                  : 'Inclusive of all taxes'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={outOfStock}
              aria-label={`Add ${product.name} to cart`}
              className={cn(
                'grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-all duration-300 ease-premium',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2',
                outOfStock
                  ? 'cursor-not-allowed bg-surface-200 text-ink-400'
                  : 'bg-brand-gradient text-white shadow-lift hover:shadow-glow hover:brightness-105 active:scale-95',
              )}
            >
              <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </m.article>
  );
}
