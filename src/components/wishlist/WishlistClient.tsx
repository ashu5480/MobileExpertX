'use client';

import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { ProductCard } from '@/components/product/ProductCard';
import { Button, ButtonLink } from '@/components/ui/Button';
import { AccessoryVisual } from '@/components/product/ProductVisual';
import { useWishlist } from '@/store/wishlistStore';
import { useCart, useUI } from '@/store/cartStore';
import { useToast } from '@/store/toastStore';
import type { AccessoryProduct } from '@/types';
import { accessoryId, isAccessoryLine, makeVariantKey } from '@/lib/pricing';
import { products } from '@/data/products';
import { accessories } from '@/data/accessories';
import { formatPrice } from '@/lib/utils';

interface Item {
  kind: 'phone' | 'accessory';
  href: string;
  title: string;
  accent: string;
  pricePaise: number;
  phoneId?: string;
  accessoryRef?: AccessoryProduct;
}

/**
 * Wishlist.
 *
 * The store holds bare ids, so this resolves them against both catalogues and
 * renders a genuinely helpful empty state rather than a dead end.
 */
export function WishlistClient() {
  const { ids, isHydrated, remove, clear } = useWishlist();
  const { addItem, addAccessory } = useCart();
  const { openCart } = useUI();
  const { success, toast } = useToast();

  const items = useMemo<Item[]>(
    () =>
      ids
        .map<Item | null>((id) => {
          if (isAccessoryLine(id)) {
            const a = accessories.find((x) => accessoryId(x.id) === id);
            return a
              ? {
                  kind: 'accessory',
                  href: `/accessories/${a.slug}`,
                  title: a.name,
                  accent: a.accent,
                  pricePaise: a.price,
                  accessoryRef: a,
                }
              : null;
          }
          const p = products.find((x) => x.id === id);
          return p
            ? {
                kind: 'phone',
                href: `/shop/${p.slug}`,
                title: p.name,
                accent: p.accent,
                pricePaise: p.price,
                phoneId: p.id,
              }
            : null;
        })
        .filter((i): i is Item => i !== null),
    [ids],
  );

  const phones = items.filter((i) => i.kind === 'phone');
  const others = items.filter((i) => i.kind === 'accessory');

  const addAll = () => {
    let added = 0;
    for (const item of items) {
      if (item.kind === 'phone') {
        const p = products.find((x) => x.id === item.phoneId);
        if (p) {
          addItem(p, makeVariantKey({}));
          added += 1;
        }
      } else if (item.accessoryRef) {
        addAccessory(item.accessoryRef);
        added += 1;
      }
    }
    if (added > 0) {
      success(`${added} ${added === 1 ? 'item' : 'items'} moved to cart`);
      openCart();
    }
  };

  if (!isHydrated) {
    return (
      <div className="container py-16">
        <div className="mx-auto h-64 max-w-md animate-pulse rounded-3xl bg-surface-100" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-dashed border-surface-300 bg-surface-50 px-8 py-16 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-3xl bg-white shadow-soft">
            <Heart className="h-9 w-9 text-ink-400" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-bold tracking-tight text-ink-900">
            Your wishlist is empty
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Tap the heart on any phone to save it here, then compare later.
          </p>
          <div className="mt-7 w-full space-y-2.5">
            <ButtonLink href="/shop" fullWidth size="lg">
              Browse phones
            </ButtonLink>
            <ButtonLink href="/accessories" variant="outline" fullWidth>
              Shop accessories
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container pb-20 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200 pb-5">
        <h1 className="text-display-sm font-extrabold tracking-tight text-ink-900">
          Wishlist
          <span className="ml-3 text-base font-semibold text-ink-400">
            {items.length} saved
          </span>
        </h1>
        <div className="flex flex-wrap gap-2.5">
          <Button onClick={addAll} size="sm">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Move all to cart
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clear();
              toast({ title: 'Wishlist cleared', tone: 'info' });
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        </div>
      </div>

      {phones.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-ink-400">
            Phones
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {phones.map((item) => {
              const p = products.find((x) => x.id === item.phoneId)!;
              return <ProductCard key={p.id} product={p} />;
            })}
          </div>
        </>
      )}

      {others.length > 0 && (
        <>
          <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-ink-400">
            Accessories
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {others.map((item) => (
              <li
                key={item.title}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-soft transition-all hover:-translate-y-1.5 hover:shadow-lift"
              >
                <div className="relative aspect-square">
                  <Link href={item.href} className="block h-full w-full">
                    <AccessoryVisual accent={item.accent} name={item.title} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => item.accessoryRef && remove(item.accessoryRef.id)}
                    aria-label={`Remove ${item.title} from wishlist`}
                    className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-rose-500 text-white shadow-soft"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <Link
                    href={item.href}
                    className="line-clamp-2 text-sm font-semibold text-ink-900 hover:text-brand-600"
                  >
                    {item.title}
                  </Link>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <span className="text-base font-extrabold text-ink-900">
                      {formatPrice(item.pricePaise)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.accessoryRef) {
                          addAccessory(item.accessoryRef);
                          success('Added to cart', item.title);
                        }
                      }}
                      className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-lift transition-transform active:scale-95"
                      aria-label={`Add ${item.title} to cart`}
                    >
                      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

