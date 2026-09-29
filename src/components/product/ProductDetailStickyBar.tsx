'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '@/store/cartStore';
import { useToast } from '@/store/toastStore';
import { makeVariantKey } from '@/lib/pricing';
import { buildWhatsAppUrl, siteConfig, whatsappMessages } from '@/lib/config';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

/**
 * Mobile sticky action bar.
 *
 * A desktop two-column buy box means the CTA scrolls out of reach on a phone.
 * This keeps price + add-to-cart permanently in thumb reach, and only appears
 * once the real buy box has left the viewport — so it never duplicates a
 * button the visitor can already see.
 */
export function ProductDetailStickyBar({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { success } = useToast();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Show the bar once the visitor is ~70% down the page.
      setVisible(window.scrollY > Math.min(700, window.innerHeight * 0.7));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-[90] border-t border-surface-200 bg-white/95 backdrop-blur-xl lg:hidden"
        >
          <div className="flex items-center gap-3 p-3 pb-safe">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-ink-500">{product.name}</p>
              <p className="text-base font-extrabold text-ink-900">
                {formatPrice(product.price)}
              </p>
            </div>

            <a
              href={buildWhatsAppUrl(
                siteConfig.contact.whatsapp,
                whatsappMessages.askAboutPhone(product.name, product.sku),
              )}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ask about this phone on WhatsApp"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#25D366]/10 text-[#128C4B]"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </a>

            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={() => {
                addItem(product, makeVariantKey({}));
                success('Added to cart', product.name);
              }}
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-white shadow-lift disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Add to cart
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
