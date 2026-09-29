'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn, generateReference } from '@/lib/utils';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  Toast + success-animation store
 * ────────────────────────────────────────────────────────────────────────────
 *  One imperative `toast()` API used by every mutation in the app, plus a
 *  `celebrate()` helper that shows the premium success animation used for
 *  repair bookings, sell-phone submissions and completed orders.
 */

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  /** Optional action, e.g. "View cart". */
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  celebrate: (title: string, description?: string, reference?: string) => void;
  celebration: { title: string; description?: string; reference?: string } | null;
  dismissCelebration: () => void;
  toasts: ToastItem[];
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<
  ToastTone,
  { icon: typeof Info; ring: string; iconColor: string }
> = {
  success: { icon: CheckCircle2, ring: 'ring-emerald-500/20', iconColor: 'text-emerald-500' },
  error: { icon: XCircle, ring: 'ring-rose-500/20', iconColor: 'text-rose-500' },
  info: { icon: Info, ring: 'ring-brand-500/20', iconColor: 'text-brand-500' },
};

const TOAST_MS = 4200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [celebration, setCelebration] = useState<ToastContextValue['celebration']>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const toast = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { ...item, id }]);
      timers.current[id] = setTimeout(() => dismiss(id), TOAST_MS);
      return id;
    },
    [dismiss],
  );

  const success = useCallback(
    (title: string, description?: string) => toast({ title, description, tone: 'success' }),
    [toast],
  );

  const error = useCallback(
    (title: string, description?: string) => toast({ title, description, tone: 'error' }),
    [toast],
  );

  const celebrate = useCallback(
    (title: string, description?: string, reference?: string) => {
      setCelebration({ title, description, reference: reference ?? generateReference('REF') });
    },
    [],
  );

  // Clear pending timers on unmount to avoid setState-after-unmount.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      Object.values(pending).forEach(clearTimeout);
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success,
      error,
      celebrate,
      celebration,
      dismissCelebration: () => setCelebration(null),
      toasts,
      dismiss,
    }),
    [toast, success, error, celebrate, celebration, toasts, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
      <SuccessOverlay celebration={celebration} onClose={() => setCelebration(null)} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>.');
  return ctx;
}

/* ── Viewport ───────────────────────────────────────────────────────────── */

function ToastViewport({
  toasts,
  dismiss,
}: {
  toasts: ToastItem[];
  dismiss: (id: string) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-6 sm:top-6 sm:bottom-auto sm:items-end"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const tone = TONE_STYLES[t.tone];
          const Icon = tone.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-surface-200 bg-white/95 p-4 shadow-card ring-1 backdrop-blur-xl',
                tone.ring,
              )}
              role="status"
              aria-live="polite"
            >
              <span className="mt-0.5 shrink-0">
                <Icon className={cn('h-5 w-5', tone.iconColor)} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-600">{t.description}</p>
                )}
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.onClick();
                      dismiss(t.id);
                    }}
                    className="mt-2 text-sm font-semibold text-brand-500 underline-offset-4 transition-colors hover:text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="-m-1 rounded-lg p-1 text-ink-400 transition-colors hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ── Premium success overlay ────────────────────────────────────────────── */

function SuccessOverlay({
  celebration,
  onClose,
}: {
  celebration: ToastContextValue['celebration'];
  onClose: () => void;
}) {
  useEffect(() => {
    if (!celebration) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [celebration, onClose]);

  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-ink-900/60 p-5 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={celebration.title}
          onClick={onClose}
        >
          {/* Expanding success rings */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute h-32 w-32 rounded-full border-2 border-emerald-400/40"
                initial={{ scale: 0.3, opacity: 0.7 }}
                animate={{ scale: 2.6 + i * 0.7, opacity: 0 }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  delay: i * 0.45,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.9, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-8 text-center shadow-lift"
          >
            <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-aurora opacity-70" />
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.08 }}
              className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lift"
            >
              <CheckCircle2 className="h-8 w-8 text-white" aria-hidden="true" />
            </motion.div>

            <h2 className="relative mt-5 text-xl font-bold tracking-tight text-ink-900">
              {celebration.title}
            </h2>
            {celebration.description && (
              <p className="relative mt-2 text-sm leading-relaxed text-ink-600">
                {celebration.description}
              </p>
            )}
            {celebration.reference && (
              <p className="relative mt-4 inline-flex rounded-full bg-surface-100 px-3.5 py-1.5 font-mono text-sm font-semibold tracking-wide text-ink-800">
                {celebration.reference}
              </p>
            )}

            <button
              type="button"
              onClick={onClose}
              autoFocus
              className="relative mt-6 w-full rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
