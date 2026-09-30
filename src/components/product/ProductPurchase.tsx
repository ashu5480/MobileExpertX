'use client';

import { m } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Check,
  MessageCircle,
  Phone,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Zap,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { OptionPill } from '@/components/ui/Field';
import { ConditionBadge, DiscountBadge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { useCart, useUI } from '@/store/cartStore';
import { useToast } from '@/store/toastStore';
import { makeVariantKey, variantPrice } from '@/lib/pricing';
import {
  buildTelUrl,
  buildWhatsAppUrl,
  siteConfig,
  whatsappMessages,
} from '@/lib/config';
import { discountPercent, formatPrice } from '@/lib/utils';
import type { Product } from '@/types';
/**
 * Buy box — colour / storage / RAM pickers with live pricing, plus every
 * route to purchase: add to cart, buy now, WhatsApp, or a phone call.
 */
export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { openCart } = useUI();
  const { success } = useToast();
  const [colorIndex, setColorIndex] = useState(0);
  const [storage, setStorage] = useState(product.storages[0]);
  const [ram, setRam] = useState(product.rams[0]);
  const [buying, setBuying] = useState(false);
  const color = product.colors[colorIndex];
  const variantKey = makeVariantKey({ color: color?.name, storage, ram });
  const price = variantPrice(product, variantKey);
  const off = discountPercent(price, product.mrp);
  const outOfStock = product.stock <= 0;
  const handleAdd = useCallback(() => {
    if (outOfStock) return;
    addItem(product, variantKey);
    success(
      'Added to cart',
      `${product.name} · ${[color?.name, storage].filter(Boolean).join(' · ')}`,
    );
    openCart();
  }, [addItem, color?.name, openCart, outOfStock, product.name, storage, success, variantKey]);
  const handleBuyNow = useCallback(() => {
    if (outOfStock) return;
    setBuying(true);
    addItem(product, variantKey);
    router.push('/checkout');
  }, [addItem, outOfStock, product, router, variantKey]);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        <ConditionBadge condition={product.condition} />
        <DiscountBadge percent={off} />
        <span className="text-xs text-ink-400">SKU {product.sku}</span>
      </div>
      <h1 className="mt-4 text-display-sm font-extrabold tracking-tight text-ink-900">
        {product.name}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <a href="#reviews" className="flex items-center gap-2 hover:opacity-80">
          <Rating value={product.rating} size={15} showValue />
          <span className="text-sm text-ink-500 underline underline-offset-2">
            {product.reviewCount} reviews
          </span>
        </a>
        <span className="text-sm font-semibold text-emerald-600">
          {outOfStock ? 'Out of stock' : `In stock · ${product.stock} available`}
        </span>
      </div>
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <span className="text-4xl font-extrabold tracking-tight text-ink-900">
          {formatPrice(price)}
        </span>
        {off > 0 && (
          <>
            <span className="text-lg text-ink-400 line-through">
              {formatPrice(product.mrp)}
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-sm font-bold text-emerald-600">
              Save {formatPrice(product.mrp - price)}
            </span>
          </>
        )}
      </div>
      <p className="mt-1.5 text-sm text-ink-500">
        Inclusive of all taxes · or {formatPrice(Math.round(price / 12))}/month for 12 months
      </p>
      {/* Variants */}
      <div className="mt-8 space-y-6">
        <div>
          <div className="mb-2.5 flex items-baseline justify-between">
            <h2 className="text-[13px] font-semibold text-ink-800">Colour</h2>
            <span className="text-xs text-ink-500">{color?.name}</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((c, i) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColorIndex(i)}
                aria-pressed={i === colorIndex}
                aria-label={c.name}
                title={c.name}
                className="relative h-11 w-11 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2"
                style={{
                  background: c.gradient
                    ? `linear-gradient(140deg, ${c.gradient[0]}, ${c.gradient[1]})`
                    : c.hex,
                  boxShadow:
                    i === colorIndex
                      ? '0 0 0 2px #fff, 0 0 0 4px #10B981'
                      : 'inset 0 0 0 1px rgba(8,9,13,0.12)',
                }}
              >
                {i === colorIndex && (
                  <m.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 grid place-items-center"
                  >
                    <Check className="h-4 w-4 text-white drop-shadow" aria-hidden="true" />
                  </m.span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-2.5 text-[13px] font-semibold text-ink-800">Storage</h2>
          <div className="flex flex-wrap gap-2">
            {product.storages.map((s) => (
              <OptionPill key={s} selected={storage === s} onClick={() => setStorage(s)}>
                {s}
              </OptionPill>
            ))}
          </div>
        </div>
        {product.rams.length > 1 && (
          <div>
            <h2 className="mb-2.5 text-[13px] font-semibold text-ink-800">RAM</h2>
            <div className="flex flex-wrap gap-2">
              {product.rams.map((r) => (
                <OptionPill key={r} selected={ram === r} onClick={() => setRam(r)}>
                  {r}
                </OptionPill>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Trust strip */}
      <ul className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, label: product.warranty },
          { icon: Truck, label: 'Free delivery above ₹4,999' },
          { icon: Zap, label: 'Same-day dispatch before 4 PM' },
        ].map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs text-ink-600">
            <item.icon className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>
      {/* Actions */}
      <div className="mt-7 space-y-2.5">
        <Button onClick={handleAdd} size="lg" fullWidth disabled={outOfStock}>
          <ShoppingBag className="h-4.5 w-4.5" aria-hidden="true" />
          Add to cart
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          disabled={outOfStock}
          loading={buying}
          onClick={handleBuyNow}
        >
          Buy now
        </Button>
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <a
            href={buildWhatsAppUrl(
              siteConfig.contact.whatsapp,
              whatsappMessages.askAboutPhone(product.name, product.sku),
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 px-4 py-3.5 text-sm font-semibold text-[#128C4B] transition-colors hover:bg-[#25D366]/20"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Ask on WhatsApp
          </a>
          <a
            href={buildTelUrl(
              siteConfig.contact.phone,
              whatsappMessages.priceEnquiry(product.name),
            )}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-100 px-4 py-3.5 text-sm font-semibold text-ink-800 transition-colors hover:bg-surface-200"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call for price
          </a>
        </div>
      </div>
      {product.condition === 'refurbished' && (
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h3 className="text-sm font-bold text-emerald-800">Refurbished assurance</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-emerald-700">
            <li>· New battery at {product.batteryHealth ?? 90}% health or better</li>
            <li>· Factory data wipe and activation lock removed</li>
            <li>· 90-day warranty covering the battery and display</li>
            <li>· 7-day no-questions replacement window</li>
          </ul>
        </div>
      )}
    </div>
  );
}
