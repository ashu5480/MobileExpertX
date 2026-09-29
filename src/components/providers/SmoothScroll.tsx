'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { usePrefersReducedMotion } from './MotionProvider';

/**
 * Smooth scrolling via Lenis.
 *
 * Deliberately opt-out when the visitor prefers reduced motion, and also
 * disabled on coarse-pointer (touch) devices, where momentum scrolling is
 * already native and hijacking it makes the page feel worse.
 */
export function SmoothScroll() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let lenis: Lenis | null = null;
    try {
      lenis = new Lenis({
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        smoothWheel: true,
        // Native touch scrolling stays untouched.
        syncTouch: false,
        touchMultiplier: 1.6,
      });
    } catch {
      return;
    }

    let frame = 0;
    const raf = (time: number) => {
      lenis?.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, [reduced]);

  return null;
}
