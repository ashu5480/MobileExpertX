'use client';

import { LazyMotion, MotionConfig, domAnimation, useReducedMotion } from 'framer-motion';
import { createContext, useContext, useMemo } from 'react';

/**
 * Motion provider.
 *
 * `LazyMotion` with `domAnimation` loads the animation runtime on demand
 * instead of shipping the full bundle upfront — a meaningful saving on the
 * first paint, which matters a lot on mobile.
 *
 * `MotionConfig` centralises the transition curve and routes every animation
 * through Framer's reduced-motion handling, so components do not each have to
 * re-implement it.
 */

interface MotionCtx {
  reduced: boolean;
}

const Ctx = createContext<MotionCtx>({ reduced: false });

export function usePrefersReducedMotion(): boolean {
  return useContext(Ctx).reduced;
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const systemReduced = useReducedMotion() ?? false;
  const value = useMemo<MotionCtx>(() => ({ reduced: systemReduced }), [systemReduced]);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig
        reducedMotion={systemReduced ? 'always' : 'never'}
        transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.7 }}
      >
        <Ctx.Provider value={value}>{children}</Ctx.Provider>
      </MotionConfig>
    </LazyMotion>
  );
}
