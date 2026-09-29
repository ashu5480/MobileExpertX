'use client';

import { CartProvider, UIProvider } from '@/store/cartStore';
import { WishlistProvider } from '@/store/wishlistStore';
import { ToastProvider } from '@/store/toastStore';
import { MotionProvider } from '@/components/providers/MotionProvider';
import { Preloader } from '@/components/providers/Preloader';
import { SmoothScroll } from '@/components/providers/SmoothScroll';

/**
 * Single client boundary for all cross-cutting state and motion.
 * Keeping it in one place means layout stays a server component and the
 * client bundle is split only once.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <ToastProvider>
        <WishlistProvider>
          <CartProvider>
            <UIProvider>
              <SmoothScroll />
              <Preloader />
              {children}
            </UIProvider>
          </CartProvider>
        </WishlistProvider>
      </ToastProvider>
    </MotionProvider>
  );
}
