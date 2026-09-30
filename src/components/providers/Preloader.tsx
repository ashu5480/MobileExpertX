'use client';

import { m, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { siteConfig } from '@/lib/config';
import { usePrefersReducedMotion } from './MotionProvider';
/**
 * Branded loading screen.
 *
 * Intentionally short (~900 ms, and only on the very first visit of a
 * session) — long intros are the fastest way to make a site feel slow.
 * Capped to a single `sessionStorage` flag so navigating back never replays
 * it, and skipped entirely for reduced-motion visitors.
 */
const MAX_MS = 900;
export function Preloader() {
  const [visible, setVisible] = useState(false);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem('mex.booted') === '1';
    } catch {
      seen = false;
    }
    if (seen) return;
    setVisible(true);
    const start = performance.now();
    // Wait for fonts so the logo does not jump, but never block on slow networks.
    const ready = Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise((r) => requestAnimationFrame(() => r(null))),
    ]);
    const done = () => {
      const elapsed = performance.now() - start;
      window.setTimeout(() => {
        setVisible(false);
        try {
          window.sessionStorage.setItem('mex.booted', '1');
        } catch {
          /* private mode */
        }
      }, Math.max(0, MAX_MS - elapsed));
    };
    let cancelled = false;
    ready.then(() => {
      if (!cancelled) done();
    });
    // Hard ceiling in case fonts never resolve.
    const failsafe = window.setTimeout(done, MAX_MS + 400);
    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
    };
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <m.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: reduced ? 0.12 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-ink-900"
          aria-label="Loading MobilExpertX"
          role="status"
        >
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0 bg-aurora opacity-60" />
          <div className="pointer-events-none absolute inset-0 bg-grid-dark bg-grid opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_75%)]" />
          <div className="relative flex flex-col items-center">
            {/* Logo mark with a sweeping ring */}
            <div className="relative h-20 w-20">
              <m.span
                className="absolute inset-0 rounded-2xl bg-brand-gradient opacity-25 blur-xl"
                animate={reduced ? {} : { scale: [1, 1.12, 1], opacity: [0.25, 0.45, 0.25] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <svg
                viewBox="0 0 64 64"
                className="relative h-20 w-20"
                role="img"
                aria-label={siteConfig.name}
              >
                <defs>
                  <linearGradient id="preloader-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#0D9488" />
                  </linearGradient>
                </defs>
                <rect
                  x="18"
                  y="6"
                  width="28"
                  height="52"
                  rx="7"
                  fill="none"
                  stroke="url(#preloader-grad)"
                  strokeWidth="3"
                />
                <line x1="27" y1="12" x2="37" y2="12" stroke="url(#preloader-grad)" strokeWidth="2.5" strokeLinecap="round" />
                <m.circle
                  cx="32"
                  cy="44"
                  r="3"
                  fill="#6EE7B3"
                  animate={reduced ? {} : { opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              </svg>
              {/* Rotating dashed ring */}
              <m.span
                className="absolute -inset-3 rounded-[1.75rem] text-white/25 dashed-ring"
                animate={reduced ? {} : { rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <m.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4 }}
              className="mt-8 font-display text-2xl font-extrabold tracking-tight text-white"
            >
              <span className="text-white">MOBIL</span>
              <span className="bg-brand-gradient bg-clip-text text-transparent">EXPERTX</span>
            </m.p>
            {/* Progress bar */}
            <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-white/10">
              <m.div
                className="h-full rounded-full bg-brand-gradient"
                initial={{ width: '0%' }}
                animate={{ width: reduced ? '100%' : '100%' }}
                transition={{ duration: reduced ? 0.2 : 0.85, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
          <span className="sr-only">Loading, please wait…</span>
        </m.div>
      )}
    </AnimatePresence>
  );
}
