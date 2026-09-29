'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useUI } from '@/store/cartStore';
import { usePrefersReducedMotion } from '@/components/providers/MotionProvider';

interface Point {
  x: number;
  y: number;
}

/**
 * Fly-to-cart micro-interaction.
 *
 * When an item is added, `registerFlySource(el)` captures the product image's
 * screen rectangle. This component animates a tinted ghost of that image from
 * the capture point to the cart icon along a quadratic Bézier arc, so it reads
 * as physical rather than linear.
 *
 * All geometry is measured inside an effect (never during render), so the
 * module is safe to server-render, and the node is removed once the flight
 * ends so the next add can trigger a fresh animation.
 */
export function AddToCartFly() {
  const { flySource, cartAnchor } = useUI();
  const reduced = usePrefersReducedMotion();
  const [points, setPoints] = useState<{ from: Point; to: Point; key: number } | null>(null);

  useEffect(() => {
    if (!flySource) {
      setPoints(null);
      return;
    }

    const { rect, key } = flySource;
    const from: Point = {
      x: rect.left + rect.width / 2 - 32,
      y: rect.top + rect.height / 2 - 32,
    };

    let to: Point = { x: window.innerWidth - 48, y: 32 };
    if (cartAnchor) {
      const anchorRect = cartAnchor.getBoundingClientRect();
      to = {
        x: anchorRect.left + anchorRect.width / 2 - 16,
        y: anchorRect.top + anchorRect.height / 2 - 16,
      };
    }

    setPoints({ from, to, key });
  }, [flySource, cartAnchor]);

  useEffect(() => {
    if (!points) return;
    const timer = window.setTimeout(() => setPoints(null), 820);
    return () => window.clearTimeout(timer);
  }, [points]);

  if (!points || reduced) return null;

  // Control point above the midpoint gives a satisfying arc.
  const cx = (points.from.x + points.to.x) / 2;
  const cy = Math.min(points.from.y, points.to.y) - 130;

  return (
    <AnimatePresence>
      <motion.div
        key={points.key}
        initial={{ left: points.from.x, top: points.from.y, opacity: 0, scale: 0.4 }}
        animate={{
          left: [points.from.x, cx, points.to.x],
          top: [points.from.y, cy, points.to.y],
          opacity: [0, 1, 1, 0],
          scale: [0.4, 1, 0.7, 0.25],
          rotate: [0, 0, 120, 240],
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.78, ease: [0.32, 0, 0.4, 1] }}
        className="pointer-events-none fixed z-[150] h-16 w-16 rounded-2xl shadow-lift"
        style={{
          background: flySource
            ? `radial-gradient(circle at 32% 28%, ${flySource.accent}66, ${flySource.accent}22)`
            : 'rgba(37,99,255,0.25)',
          border: flySource ? `1px solid ${flySource.accent}66` : '1px solid rgba(37,99,255,0.25)',
        }}
        aria-hidden="true"
      />
    </AnimatePresence>
  );
}
