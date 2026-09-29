'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, MessageCircle, Phone, ShoppingBag, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { buildTelUrl, buildWhatsAppUrl, siteConfig, whatsappMessages } from '@/lib/config';
import { NAV_LINKS } from './Navbar';
import { useCart, useUI } from '@/store/cartStore';
import { useWishlist } from '@/store/wishlistStore';
import { cn } from '@/lib/utils';

/**
 * Full-screen mobile navigation.
 *
 * Deliberately a separate surface from the desktop nav rather than a collapsed
 * dropdown: on a phone a full-height panel with large tap targets is far
 * easier to hit, and the links can be animated in with a stagger.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { isMenuOpen, setMenuOpen, openCart, setSearchOpen } = useUI();
  const { count } = useCart();
  const { count: wishlistCount, isHydrated } = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMenuOpen, setMenuOpen]);

  // Close the panel whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, setMenuOpen]);

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[105] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-ink-900/50 backdrop-blur-sm"
          />

          <motion.nav
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-surface-200 px-5 py-4">
              <Logo />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-xl p-2 text-ink-600 transition-colors hover:bg-surface-100 hover:text-ink-900"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-2.5 border-b border-surface-200 px-5 py-4">
              <QuickAction
                href="/wishlist"
                icon={Heart}
                label="Wishlist"
                badge={mounted && wishlistCount > 0 ? wishlistCount : undefined}
                onClick={() => setMenuOpen(false)}
              />
              <QuickAction
                href="/account"
                icon={User}
                label="Account"
                onClick={() => setMenuOpen(false)}
              />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openCart();
                }}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-surface-200 bg-surface-50 py-3 transition-colors hover:border-brand-200 hover:bg-brand-50"
              >
                <span className="relative">
                  <ShoppingBag className="h-5 w-5 text-ink-800" aria-hidden="true" />
                  {count > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gradient px-1 text-[10px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </span>
                <span className="text-xs font-semibold text-ink-700">Cart</span>
              </button>
            </div>

            {/* Links */}
            <ul className="flex-1 overflow-y-auto px-3 py-3">
              {NAV_LINKS.map((link, i) => {
                const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-3.5 py-3.5 text-[15px] font-semibold transition-colors',
                        active
                          ? 'bg-brand-500/10 text-brand-600'
                          : 'text-ink-800 hover:bg-surface-100',
                      )}
                    >
                      {link.label}
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                      )}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>

            {/* Contact CTAs — the two things a visitor most often wants */}
            <div className="space-y-2.5 border-t border-surface-200 bg-surface-50 p-4 pb-safe">
              <a
                href={buildWhatsAppUrl(siteConfig.contact.whatsapp, whatsappMessages.needHelp('anything'))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-white shadow-lift transition-colors hover:brightness-105"
              >
                <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
                Chat on WhatsApp
              </a>
              <a
                href={buildTelUrl(siteConfig.contact.phone, whatsappMessages.general())}
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-300 bg-white px-5 py-3.5 text-sm font-semibold text-ink-900 transition-colors hover:border-brand-300 hover:text-brand-600"
              >
                <Phone className="h-[18px] w-[18px]" aria-hidden="true" />
                Call {siteConfig.contact.phoneDisplay}
              </a>
            </div>
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  href: string;
  icon: typeof Heart;
  label: string;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-surface-200 bg-surface-50 py-3 transition-colors hover:border-brand-200 hover:bg-brand-50"
    >
      <span className="relative">
        <Icon className="h-5 w-5 text-ink-800" aria-hidden="true" />
        {badge ? (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="text-xs font-semibold text-ink-700">{label}</span>
    </Link>
  );
}
