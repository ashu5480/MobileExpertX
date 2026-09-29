'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Form field primitives.
 *
 * Every control shares the same label / error / focus treatment, and errors
 * animate in rather than snapping, which makes validation feel considered
 * instead of punitive. Error text is wired via `aria-describedby` and
 * `aria-invalid` so screen readers announce it.
 */

const fieldBase =
  'w-full rounded-xl border bg-white px-4 text-[15px] text-ink-900 placeholder:text-ink-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-ink-400';

const stateClasses = (error?: string, dark = false) =>
  cn(
    error
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/25'
      : dark
        ? 'border-white/15 bg-white/5 text-white focus:border-brand-400 focus:ring-brand-500/30'
        : 'border-surface-300 focus:border-brand-500 focus:ring-brand-500/20',
  );

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: string; dark?: boolean }
>(function Input({ error, dark, className, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={error ? true : undefined}
      className={cn(fieldBase, 'h-12', stateClasses(error, dark), error && 'pr-10', className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string; dark?: boolean }
>(function Textarea({ error, dark, className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={error ? true : undefined}
      className={cn(
        fieldBase,
        'min-h-[110px] resize-y py-3 leading-relaxed',
        stateClasses(error, dark),
        className,
      )}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string; dark?: boolean }
>(function Select({ error, dark, className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(fieldBase, 'h-12 appearance-none pr-11', stateClasses(error, dark), className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
        aria-hidden="true"
      />
    </div>
  );
});

/** Label + control + animated error, the base unit of every form. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  dark,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  dark?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const errId = useId();

  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className={cn(
          'flex items-center gap-1 text-[13px] font-semibold',
          dark ? 'text-white/80' : 'text-ink-800',
        )}
      >
        {label}
        {required && (
          <span className={dark ? 'text-cyan-400' : 'text-brand-500'} aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {children}
        <AnimatePresence>
          {error && (
            <motion.p
              id={errId}
              role="alert"
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-1.5 overflow-hidden text-[13px] font-medium text-rose-600"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {!error && hint && (
        <p className={cn('text-xs', dark ? 'text-white/50' : 'text-ink-500')}>{hint}</p>
      )}
    </div>
  );
}

/** Selectable pill used for colours, storage, RAM, and wizard options. */
export function OptionPill({
  selected,
  onClick,
  children,
  disabled,
  className,
  title,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      title={title}
      className={cn(
        'relative rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all duration-250 ease-premium',
        'disabled:cursor-not-allowed disabled:opacity-40',
        selected
          ? 'border-brand-500 bg-brand-500/8 text-brand-600 shadow-[0_0_0_3px_rgba(37,99,255,0.12)]'
          : 'border-surface-300 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-500/5 hover:text-brand-600',
        className,
      )}
    >
      {children}
    </button>
  );
}
