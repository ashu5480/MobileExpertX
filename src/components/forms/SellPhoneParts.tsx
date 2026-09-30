'use client';

import { m, AnimatePresence } from 'framer-motion';

import { Check, ChevronLeft, ChevronRight, IndianRupee, Sparkles } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { OptionPill } from '@/components/ui/Field';
import { cn, formatPrice } from '@/lib/utils';
import { sellBrands, sellStorages } from '@/data/sellPhone';
import { usePrefersReducedMotion } from '@/components/providers/MotionProvider';
import { GRADE_COPY, type DeviceGrade, type GradeResult } from '@/lib/pricing';

/**
 * The 8 steps of the wizard, as required by the brief.
 *
 * This is the granular question-by-question progress rail. The coarser
 * three-phase framing ("Tell us about it → See your price → Book the pickup")
 * lives in `src/data/sellPhone.ts` as `sellPhases`, because `/sell-phone`
 * renders it from a server component and cannot touch a `'use client'` export.
 */
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
/**
 * ────────────────────────────────────────────────────────────────────────────
 *  GradeBadge — the Superb / Good / Fair chip Cashify shows next to the price.
 * ────────────────────────────────────────────────────────────────────────────
 *  Deliberately not interactive: the grade is an *output* of the condition
 *  answers, never something the customer picks. Making it look selectable would
 *  imply they can inflate their own quote.
 */

const GRADE_STYLES: Record<DeviceGrade, string> = {
  superb: 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/30',
  good: 'bg-sky-500/12 text-sky-700 ring-sky-500/30',
  fair: 'bg-amber-500/12 text-amber-700 ring-amber-500/30',
  'non-working': 'bg-surface-200 text-ink-600 ring-surface-300',
};

export function GradeBadge({ grade, size = 'md' }: { grade: DeviceGrade; size?: 'sm' | 'md' }) {
  const label = GRADE_COPY[grade].label;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wide ring-1',
        GRADE_STYLES[grade],
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
      )}
    >
      <Sparkles className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden="true" />
      {label}
    </span>
  );
}

/** Full grade explainer: the chip, the blurb, and why we landed there. */
export function GradeCard({ grade }: { grade: GradeResult }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <GradeBadge grade={grade.grade} />
        <span className="text-xs font-semibold text-ink-500">Your phone grades as</span>
      </div>
      <p className="mt-2.5 text-sm font-medium text-ink-800">{GRADE_COPY[grade.grade].blurb}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{grade.reason}</p>
    </div>
  );
}

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
  grade,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'brand' | 'emerald';
  /** When present, the Superb/Good/Fair chip is shown above the price. */
  grade?: GradeResult;
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
      {grade && (
        <div className="mt-2.5 flex justify-center">
          <GradeBadge grade={grade.grade} />
        </div>
      )}
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
