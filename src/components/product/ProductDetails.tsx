'use client';

import { m } from 'framer-motion';
import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
const GROUP_LABELS: Record<string, string> = {
  display: 'Display',
  performance: 'Performance',
  camera: 'Camera',
  battery: 'Battery & charging',
  network: 'Network & connectivity',
  body: 'Design & build',
  software: 'Software',
};
/** Collapsible spec table, grouped by category. The first group starts open. */
export function ProductSpecs({ product }: { product: Product }) {
  const groups = product.specs.reduce<Record<string, Product['specs']>>((acc, spec) => {
    (acc[spec.group] ??= []).push(spec);
    return acc;
  }, {});
  const visibleGroups = Object.keys(groups).filter((g) => groups[g]?.length);
  const [open, setOpen] = useState<string[]>(visibleGroups.slice(0, 1));
  const toggle = (key: string) =>
    setOpen((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  return (
    <div className="divide-y divide-surface-200 overflow-hidden rounded-3xl border border-surface-200 bg-white">
      {visibleGroups.map((group) => {
        const expanded = open.includes(group);
        return (
          <div key={group}>
            <h3>
              <button
                type="button"
                onClick={() => toggle(group)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-surface-50"
              >
                <span className="text-sm font-bold text-ink-900">
                  {GROUP_LABELS[group] ?? group}
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-ink-400 transition-transform duration-300',
                    expanded && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>
            </h3>
            {expanded && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <dl className="space-y-2.5 px-5 pb-5">
                  {groups[group]!.map((spec) => (
                    <div
                      key={spec.label}
                      className="flex flex-col gap-0.5 border-b border-dashed border-surface-200 pb-2.5 last:border-0 sm:flex-row sm:justify-between sm:gap-6"
                    >
                      <dt className="text-sm text-ink-500">{spec.label}</dt>
                      <dd className="text-sm font-semibold text-ink-900 sm:text-right">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </m.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
/** Highlight chips shown above the description. */
export function ProductHighlights({ product }: { product: Product }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {product.highlights.map((h) => (
        <li
          key={h}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/6 px-3 py-1.5 text-xs font-semibold text-brand-700"
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {h}
        </li>
      ))}
    </ul>
  );
}
