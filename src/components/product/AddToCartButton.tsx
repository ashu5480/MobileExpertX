'use client';

import { Check, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useCart, useUI } from '@/store/cartStore';
import { useToast } from '@/store/toastStore';
import { formatPrice } from '@/lib/utils';
import { accessories } from '@/data/accessories';
import type { AccessoryProduct } from '@/types';

/**
 * Add-to-cart for accessories.
 *
 * Accessories are single-variant, so the line is namespaced with the
 * `acc:` prefix and priced server-side from the catalogue — the browser never
 * supplies a price.
 */
export function AddToCartButton({
  productId,
  disabled,
}: {
  productId: string;
  name?: string;
  accent?: string;
  pricePaise?: number;
  disabled?: boolean;
}) {
  const { addAccessory } = useCart();
  const { registerFlySource } = useUI();
  const { success } = useToast();
  const [added, setAdded] = useState(false);

  const accessory: AccessoryProduct | undefined = accessories.find(
    (a) => a.id === productId,
  );

  if (!accessory) return null;

  const handle = () => {
    if (disabled) return;
    addAccessory(accessory);
    success('Added to cart', `${accessory.name} · ${formatPrice(accessory.price)}`);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={disabled}
      className="group relative flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-gradient px-6 text-[15px] font-semibold text-white shadow-lift transition-all duration-300 hover:shadow-glow hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative z-10 inline-flex items-center gap-2">
        {added ? (
          <>
            <Check className="h-4.5 w-4.5" aria-hidden="true" />
            Added to cart
          </>
        ) : (
          <>
            <ShoppingBag className="h-4.5 w-4.5" aria-hidden="true" />
            Add to cart — {formatPrice(accessory.price)}
          </>
        )}
      </span>
    </button>
  );
}
