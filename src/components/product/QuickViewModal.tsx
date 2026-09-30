'use client';

import { m } from 'framer-motion';
import Link from 'next/link';
import { Check, MessageCircle, Phone, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ProductVisual } from './ProductVisual';
import { ConditionBadge, DiscountBadge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { useCart } from '@/store/cartStore';
import { useToast } from '@/store/toastStore';
import { makeVariantKey, variantPrice } from '@/lib/pricing';
import { buildTelUrl, buildWhatsAppUrl, siteConfig, whatsappMessages } from '@/lib/config';
import { discountPercent, formatPrice } from '@/lib/utils';
import { OptionPill } from '@/components/ui/Field';
import type { Product } from '@/types';
/**
 * Quick view — the full buying decision without leaving the grid.
 *
 * Colour / storage / RAM pickers are live and the price updates as the variant
 * changes, so what lands in the cart is exactly what is on screen.
 */
export function QuickViewModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const { success } = useToast();
  const [color, setColor] = useState('');
  const [storage, setStorage] = useState('');
  const [ram, setRam] = useState('');
  // Reset the selections whenever a different product is opened.
  useEffect(() => {
    if (!product) return;
    setColor(product.colors[0]?.name ?? '');
    setStorage(product.storages[0] ?? '');
    setRam(product.rams[0] ?? '');
  }, [product]);
  if (!product) return null;
  const variantKey = makeVariantKey({ color, storage, ram });
  const price = variantPrice(product, variantKey);
  const off = discountPercent(price, product.mrp);
  const handleAdd = () => {
    addItem(product, variantKey);
    success('Added to cart', `${product.name} · ${[color, storage].filter(Boolean).join(' · ')}`);
    onClose();
  };
  return (
    <Modal
      open={Boolean(product)}
      onClose={onClose}
      title={product.name}
      description={`${product.brand} · ${product.condition === 'refurbished' ? 'Refurbished' : 'Brand new'}`}
      size="lg"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Visual */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl">
            <ProductVisual
              image={product.images[0]}
              alt={product.name}
              accent={product.accent}
              colors={product.colors}
              name={product.name}
              highlights={product.highlights}
              className="h-full w-full"
            />
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              <DiscountBadge percent={off} />
              <ConditionBadge condition={product.condition} />
            </div>
          </div>
          <ul className="mt-4 space-y-1.5">
            {product.highlights.slice(0, 4).map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm text-ink-600">
                <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                {h}
              </li>
            ))}
          </ul>
        </div>
        {/* Details + variants */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Rating value={product.rating} size={14} showValue />
            <span className="text-xs text-ink-500">({product.reviewCount} reviews)</span>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-ink-900">
              {formatPrice(price)}
            </span>
            {off > 0 && (
              <>
                <span className="text-sm text-ink-400 line-through">
                  {formatPrice(product.mrp)}
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600">
                  {off}% off
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-emerald-600">Inclusive of all taxes</p>
          <div className="mt-5 space-y-4">
            <VariantGroup label="Colour">
              {product.colors.map((c) => (
                <Swatch
                  key={c.name}
                  selected={color === c.name}
                  onClick={() => setColor(c.name)}
                  color={c.hex}
                  label={c.name}
                />
              ))}
            </VariantGroup>
            <VariantGroup label="Storage">
              {product.storages.map((s) => (
                <OptionPill key={s} selected={storage === s} onClick={() => setStorage(s)}>
                  {s}
                </OptionPill>
              ))}
            </VariantGroup>
            {product.rams.length > 1 && (
              <VariantGroup label="RAM">
                {product.rams.map((r) => (
                  <OptionPill key={r} selected={ram === r} onClick={() => setRam(r)}>
                    {r}
                  </OptionPill>
                ))}
              </VariantGroup>
            )}
          </div>
          <p className="mt-4 text-xs text-ink-500">
            {product.stock > 0 ? (
              <>
                <span className="font-semibold text-emerald-600">In stock</span> ·{' '}
                {product.warranty}
              </>
            ) : (
              <span className="font-semibold text-rose-600">Out of stock</span>
            )}
          </p>
          <div className="mt-5 space-y-2.5">
            <Button onClick={handleAdd} fullWidth disabled={product.stock <= 0} size="lg">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Add to cart
            </Button>
            <ButtonLink href={`/shop/${product.slug}`} variant="outline" fullWidth>
              View full details
            </ButtonLink>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <a
                href={buildWhatsAppUrl(
                  siteConfig.contact.whatsapp,
                  whatsappMessages.askAboutPhone(product.name, product.sku),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 px-4 py-2.5 text-sm font-semibold text-[#128C4B] transition-colors hover:bg-[#25D366]/20"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Ask on WhatsApp
              </a>
              <a
                href={buildTelUrl(
                  siteConfig.contact.phone,
                  whatsappMessages.priceEnquiry(product.name),
                )}
                className="flex items-center justify-center gap-2 rounded-xl bg-surface-100 px-4 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:bg-surface-200"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call for price
              </a>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
function VariantGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-ink-800">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
/** Colour chip: a real swatch, not an unlabelled coloured dot. */
function Swatch({
  selected,
  onClick,
  color,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  color: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      className="relative h-9 w-9 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2"
      style={{
        background: color,
        boxShadow: selected
          ? '0 0 0 2px #fff, 0 0 0 4px #10B981'
          : 'inset 0 0 0 1px rgba(8,9,13,0.12)',
      }}
    >
      {selected && (
        <m.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 grid place-items-center"
        >
          <Check className="h-4 w-4 text-white drop-shadow" aria-hidden="true" />
        </m.span>
      )}
    </button>
  );
}
