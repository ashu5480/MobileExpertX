'use client';

import { Check, ImagePlus, Sparkles, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { OptionPill } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import {
  STEPS,
  StepPanel,
  ValueCallout,
  WizardNav,
  WizardProgress,
  initialWizardState,
  type WizardState,
} from './SellPhoneParts';
import {
  sellAccessoryOptions,
  sellBatteryConditions,
  sellBodyConditions,
  sellBrands,
  sellConditions,
  sellPurchaseAges,
  sellScreenConditions,
  sellStorages,
} from '@/data/sellPhone';
import { estimateResaleValue, type SellQuote } from '@/lib/pricing';
import { formatPrice, cn } from '@/lib/utils';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  SellPhoneWizard — steps 1 to 6
 * ────────────────────────────────────────────────────────────────────────────
 *  Two deliberate choices:
 *
 *  1. The estimate is computed *locally* with the same `estimateResaleValue`
 *     model the server uses, so it updates instantly on every answer. On
 *     submit the server re-quotes authoritatively, so a tampered client can
 *     never change the recorded figure.
 *  2. Image uploads stay in memory as object URLs, so the wizard is fully
 *     usable offline and never blocks on a network round trip.
 */

export function SellPhoneWizard({
  onComplete,
}: {
  onComplete: (data: { state: WizardState; quote: SellQuote; images: File[] }) => void;
}) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(initialWizardState);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const brand = useMemo(
    () => sellBrands.find((b) => b.name === state.brand),
    [state.brand],
  );
  const model = useMemo(
    () => brand?.models.find((m) => m.name === state.model),
    [state.brand, state.model],
  );

  /** Local mirror of the server's valuation — instant, no round trip. */
  const quote = useMemo<SellQuote | null>(() => {
    if (!model) return null;
    return estimateResaleValue({
      baseValuePaise: model.base,
      storage: state.storage,
      condition: state.condition || 'good',
      screen: state.screen || 'perfect',
      battery: state.battery || 'healthy',
      body: state.body || 'pristine',
      accessories: state.accessories,
      hasOriginalBox: state.hasOriginalBox,
      purchaseAge: state.purchaseAge || '6-12',
    });
  }, [model, state]);

  const set = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Per-step validation — gates the Continue button. */
  const stepValid = useMemo(() => {
    switch (step) {
      case 1:
        return Boolean(state.brand);
      case 2:
        return Boolean(state.model && state.storage);
      case 3:
        return Boolean(state.condition);
      case 4:
        return Boolean(state.screen && state.battery && state.body && state.purchaseAge);
      default:
        return true;
    }
  }, [step, state]);

  const next = () => setStep((s) => Math.min(STEPS.length, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 6);
    setImages((prev) => [...prev, ...picked].slice(0, 6));
    setPreviews((prev) => [...prev, ...picked.map((f) => URL.createObjectURL(f))].slice(0, 6));
  };

  const removeImage = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  return (
    <div className="rounded-3xl border border-surface-200 bg-white p-5 shadow-card sm:p-8">
      <WizardProgress step={step} />

      <div className="mt-8 min-h-[340px]">
        <StepPanel stepKey={step}>
          {/* ── Step 1 · Brand ──────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <StepHeading title="Which brand is it?" hint="Pick the manufacturer and we will narrow down the model." />
              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {sellBrands.map((b) => (
                  <button
                    key={b.slug}
                    type="button"
                    onClick={() => {
                      set('brand', b.name);
                      set('model', '');
                    }}
                    aria-pressed={state.brand === b.name}
                    className={cn(
                      'relative rounded-2xl border-2 px-4 py-4 text-left transition-all duration-250',
                      state.brand === b.name
                        ? 'border-brand-500 bg-brand-500/6 shadow-[0_0_0_3px_rgba(37,99,255,0.1)]'
                        : 'border-surface-200 bg-white hover:border-brand-300 hover:bg-brand-500/4',
                    )}
                  >
                    <span className="block text-sm font-bold text-ink-900">{b.name}</span>
                    <span className="mt-0.5 block text-xs text-ink-500">
                      {b.models.length} models
                    </span>
                    {state.brand === b.name && (
                      <Check className="absolute right-3 top-3 h-4 w-4 text-brand-500" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2 · Model + storage ────────────────────────────── */}
          {step === 2 && (
            <div>
              <StepHeading title={`Which ${state.brand} model?`} hint="Pick the exact model so we quote it correctly." />
              <div className="mt-6 flex flex-wrap gap-2">
                {(brand?.models ?? []).map((m) => (
                  <OptionPill
                    key={m.name}
                    selected={state.model === m.name}
                    onClick={() => set('model', m.name)}
                  >
                    {m.name}
                  </OptionPill>
                ))}
              </div>

              <h3 className="mt-7 mb-2.5 text-[13px] font-semibold text-ink-800">
                How much storage?
              </h3>
              <div className="flex flex-wrap gap-2">
                {sellStorages.map((s) => (
                  <OptionPill
                    key={s}
                    selected={state.storage === s}
                    onClick={() => set('storage', s)}
                  >
                    {s}
                  </OptionPill>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3 · Overall condition ──────────────────────────── */}
          {step === 3 && (
            <div>
              <StepHeading
                title="How has it held up?"
                hint="Be honest here — the final quote is confirmed after a free inspection, and we do not reduce it afterwards."
              />
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {sellConditions.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set('condition', c.value)}
                    aria-pressed={state.condition === c.value}
                    className={cn(
                      'rounded-2xl border-2 px-4 py-4 text-left transition-all duration-250',
                      state.condition === c.value
                        ? 'border-brand-500 bg-brand-500/6'
                        : 'border-surface-200 hover:border-brand-300 hover:bg-brand-500/4',
                    )}
                  >
                    <span className="block text-sm font-bold text-ink-900">{c.label}</span>
                    <span className="mt-0.5 block text-xs text-ink-500">{c.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4 · Device questions ───────────────────────────── */}
          {step === 4 && (
            <div className="space-y-7">
              <OptionGroup
                label="Screen condition"
                options={sellScreenConditions}
                value={state.screen}
                onChange={(v) => set('screen', v)}
              />
              <OptionGroup
                label="Battery condition"
                options={sellBatteryConditions}
                value={state.battery}
                onChange={(v) => set('battery', v)}
              />
              <OptionGroup
                label="Body condition"
                options={sellBodyConditions}
                value={state.body}
                onChange={(v) => set('body', v)}
              />
              <OptionGroup
                label="When did you buy it?"
                options={sellPurchaseAges}
                value={state.purchaseAge}
                onChange={(v) => set('purchaseAge', v)}
              />

              <div>
                <h3 className="mb-2.5 text-[13px] font-semibold text-ink-800">
                  What came with it?
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sellAccessoryOptions.map((acc) => {
                    const selected = state.accessories.includes(acc);
                    return (
                      <OptionPill
                        key={acc}
                        selected={selected}
                        onClick={() =>
                          set(
                            'accessories',
                            selected
                              ? state.accessories.filter((a) => a !== acc)
                              : [...state.accessories, acc],
                          )
                        }
                      >
                        {selected && (
                          <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {acc}
                      </OptionPill>
                    );
                  })}
                </div>

                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-surface-300 bg-surface-50 px-4 py-3 transition-colors hover:border-brand-300">
                  <input
                    type="checkbox"
                    checked={state.hasOriginalBox}
                    onChange={(e) => set('hasOriginalBox', e.target.checked)}
                    className="h-4 w-4 rounded border-surface-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm font-semibold text-ink-800">
                    I have the original box
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ── Step 5 · Photos ─────────────────────────────────────── */}
          {step === 5 && (
            <div>
              <StepHeading
                title="Add a few photos"
                hint="Optional, but it speeds up the quote. Front, back, and any damage you want us to know about."
              />

              <div className="mt-6">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => onFiles(e.target.files)}
                  className="sr-only"
                  id="sell-photos"
                />
                <label
                  htmlFor="sell-photos"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-300 bg-surface-50 px-6 py-12 text-center transition-colors hover:border-brand-400 hover:bg-brand-500/4"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-soft">
                    <ImagePlus className="h-6 w-6 text-brand-500" aria-hidden="true" />
                  </span>
                  <span className="mt-4 text-sm font-bold text-ink-900">Tap to add photos</span>
                  <span className="mt-1 text-xs text-ink-500">
                    Up to 6 images · JPG or PNG
                  </span>
                </label>

                {previews.length > 0 && (
                  <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {previews.map((src, i) => (
                      <li key={src} className="relative aspect-square overflow-hidden rounded-xl">
                        {/* Blob object URLs come from user-picked local files. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`Device photo ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          aria-label={`Remove photo ${i + 1}`}
                          className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-ink-900/80 text-white"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* ── Step 6 · Estimated value ────────────────────────────── */}
          {step === 6 && quote && (
            <div>
              <StepHeading
                title="Here is your estimated value"
                hint="This is the figure we will honour after a free inspection at our store."
              />

              <div className="mt-6">
                <ValueCallout
                  label="You could get"
                  value={formatPrice(quote.estimatedValuePaise)}
                  hint={`Expected range ${formatPrice(quote.lowPaise)} – ${formatPrice(quote.highPaise)}`}
                  tone="emerald"
                />
              </div>

              <h3 className="mt-7 mb-3 text-[13px] font-semibold text-ink-800">
                How we got there
              </h3>
              <ul className="space-y-2">
                {quote.breakdown.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm"
                  >
                    <span className="text-ink-600">{row.label}</span>
                    <span
                      className={cn(
                        'font-semibold tabular-nums',
                        row.factor >= 1 ? 'text-emerald-600' : 'text-rose-500',
                      )}
                    >
                      {row.factor >= 1 ? '+' : ''}
                      {((row.factor - 1) * 100).toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 flex items-start gap-2 rounded-2xl bg-brand-500/6 p-4 text-xs leading-relaxed text-ink-600">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
                Final payment is made on the same day as the inspection, in cash or by
                UPI. We never reduce a confirmed quote.
              </p>
            </div>
          )}
        </StepPanel>
      </div>

      <WizardNav
        step={step}
        onBack={back}
        onNext={() => {
          // Step 6 is the last step handled here — hand off to the contact form.
          if (step === 6 && quote) onComplete({ state, quote, images });
          else next();
        }}
        nextDisabled={!stepValid}
        nextLabel={step === 6 ? 'Continue to details' : 'Continue'}
      />
    </div>
  );
}

function StepHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h2 className="text-title-lg font-extrabold tracking-tight text-ink-900">{title}</h2>
      {hint && <p className="mt-2 text-sm leading-relaxed text-ink-600">{hint}</p>}
    </div>
  );
}

/** Labelled grid of option cards, each with a short hint line. */
function OptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: string; label: string; hint?: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-2.5 text-[13px] font-semibold text-ink-800">{label}</h3>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={cn(
              'rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-250',
              value === option.value
                ? 'border-brand-500 bg-brand-500/6'
                : 'border-surface-200 hover:border-brand-300 hover:bg-brand-500/4',
            )}
          >
            <span className="block text-sm font-bold text-ink-900">{option.label}</span>
            {option.hint && (
              <span className="mt-0.5 block text-xs text-ink-500">{option.hint}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

