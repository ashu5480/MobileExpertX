'use client';

import type { Transition, Variants } from 'framer-motion';

/* ────────────────────────────────────────────────────────────────────────────
 *  Motion system
 *  Every animation in the app pulls from these presets so timing, easing and
 *  distance stay consistent. `useReducedMotion()` in the provider downgrades
 *  transforms/opacity to near-zero so `prefers-reduced-motion` visitors get a
 *  calm experience rather than a broken one.
 * ──────────────────────────────────────────────────────────────────────────── */

export const ease = [0.22, 1, 0.36, 1] as const;
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

export const spring: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
  mass: 0.7,
};

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 220,
  damping: 28,
  mass: 0.9,
};

export const durations = {
  fast: 0.24,
  base: 0.45,
  slow: 0.7,
  slower: 1,
} as const;

/* ── Scroll-triggered entrances ─────────────────────────────────────────── */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: durations.base, ease } },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -18 },
  show: { opacity: 1, y: 0, transition: { duration: durations.base, ease } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  show: { opacity: 1, x: 0, transition: { duration: durations.slow, ease } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  show: { opacity: 1, x: 0, transition: { duration: durations.slow, ease } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: durations.base, ease } },
};

export const blurIn: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(10px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: durations.slow, ease },
  },
};

/** Parent that reveals children one-by-one. */
export const stagger = (staggerChildren = 0.07, delayChildren = 0.04): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

/** Card-level child of a `stagger` group. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: durations.slow, ease },
  },
};

/* ── Viewport configs ───────────────────────────────────────────────────── */

export const viewportOnce = { once: true, amount: 0.2 } as const;
export const viewportOnceTight = { once: true, amount: 0.05 } as const;
export const viewportSoft = { once: true, amount: 0.12 } as const;

/* ── Interactive hover/tap presets ──────────────────────────────────────── */

export const hoverLift = {
  y: -6,
  transition: { duration: durations.fast, ease },
};

export const tapScale = { scale: 0.97 };

/* ── Reduced-motion-safe variants ───────────────────────────────────────── */

export const reducedFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
};

export const reducedStagger = (delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: 0.02, delayChildren: delay } },
});

export const reducedItem: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
};

/** Picks the calm variants when the visitor prefers reduced motion. */
export function useMotionVariants() {
  return { reducedFade, reducedStagger, reducedItem };
}
