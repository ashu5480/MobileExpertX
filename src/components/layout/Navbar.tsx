'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Heart, Menu, Phone, Search, ShoppingBag, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { siteConfig } from '@/lib/config';
import { cn } from '@/lib/utils';
import { useCart, useUI } from '@/store/cartStore';
import { useWishlist } from '@/store/wishlistStore';
import { AddToCartFly } from './AddToCartFly';

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Sell Your Phone', href: '/sell-phone' },
  { label: 'Repair', href: '/repair' },
  { label: 'Accessories', href: '/accessories' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

/**
 * Sticky premium navbar.
 *
 * • Transparent over the hero, then solidifies with a blur + shadow once the
 *   page is scrolled (driven by `useScroll`, not a scroll listener, so it
 *   stays on the compositor and never blocks the main thread).
 * • A gradient "scroll progress" hairline runs along the bottom edge.
 * • The active link is tracked by pathname with a shared `layoutId`, so the
 *   pill glides between items instead of jumping.
 */
export function Navbar() {
  const pathname = usePathname();
  const { scrollY, scrollYProgress } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  const { count } = useCart();
  const { count: wishlistCount, isHydrated: wishlistReady } = useWishlist();
  const { openCart, setMenuOpen, setSearchOpen, setCartAnchor } = useUI();
  const cartIconRef = useRef<HTMLButtonElement>(null);

  useMotionValueEvent(scrollY, 'change', (latest) => setScrolled(latest > 24));

  useEffect(() => {
    setCartAnchor(cartIconRef.current);
  }, [setCartAnchor]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-[100] w-full transition-all duration-400 ease-premium',
          scrolled
            ? 'border-b border-surface-200/70 bg-white/85 shadow-soft backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <nav className="container flex h-[68px] items-center gap-3 lg:h-[72px]" aria-label="Main">
          <Logo className="shrink-0" />

          {/* ── Desktop links ─────────────────────────────────────────── */}
          <ul className="ml-4 hidden items-center gap-0.5 lg:flex xl:ml-8">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative block rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors duration-250 xl:px-3.5',
                      active ? 'text-brand-600' : 'text-ink-700 hover:text-ink-900',
                    )}
                  >
                    {link.label}
                    {active && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 -z-10 rounded-lg bg-brand-500/10"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* ── Right actions ─────────────────────────────────────────── */}
          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
              className="group hidden items-center gap-2 rounded-xl border border-surface-200 bg-surface-50 py-2 pl-3 pr-2 text-sm text-ink-400 transition-all duration-250 hover:border-brand-200 hover:bg-white hover:shadow-soft md:flex xl:w-56"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 text-left">Search phones…</span>
              <kbd className="rounded border border-surface-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-ink-400">
                /
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
              className="rounded-xl p-2.5 text-ink-700 transition-colors hover:bg-surface-100 hover:text-ink-900 md:hidden"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>

            <Link
              href="/wishlist"
              aria-label={`Wishlist, ${wishlistReady ? `${wishlistCount} items` : 'loading'}`}
              className="relative hidden rounded-xl p-2.5 text-ink-700 transition-colors hover:bg-surface-100 hover:text-ink-900 sm:block"
            >
              <Heart className="h-5 w-5" aria-hidden="true" />
              {wishlistReady && wishlistCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/account"
              aria-label="Your account"
              className="hidden rounded-xl p-2.5 text-ink-700 transition-colors hover:bg-surface-100 hover:text-ink-900 sm:block"
            >
              <User className="h-5 w-5" aria-hidden="true" />
            </Link>

            <a
              href={`tel:${siteConfig.contact.phoneDialable}`}
              aria-label={`Call ${siteConfig.contact.phoneDisplay}`}
              className="hidden rounded-xl p-2.5 text-ink-700 transition-colors hover:bg-surface-100 hover:text-ink-900 xl:block"
            >
              <Phone className="h-5 w-5" aria-hidden="true" />
            </a>

            <button
              ref={cartIconRef}
              type="button"
              onClick={openCart}
              aria-label={`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`}
              className="relative rounded-xl p-2.5 text-ink-900 transition-colors hover:bg-surface-100"
            >
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              <AnimateBadge value={count} />
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="rounded-xl p-2.5 text-ink-900 transition-colors hover:bg-surface-100 lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </nav>

        <motion.div
          className="h-[2px] origin-left bg-brand-gradient"
          style={{ scaleX: scrollYProgress }}
          aria-hidden="true"
        />
      </header>

      <AddToCartFly />
    </>
  );
}

/** Animated count badge on the cart icon. */
function AnimateBadge({ value }: { value: number }) {
  return (
    <AnimatePresence>
      {value > 0 && (
        <motion.span
          key={value}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 20 }}
          className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gradient px-1 text-[10px] font-bold text-white ring-2 ring-white"
        >
          {value > 99 ? '99+' : value}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
