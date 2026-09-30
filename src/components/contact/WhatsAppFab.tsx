'use client';

import { m, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { buildWhatsAppUrl, siteConfig, whatsappMessages } from '@/lib/config';
import { usePrefersReducedMotion } from '@/components/providers/MotionProvider';
/**
 * Floating WhatsApp button.
 *
 * WhatsApp is the primary sales channel for this business, so the entry point
 * is visible on every page. It:
 *  • expands into a labelled bubble on first load (so it is actually noticed),
 *  • plays a single soft pulse rather than an attention-grabbing loop,
 *  • collapses to a bare icon while scrolling down and reappears on scroll up,
 *    so it never covers content the visitor is reading.
 *
 * The number and message come from `siteConfig` — nothing is hardcoded here.
 */
export function WhatsAppFab() {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const reduced = usePrefersReducedMotion();
  useEffect(() => setMounted(true), []);
  // Reveal the label briefly on load, then collapse to the icon.
  useEffect(() => {
    if (!mounted) return;
    setExpanded(true);
    const t = window.setTimeout(() => setExpanded(false), 4200);
    return () => window.clearTimeout(t);
  }, [mounted]);
  // Hide while scrolling down, show again on scroll up.
  useEffect(() => {
    if (!mounted) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (Math.abs(delta) > 8) {
        setHidden(delta > 0 && y > 260);
        lastY = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mounted]);
  const href = buildWhatsAppUrl(
    siteConfig.contact.whatsapp,
    whatsappMessages.needHelp(),
  );
  return (
    <AnimatePresence>
      {mounted && !hidden && (
        <m.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 20 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-[95] sm:right-6"
        >
          <AnimatePresence mode="wait">
            {expanded ? (
              <m.a
                key="expanded"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setExpanded(false)}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-14 items-center gap-0 overflow-hidden whitespace-nowrap rounded-full bg-[#25D366] pl-4 pr-5 text-sm font-semibold text-white shadow-[0_14px_40px_-10px_rgba(37,211,102,0.6)] transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                aria-label="Chat with us on WhatsApp"
              >
                <span className="relative grid h-8 w-8 place-items-center">
                  <MessageCircle className="h-6 w-6" aria-hidden="true" />
                  {!reduced && (
                    <span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-white/60" />
                  )}
                </span>
                <m.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ delay: 0.06, duration: 0.2 }}
                  className="pl-1"
                >
                  Need Help?
                </m.span>
              </m.a>
            ) : (
              <m.a
                key="collapsed"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="group relative grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_14px_40px_-10px_rgba(37,211,102,0.6)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                aria-label="Chat with us on WhatsApp"
              >
                <MessageCircle className="h-7 w-7" aria-hidden="true" />
                {!reduced && (
                  <span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-white/50" />
                )}
              </m.a>
            )}
          </AnimatePresence>
        </m.div>
      )}
    </AnimatePresence>
  );
}
