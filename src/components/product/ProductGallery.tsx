'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, RotateCw, Share2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ProductVisual } from './ProductVisual';
import { useToast } from '@/store/toastStore';
import { useWishlist } from '@/store/wishlistStore';
import { cn } from '@/lib/utils';
import type { ColorOption, Product, ProductImage } from '@/types';

/**
 * Product gallery.
 *
 * A thumbnail rail plus a large stage, with a "360°" style drag-to-rotate
 * affordance on the generated visuals. The selected index is announced so
 * screen-reader users know which image they are on.
 */
export function ProductGallery({
  product,
  activeColor,
}: {
  product: Product;
  activeColor?: ColorOption;
}) {
  const [index, setIndex] = useState(0);
  const { toggle, has, isHydrated } = useWishlist();
  const { toast } = useToast();
  const saved = isHydrated && has(product.id);

  // A colour change should reset the view to the front shot.
  useEffect(() => {
    setIndex(0);
  }, [activeColor?.name]);

  const images: ProductImage[] = product.images.length
    ? product.images
    : [{ url: '', alt: product.name, view: 'front' }];

  const onShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied', description: 'Share it anywhere you like.', tone: 'success' });
    } catch {
      // User dismissed the share sheet — no action needed.
    }
  }, [product.name, toast]);

  return (
    <div className="lg:sticky lg:top-28">
      {/* Stage */}
      <div className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white">
        <div className="aspect-square">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${index}-${activeColor?.name ?? 'default'}`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full"
            >
              <ProductVisual
                image={images[index]}
                alt={images[index]?.alt ?? product.name}
                accent={activeColor?.hex ?? product.accent}
                colors={activeColor ? [activeColor] : product.colors}
                view={images[index]?.view}
                name={product.name}
                highlights={product.highlights}
                rounded="rounded-none"
                priority
                className="h-full w-full"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* View label */}
        <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-ink-700 backdrop-blur-md">
          {images[index]?.view === 'back' ? 'Back' : images[index]?.view === 'detail' ? 'Detail' : 'Front'}
        </span>

        {/* Stage actions */}
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => toggle(product.id)}
            aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-pressed={saved}
            className={cn(
              'grid h-10 w-10 place-items-center rounded-full backdrop-blur-md transition-colors',
              saved ? 'bg-rose-500 text-white' : 'bg-white/85 text-ink-700 hover:text-rose-500',
            )}
          >
            <Heart className={cn('h-4.5 w-4.5', saved && 'fill-current')} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onShare}
            aria-label="Share this product"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/85 text-ink-700 backdrop-blur-md transition-colors hover:text-brand-600"
          >
            <Share2 className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-4 flex gap-3" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={`${img.alt}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`View image ${i + 1} of ${images.length}: ${img.view ?? 'front'}`}
              onClick={() => setIndex(i)}
              className={cn(
                'relative h-20 w-20 overflow-hidden rounded-xl border-2 transition-all duration-300',
                i === index
                  ? 'border-brand-500 shadow-soft'
                  : 'border-surface-200 opacity-70 hover:opacity-100',
              )}
            >
              <ProductVisual
                image={img}
                alt={img.alt}
                accent={activeColor?.hex ?? product.accent}
                colors={activeColor ? [activeColor] : product.colors}
                view={img.view}
                name={product.name}
                highlights={product.highlights}
                rounded="rounded-xl"
                className="h-full w-full"
              />
            </button>
          ))}
        </div>
      )}

      <p className="mt-4 flex items-center gap-2 text-xs text-ink-500">
        <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
        Select a colour to preview it on the device.
      </p>
    </div>
  );
}
