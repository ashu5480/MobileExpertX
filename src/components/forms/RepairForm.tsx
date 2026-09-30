'use client';

import { m } from 'framer-motion';
import { MessageCircle, Phone, Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { repairsApi } from '@/services/api';
import { repairBookingSchema } from '@/lib/validation';
import { useToast } from '@/store/toastStore';
import { repairBrands, repairBrandModels } from '@/data/repairs';
import { buildTelUrl, buildWhatsAppUrl, siteConfig, whatsappMessages } from '@/lib/config';
import { formatPrice, todayISO } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { RepairBooking, RepairService } from '@/types';
const TIME_SLOTS = [
  '10:00 AM – 11:30 AM',
  '11:30 AM – 1:00 PM',
  '1:00 PM – 2:30 PM',
  '2:30 PM – 4:00 PM',
  '4:00 PM – 5:30 PM',
  '5:30 PM – 7:00 PM',
];
/**
 * Book-a-repair form.
 *
 * Zod validation runs here for instant field-level feedback, then the exact
 * same schema runs again inside `POST /api/repairs`. Brand → model options are
 * linked, so a customer can never submit a model that does not belong to the
 * brand they picked.
 */
export function RepairForm({ service }: { service?: RepairService }) {
  const { celebrate, error: errorToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    brand: repairBrands[0],
    model: repairBrandModels[repairBrands[0]][0],
    problem: '',
    preferredDate: todayISO(),
    preferredTime: TIME_SLOTS[1],
    dropoff: 'walk-in' as 'walk-in' | 'pickup',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<RepairBooking | null>(null);
  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };
  const models = repairBrandModels[form.brand] ?? [];
  const submit = async () => {
    const payload = {
      ...form,
      email: form.email || undefined,
      notes: form.notes || undefined,
      serviceSlug: service?.slug,
    };
    const parsed = repairBookingSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      // Move focus to the first problem so keyboard users are not stranded.
      const firstKey = Object.keys(next)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }
    setSubmitting(true);
    setErrors({});
    try {
      const { booking: created } = await repairsApi.book(parsed.data);
      setBooking(created);
      celebrate(
        'Repair slot reserved',
        `Reference ${created.reference}. We will call to confirm.`,
      );
    } catch (err) {
      const apiErr = err as { fieldErrors?: Record<string, string>; message?: string };
      if (apiErr.fieldErrors && Object.keys(apiErr.fieldErrors).length) {
        setErrors(apiErr.fieldErrors);
      } else {
        errorToast(
          'Could not book the repair',
          apiErr.message ?? 'Please try again, or call us directly.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };
  const whatsappBody = [
    service ? `Service: ${service.name}` : 'Service: not sure yet',
    `Device: ${form.brand} ${form.model}`,
    form.problem ? `Problem: ${form.problem}` : '',
    `Preferred: ${form.preferredDate}, ${form.preferredTime}`,
  ]
    .filter(Boolean)
    .join('\n');
  // ── Success ─────────────────────────────────────────────────────────────
  if (booking) {
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-emerald-500/25 bg-white p-8 text-center shadow-card sm:p-10"
      >
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lift">
          <Send className="h-7 w-7 text-white" aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-xl font-extrabold tracking-tight text-ink-900">
          Your slot is reserved
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          We have pencilled you in for {booking.preferredDate} at {booking.preferredTime}.
          Our technician will call {siteConfig.contact.phoneDisplay} to confirm.
        </p>
        <p className="mt-4 inline-flex rounded-full bg-surface-100 px-3.5 py-1.5 font-mono text-sm font-semibold text-ink-800">
          {booking.reference}
        </p>
        <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
          <a
            href={buildWhatsAppUrl(siteConfig.contact.whatsapp, whatsappMessages.bookRepair(service?.name, `${form.brand} ${form.model}`))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Confirm on WhatsApp
          </a>
          <a
            href={buildTelUrl(siteConfig.contact.repairPhone, whatsappMessages.bookRepair(service?.name))}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-surface-300 bg-white px-5 py-3.5 text-sm font-semibold text-ink-900"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call the repair desk
          </a>
        </div>
      </m.div>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
      className="rounded-3xl border border-surface-200 bg-white p-6 shadow-card sm:p-8"
    >
      <h3 className="text-title-lg font-extrabold tracking-tight text-ink-900">
        Book a repair
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        {service
          ? `Tell us about your device and we will confirm the exact quote for ${service.name.toLowerCase()}.`
          : 'Not sure what is wrong? Book a general diagnostics appointment instead.'}
      </p>
      <div className="mt-7 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name" htmlFor="name" error={errors.name} required>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Full name"
              autoComplete="name"
              error={errors.name}
            />
          </Field>
          <Field
            label="Mobile number"
            htmlFor="phone"
            error={errors.phone}
            required
            hint="We will call to confirm"
          >
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="98765 43210"
              autoComplete="tel"
              error={errors.phone}
            />
          </Field>
        </div>
        <Field label="Email (optional)" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Device brand" htmlFor="brand" error={errors.brand} required>
            <Select
              id="brand"
              value={form.brand}
              onChange={(e) => {
                const brand = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  brand,
                  model: repairBrandModels[brand]?.[0] ?? '',
                }));
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.brand;
                  delete next.model;
                  return next;
                });
              }}
              error={errors.brand}
            >
              {repairBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Device model" htmlFor="model" error={errors.model} required>
            <Select
              id="model"
              value={form.model}
              onChange={(e) => set('model', e.target.value)}
              error={errors.model}
            >
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label="What is the problem?"
          htmlFor="problem"
          error={errors.problem}
          required
          hint="Describe the symptoms, and when they started"
        >
          <Textarea
            id="problem"
            rows={4}
            value={form.problem}
            onChange={(e) => set('problem', e.target.value)}
            placeholder="e.g. The screen cracked after a drop. Touch works in the top half but the bottom third is unresponsive."
            error={errors.problem}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Preferred date"
            htmlFor="preferredDate"
            error={errors.preferredDate}
            required
          >
            <Input
              id="preferredDate"
              type="date"
              min={todayISO()}
              value={form.preferredDate}
              onChange={(e) => set('preferredDate', e.target.value)}
              error={errors.preferredDate}
            />
          </Field>
          <Field
            label="Preferred time"
            htmlFor="preferredTime"
            error={errors.preferredTime}
            required
          >
            <Select
              id="preferredTime"
              value={form.preferredTime}
              onChange={(e) => set('preferredTime', e.target.value)}
              error={errors.preferredTime}
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2.5 text-[13px] font-semibold text-ink-800">
            How will you hand it over?
          </legend>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {[
              {
                value: 'walk-in',
                label: 'Walk in',
                hint: 'Bring it to the store at your chosen time',
              },
              {
                value: 'pickup',
                label: 'Free pickup',
                hint: 'We collect from your address, ₹99 deducted from the bill',
              },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => set('dropoff', option.value)}
                aria-pressed={form.dropoff === option.value}
                className={cn(
                  'rounded-2xl border-2 px-4 py-3.5 text-left transition-all duration-250',
                  form.dropoff === option.value
                    ? 'border-brand-500 bg-brand-500/6'
                    : 'border-surface-200 hover:border-brand-300 hover:bg-brand-500/4',
                )}
              >
                <span className="block text-sm font-bold text-ink-900">{option.label}</span>
                <span className="mt-0.5 block text-xs text-ink-500">{option.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <Field label="Anything else? (optional)" htmlFor="notes">
          <Textarea
            id="notes"
            rows={2}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Password details, passcode, or anything else we should know…"
          />
        </Field>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" loading={submitting} loadingText="Booking…" className="flex-1">
          Book this repair slot
        </Button>
        <a
          href={buildWhatsAppUrl(siteConfig.contact.whatsapp, whatsappMessages.bookRepair(service?.name, `${form.brand} ${form.model}`))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 px-5 text-sm font-semibold text-[#128C4B] transition-colors hover:bg-[#25D366]/20"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Book on WhatsApp
        </a>
      </div>
      {service && (
        <p className="mt-4 text-xs text-ink-500">
          Repairs for {service.name} start at {formatPrice(service.startingPrice)} ·
          turnaround {service.turnaround} · {service.warranty}.
        </p>
      )}
    </form>
  );
}
