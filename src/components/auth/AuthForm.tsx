'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';

/**
 * Combined sign-in / create-account form.
 *
 * The `next` parameter is validated before use -- an unchecked value would
 * let an attacker bounce a freshly signed-in user to another origin.
 */

type Mode = 'login' | 'register';

const COPY = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to track your orders, sell requests and repairs.',
    cta: 'Sign in',
    busy: 'Signing in…',
    switchTo: 'register' as Mode,
    switchLabel: 'Create an account',
  },
  register: {
    title: 'Create your account',
    subtitle: 'Track your orders, sell requests and repairs in one place.',
    cta: 'Create account',
    busy: 'Creating account…',
    switchTo: 'login' as Mode,
    switchLabel: 'I already have an account',
  },
};

const inputClass =
  'w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100';

export function AuthForm({ initialMode = 'login' }: { initialMode?: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const copy = COPY[mode];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        setErrors(data.fieldErrors ?? {});
        return;
      }

      // Only same-origin, absolute-path redirects are honoured.
      const raw = params.get('next');
      const next = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null;

      // An admin belongs in the admin panel. A customer goes back to where they
      // came from, or to the storefront — never into a seller/listing flow,
      // which this business no longer exposes to customers.
      const fallback = data.user?.role === 'admin' ? '/admin' : '/';
      router.replace(next ?? fallback);
      router.refresh();
    } catch {
      setError('Network problem. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-lift">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </span>

        <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-ink-900">
          {copy.title}
        </h1>
        <p className="mt-1.5 text-sm text-ink-600">{copy.subtitle}</p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {error}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          {mode === 'register' && (
            <>
              <Field label="Full name" htmlFor="name" required error={errors.name}>
                <input
                  id="name"
                  name="name"
                  className={inputClass}
                  placeholder="Ishak Khan"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>
              <Field label="Phone" htmlFor="phone" error={errors.phone}>
                <input
                  id="phone"
                  name="phone"
                  className={inputClass}
                  placeholder="98765 43210"
                  autoComplete="tel"
                />
              </Field>
            </>
          )}

          <Field label="Email" htmlFor="email" required error={errors.email}>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              className={inputClass}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
            />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            required
            error={errors.password}
            hint={mode === 'register' ? 'At least 8 characters.' : undefined}
          >
            <input
              id="password"
              name="password"
              type="password"
              className={inputClass}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              aria-invalid={Boolean(errors.password)}
            />
          </Field>

          <Button type="submit" variant="primary" size="lg" loading={busy} className="w-full">
            {busy ? copy.busy : copy.cta}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-600">
          {mode === 'login' ? "Don't have an account?" : 'Already registered?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(copy.switchTo);
              setError('');
              setErrors({});
            }}
            className="font-semibold text-brand-600 underline-offset-2 hover:underline"
          >
            {copy.switchLabel}
          </button>
        </p>
      </div>
    </div>
  );
}
