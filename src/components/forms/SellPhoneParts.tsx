'use client';

import { m, AnimatePresence } from 'framer-motion';

import { Check, ChevronLeft, ChevronRight, IndianRupee, Sparkles } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { OptionPill } from '@/components/ui/Field';
import { cn, formatPrice } from '@/lib/utils';
import { sellBrands, sellStorages } from '@/data/sellPhone';
import { usePrefersReducedMotion } from '@/components/providers/MotionProvider';

/** The 8 steps of the wizard, as required by the brief. */
export const STEPS = [
  { id: 1, title: 'Brand', hint: 'Who made it?' },
  { id: 2, title: 'Model', hint: 'Which one exactly?' },
  { id: 3, title: 'Condition', hint: 'How has it held up?' },
  { id: 4, title: 'Details', hint: 'Screen, battery, body' },
  { id: 5, title: 'Photos', hint: 'Help us assess it' },
  { id: 6, title: 'Your value', hint: 'Instant estimate' },
  { id: 7, title: 'You', hint: 'Contact details' },
  { id: 8, title: 'Pickup', hint: 'When and where' },
] as const;
export interface WizardState {
  brand: string;
  model: string;
  storage: string;
  condition: string;
  screen: string;
  battery: string;
  body: string;
  accessories: string[];
  hasOriginalBox: boolean;
  purchaseAge: string;
}
export const initialWizardState: WizardState = {
  brand: '',
  model: '',
  storage: '128 GB',
  condition: '',
  screen: '',
  battery: '',
  body: '',
  accessories: [],
  hasOriginalBox: false,
  purchaseAge: '',
};
/** Progress rail shown at the top of every step. */
export function WizardProgress({ step }: { step: number }) {
  const pct = ((step - 1) / (STEPS.length - 1)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-ink-500">
        <span>
          Step {step} of {STEPS.length}
        </span>
        <span className="text-brand-600">{STEPS[step - 1]?.title}</span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-200"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-label={`Step ${step} of ${STEPS.length}: ${STEPS[step - 1]?.title}`}
      >
        <m.div
          className="h-full rounded-full bg-brand-gradient"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        />
      </div>
    </div>
  );
}
/** Cross-fade wrapper that animates each step in and out. */
export function StepPanel({
  stepKey,
  children,
}: {
  stepKey: number;
  children: React.ReactNode;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <m.div
        key={stepKey}
        initial={reduced ? { opacity: 0 } : { opacity: 0, x: 28 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, x: -28 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
/** Wizard footer with Back / Next. `nextLabel` changes on the final step. */
export function WizardNav({
  step,
  onBack,
  onNext,
  nextDisabled,
  nextLabel = 'Continue',
}: {
  step: number;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-8 flex items-center gap-3">
      {step > 1 && (
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Button>
      )}
      <Button
        onClick={onNext}
        disabled={nextDisabled}
        className={cn('flex-1', step === 1 && 'sm:flex-none')}
      >
        {nextLabel}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
/** Small helper for the "value" callout used on the estimate step. */
export function ValueCallout({
  label,
  value,
  hint,
  tone = 'brand',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'brand' | 'emerald';
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border p-6 text-center',
        tone === 'emerald'
          ? 'border-emerald-500/25 bg-emerald-500/6'
          : 'border-brand-500/25 bg-brand-500/6',
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p
        className={cn(
          'mt-2 text-4xl font-extrabold tracking-tight',
          tone === 'emerald' ? 'text-emerald-600' : 'text-brand-600',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
export { sellBrands, sellStorages };
