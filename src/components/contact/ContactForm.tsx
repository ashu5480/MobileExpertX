'use client';

import { m } from 'framer-motion';
import { CheckCircle2, MessageCircle, Phone, Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { contactApi, ApiError } from '@/services/api';
import { contactSchema } from '@/lib/validation';
import { useToast } from '@/store/toastStore';
import {
  buildTelUrl,
  buildWhatsAppUrl,
  siteConfig,
  whatsappMessages,
} from '@/lib/config';
/**
 * Contact form. Client-side Zod gives instant feedback; the identical schema
 * runs again inside `POST /api/contact` and the server sanitises every field.
 */
export function ContactForm() {
  const { celebrate, error: errorToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };
  const submit = async () => {
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      window.requestAnimationFrame(() => {
        document.getElementById(Object.keys(next)[0])?.focus();
      });
      return;
    }
    setSubmitting(true);
    try {
      const { message } = await contactApi.submit(parsed.data);
      setSent(message);
      celebrate('Message sent', 'We will reply within one working day.');
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        setErrors(err.fieldErrors);
      } else {
        errorToast(
          'Could not send your message',
          err instanceof Error ? err.message : 'Please try again, or WhatsApp us.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };
  if (sent) {
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-emerald-500/25 bg-white p-8 text-center shadow-card"
      >
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lift">
          <CheckCircle2 className="h-8 w-8 text-white" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-xl font-bold tracking-tight text-ink-900">
          Message received
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{sent}</p>
        <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
          <a
            href={buildWhatsAppUrl(siteConfig.contact.whatsapp, whatsappMessages.needHelp())}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Chat on WhatsApp
          </a>
          <a
            href={buildTelUrl(siteConfig.contact.phone, whatsappMessages.general())}
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
      className="rounded-3xl border border-surface-200 bg-white p-6 shadow-card sm:p-8"
    >
      <h2 className="text-title-lg font-extrabold tracking-tight text-ink-900">
        Send us a message
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        For anything urgent, WhatsApp is faster — we usually reply within minutes
        during business hours.
      </p>
      <div className="mt-7 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name" htmlFor="c-name" error={errors.name} required>
            <Input
              id="c-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              autoComplete="name"
              placeholder="Full name"
              error={errors.name}
            />
          </Field>
          <Field
            label="Phone number"
            htmlFor="c-phone"
            error={errors.phone}
            required
            hint="So we can call you back"
          >
            <Input
              id="c-phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              autoComplete="tel"
              placeholder="98765 43210"
              error={errors.phone}
            />
          </Field>
        </div>
        <Field label="Email" htmlFor="c-email" error={errors.email} required>
          <Input
            id="c-email"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email}
          />
        </Field>
        <Field label="Subject" htmlFor="c-subject" error={errors.subject} required>
          <Input
            id="c-subject"
            value={form.subject}
            onChange={(e) => set('subject', e.target.value)}
            placeholder="e.g. Which phone is best under ₹30,000?"
            error={errors.subject}
          />
        </Field>
        <Field
          label="Message"
          htmlFor="c-message"
          error={errors.message}
          required
          hint="The more detail you give, the better we can help"
        >
          <Textarea
            id="c-message"
            rows={5}
            value={form.message}
            onChange={(e) => set('message', e.target.value)}
            placeholder="Tell us what you need…"
            error={errors.message}
          />
        </Field>
      </div>
      <Button
        type="submit"
        size="lg"
        className="mt-7"
        loading={submitting}
        loadingText="Sending…"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        Send message
      </Button>
    </form>
  );
}
