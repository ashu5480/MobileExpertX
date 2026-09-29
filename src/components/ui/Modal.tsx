'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  Modal
 * ────────────────────────────────────────────────────────────────────────────
 *  One component for every overlay: a centred dialog on desktop and a bottom
 *  sheet on mobile, which is the interaction phone users already expect from
 *  thumb reach.
 *
 *  Accessibility: focus is trapped while open and restored on close, Escape
 *  dismisses, background scroll is locked, and the dialog is labelled.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const nodes = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((el) => el.offsetParent !== null);
    if (!nodes.length) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else trapFocus(e);
    };
    document.addEventListener('keydown', onKey);

    // Move focus into the dialog once it has mounted.
    const t = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? panelRef.current)?.focus();
    }, 60);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose, trapFocus]);

  const widths = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    full: 'sm:max-w-[480px]',
  } as const;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default bg-ink-900/55 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift outline-none sm:rounded-3xl',
              widths[size],
              className,
            )}
          >
            {/* Drag affordance on mobile bottom sheets */}
            <div className="flex justify-center pt-3 sm:hidden" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-surface-300" />
            </div>

            <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-4 sm:px-6 sm:pt-6">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="text-lg font-bold tracking-tight text-ink-900 sm:text-xl"
                >
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1 text-sm text-ink-500">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1.5 -mt-1 shrink-0 rounded-xl p-2 text-ink-500 transition-colors hover:bg-surface-100 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
              {children}
            </div>

            {footer && (
              <footer className="border-t border-surface-200 bg-surface-50 px-5 py-4 pb-safe sm:px-6">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
