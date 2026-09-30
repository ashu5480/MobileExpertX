'use client';

import { m } from 'framer-motion';
import { ArrowLeft, Building2, CheckCircle2, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea, OptionPill } from '@/components/ui/Field';
import { WizardProgress, type WizardState } from './SellPhoneParts';
import { pickupTimeSlots } from '@/data/sellPhone';
import { sellPhoneApi } from '@/services/api';
import { sellPhoneSchema, type SellPhoneInput } from '@/lib/validation';
import { useToast } from '@/store/toastStore';
import {
  buildTelUrl,
  buildWhatsAppUrl,
  siteConfig,
  whatsappMessages,
} from '@/lib/config';
import { formatPrice, todayISO } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { SellQuote } from '@/lib/pricing';
interface Props {
  state: WizardState;
  quote: SellQuote;
  imageCount: number;
  onBack: () => void;
}
/**
 * Steps 7 and 8 of the sell-phone flow: customer details and pickup preference.
 *
 * Validation runs client-side for instant feedback, but the same Zod schema
 * runs again inside `POST /api/sell-phone` — and the server re-derives the
 * valuation from the model matrix, so nothing here is trusted.
 */
export function SellPhoneDetails({ state, quote, imageCount, onBack }: Props) {
  const { celebrate, error: errorToast } = useToast();
  const [step, setStep] = useState<7 | 8>(7);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ reference: string; message: string } | null>(null);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    address: '',
    pickupDate: todayISO(),
    pickupTime: pickupTimeSlots[1],
    notes: '',
  });
  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };
  const validateStep7 = (): boolean => {
    const candidate = {
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail,
      address: form.address,
    };
    const result = sellPhoneSchema
      .pick({
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        address: true,
        pickupDate: true,
        pickupTime: true,
      })
      .safeParse({ ...candidate, pickupDate: form.pickupDate, pickupTime: form.pickupTime });
    if (result.success) return true;
    const next: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      if (!next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return false;
  };
  const submit = async () => {
    setSubmitting(true);
    setErrors({});
    const payload: SellPhoneInput = {
      brand: state.brand,
      model: state.model,
      storage: state.storage,
      condition: state.condition,
      screen: state.screen,
      battery: state.battery,
      body: state.body,
      accessories: state.accessories,
      hasOriginalBox: state.hasOriginalBox,
      purchaseAge: state.purchaseAge,
      // Optimistic figure only — the server recomputes and ignores this.
      estimatedValuePaise: quote.estimatedValuePaise,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail,
      address: form.address,
      pickupDate: form.pickupDate,
      pickupTime: form.pickupTime,
      imageCount,
      notes: form.notes || undefined,
    };
    try {
      const { request, message } = await sellPhoneApi.submit(payload);
      setDone({ reference: request.reference, message });
      celebrate(
        'Request received',
        `Reference ${request.reference}. We will call you to confirm the pickup.`,
      );
    } catch (err) {
      const apiErr = err as { fieldErrors?: Record<string, string>; message?: string };
      if (apiErr.fieldErrors && Object.keys(apiErr.fieldErrors).length) {
        setErrors(apiErr.fieldErrors);
        setStep(7);
      } else {
        errorToast(
          'Could not submit the request',
          apiErr.message ?? 'Please try again, or send us the details on WhatsApp.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };
  const whatsappSummary = [
    `Device: ${state.brand} ${state.model} · ${state.storage}`,
    `Condition: ${state.condition.replace('-', ' ')} (screen: ${state.screen}, battery: ${state.battery})`,
    `Age: ${state.purchaseAge} months`,
    state.hasOriginalBox ? 'I have the original box' : 'No original box',
    `My name: ${form.customerName || '(name here)'}`,
  ].join('\n');
  // ── Success state ───────────────────────────────────────────────────────
  if (done) {
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-emerald-500/25 bg-white p-8 text-center shadow-card sm:p-10"
      >
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lift">
          <CheckCircle2 className="h-8 w-8 text-white" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-xl font-extrabold tracking-tight text-ink-900">
          Your request is in
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{done.message}</p>
        <p className="mt-4 inline-flex rounded-full bg-surface-100 px-3.5 py-1.5 font-mono text-sm font-semibold text-ink-800">
          {done.reference}
        </p>
        <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
          <a
            href={buildWhatsAppUrl(
              siteConfig.contact.whatsapp,
              whatsappMessages.sellPhone(whatsappSummary),
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Continue on WhatsApp
          </a>
          <a
            href={buildTelUrl(siteConfig.contact.phone, whatsappMessages.sellPhone())}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-surface-300 bg-white px-5 py-3.5 text-sm font-semibold text-ink-900"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call {siteConfig.contact.phoneDisplay}
          </a>
        </div>
      </m.div>
    );
  }
  return (
    <div className="rounded-3xl border border-surface-200 bg-white p-5 shadow-card sm:p-8">
      <WizardProgress step={step} />
      <div className="mt-8">
        {step === 7 ? (
          <div>
            <h2 className="text-title-lg font-extrabold tracking-tight text-ink-900">
              Where should we call you?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              We will confirm the quote and the pickup slot with you personally.
            </p>
            <div className="mt-6 space-y-4">
              <Field label="Full name" htmlFor="sell-name" error={errors.customerName} required>
                <Input
                  id="sell-name"
                  value={form.customerName}
                  onChange={(e) => set('customerName', e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  error={errors.customerName}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Mobile number"
                  htmlFor="sell-phone"
                  error={errors.customerPhone}
                  required
                  hint="We will call or WhatsApp this number"
                >
                  <Input
                    id="sell-phone"
                    type="tel"
                    inputMode="tel"
                    value={form.customerPhone}
                    onChange={(e) => set('customerPhone', e.target.value)}
                    placeholder="98765 43210"
                    autoComplete="tel"
                    error={errors.customerPhone}
                  />
                </Field>
                <Field label="Email" htmlFor="sell-email" error={errors.customerEmail} required>
                  <Input
                    id="sell-email"
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => set('customerEmail', e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    error={errors.customerEmail}
                  />
                </Field>
              </div>
              <Field
                label="Pickup address"
                htmlFor="sell-address"
                error={errors.address}
                required
                hint="Where the device is, in case we collect it"
              >
                <Textarea
                  id="sell-address"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="Flat / house, street, area, city, PIN code"
                  rows={3}
                  error={errors.address}
                />
              </Field>
            </div>
            <div className="mt-8 flex gap-3">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Button>
              <Button
                onClick={() => {
                  if (validateStep7()) setStep(8);
                }}
                className="flex-1"
              >
                Choose a pickup slot
              </Button>
            </div>
          </div>
        ) : (
          /* ── Step 8 · Pickup details ─────────────────────────────── */
          <div>
            <h2 className="text-title-lg font-extrabold tracking-tight text-ink-900">
              When suits you for pickup?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              We will confirm this slot by phone. If nothing works, walk in any time
              during {siteConfig.hours.display}.
            </p>
            <div className="mt-6 space-y-5">
              <Field
                label="Preferred date"
                htmlFor="pickup-date"
                error={errors.pickupDate}
                required
              >
                <Input
                  id="pickup-date"
                  type="date"
                  min={todayISO()}
                  value={form.pickupDate}
                  onChange={(e) => set('pickupDate', e.target.value)}
                  error={errors.pickupDate}
                />
              </Field>
              <div>
                <h3 className="mb-2.5 text-[13px] font-semibold text-ink-800">
                  Preferred time slot
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pickupTimeSlots.map((slot) => (
                    <OptionPill
                      key={slot}
                      selected={form.pickupTime === slot}
                      onClick={() => set('pickupTime', slot)}
                    >
                      {slot}
                    </OptionPill>
                  ))}
                </div>
                {errors.pickupTime && (
                  <p role="alert" className="mt-1.5 text-[13px] font-medium text-rose-600">
                    {errors.pickupTime}
                  </p>
                )}
              </div>
              <Field
                label="Anything else we should know?"
                htmlFor="sell-notes"
                hint="Optional — charger included, a particular fault, a preferred payment method."
              >
                <Textarea
                  id="sell-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Optional notes…"
                />
              </Field>
              {/* Recap */}
              <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                  Your estimated value
                </p>
                <p className="mt-1 text-2xl font-extrabold text-brand-700">
                  {formatPrice(quote.estimatedValuePaise)}
                </p>
                <p className="mt-2 text-xs text-ink-600">
                  {state.brand} {state.model} · {state.storage} ·{' '}
                  {state.condition.replace('-', ' ')}
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <Button
                size="lg"
                onClick={submit}
                loading={submitting}
                loadingText="Submitting…"
                fullWidth
              >
                Confirm and book my pickup
              </Button>
              <Button variant="outline" onClick={onBack} fullWidth>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Button>
            </div>
            <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
              We factory-reset and data-wipe every device on receipt. You can watch us do it.
            </p>
            <div className="mt-5 border-t border-surface-200 pt-5">
              <p className="text-xs font-semibold text-ink-600">Prefer to talk?</p>
              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                <a
                  href={buildWhatsAppUrl(
                    siteConfig.contact.whatsapp,
                    whatsappMessages.sellPhone(whatsappSummary),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 px-4 py-3 text-sm font-semibold text-[#128C4B] transition-colors hover:bg-[#25D366]/20"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Sell on WhatsApp
                </a>
                <a
                  href={buildTelUrl(siteConfig.contact.phone, whatsappMessages.sellPhone())}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-100 px-4 py-3 text-sm font-semibold text-ink-800 transition-colors hover:bg-surface-200"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Call {siteConfig.contact.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
