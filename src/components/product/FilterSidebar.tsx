'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { OptionPill } from '@/components/ui/Field';
import { conditionLabels, priceRanges, ramOptions, storageOptions } from '@/data/catalog';
import { cn } from '@/lib/utils';
import type { ProductCategory, ProductCondition } from '@/types';

export interface ShopFilterState {
  categories: ProductCategory[];
  brands: string[];
  conditions: ProductCondition[];
  rams: string[];
  storages: string[];
  priceRange: number | null;
  inStockOnly: boolean;
}

export const emptyFilters: ShopFilterState = {
  categories: [],
  brands: [],
  conditions: [],
  rams: [],
  storages: [],
  priceRange: null,
  inStockOnly: false,
};

export const countActiveFilters = (f: ShopFilterState) =>
  f.categories.length +
  f.brands.length +
  f.conditions.length +
  f.rams.length +
  f.storages.length +
  (f.priceRange !== null ? 1 : 0) +
  (f.inStockOnly ? 1 : 0);

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  flagship: 'Flagship',
  'mid-range': 'Mid-range',
  budget: 'Budget',
  foldable: 'Foldables',
  refurbished: 'Refurbished',
  accessory: 'Accessories',
};

/**
 * Shop filter panel.
 *
 * One component serves both presentations: a sticky sidebar from `lg` up, and
 * a full-height bottom sheet below it, because a bottom sheet is the only
 * filter pattern that works reliably one-handed on a phone.
 */
export function FilterSidebar({
  state,
  onChange,
  brands,
  open,
  onClose,
  resultCount,
}: {
  state: ShopFilterState;
  onChange: (next: ShopFilterState) => void;
  brands: string[];
  open: boolean;
  onClose: () => void;
  resultCount: number;
}) {
  const active = countActiveFilters(state);

  const toggle = (key: 'categories' | 'brands' | 'conditions' | 'rams' | 'storages', value: string) => {
    const list = state[key] as string[];
    onChange({
      ...state,
      [key]: (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]) as never,
    } as ShopFilterState);
  };

  const body = (
    <div className="space-y-7">
      <Group title="Category">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((c) => (
            <OptionPill
              key={c}
              selected={state.categories.includes(c)}
              onClick={() => toggle('categories', c)}
            >
              {CATEGORY_LABELS[c]}
            </OptionPill>
          ))}
        </div>
      </Group>

      <Group title="Condition">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(conditionLabels) as ProductCondition[]).map((c) => (
            <OptionPill
              key={c}
              selected={state.conditions.includes(c)}
              onClick={() => toggle('conditions', c)}
            >
              {conditionLabels[c]}
            </OptionPill>
          ))}
        </div>
      </Group>

      <Group title="Price">
        <div className="space-y-1.5">
          {priceRanges.map((range, i) => (
            <button
              key={range.label}
              type="button"
              onClick={() =>
                onChange({ ...state, priceRange: state.priceRange === i ? null : i })
              }
              aria-pressed={state.priceRange === i}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors',
                state.priceRange === i
                  ? 'bg-brand-500/10 font-semibold text-brand-600'
                  : 'text-ink-700 hover:bg-surface-100',
              )}
            >
              {range.label}
              {state.priceRange === i && <Check className="h-4 w-4" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Brand">
        <div className="flex flex-wrap gap-2">
          {brands.map((b) => (
            <OptionPill key={b} selected={state.brands.includes(b)} onClick={() => toggle('brands', b)}>
              {b}
            </OptionPill>
          ))}
        </div>
      </Group>

      <Group title="RAM">
        <div className="flex flex-wrap gap-2">
          {ramOptions.map((r) => (
            <OptionPill key={r} selected={state.rams.includes(r)} onClick={() => toggle('rams', r)}>
              {r}
            </OptionPill>
          ))}
        </div>
      </Group>

      <Group title="Storage">
        <div className="flex flex-wrap gap-2">
          {storageOptions.map((s) => (
            <OptionPill
              key={s}
              selected={state.storages.includes(s)}
              onClick={() => toggle('storages', s)}
            >
              {s}
            </OptionPill>
          ))}
        </div>
      </Group>

      <Group title="Availability">
        <button
          type="button"
          onClick={() => onChange({ ...state, inStockOnly: !state.inStockOnly })}
          aria-pressed={state.inStockOnly}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border px-3.5 py-3 text-sm transition-colors',
            state.inStockOnly
              ? 'border-brand-500 bg-brand-500/8 font-semibold text-brand-600'
              : 'border-surface-300 text-ink-700 hover:border-brand-300',
          )}
        >
          In stock only
          <span
            className={cn(
              'relative h-5 w-9 rounded-full transition-colors',
              state.inStockOnly ? 'bg-brand-500' : 'bg-surface-300',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                state.inStockOnly ? 'translate-x-[1.15rem]' : 'translate-x-0.5',
              )}
            />
          </span>
        </button>
      </Group>
    </div>
  );

  return (
    <>
      {/* Desktop — sticky sidebar */}
      <aside className="hidden w-[270px] shrink-0 lg:block" aria-label="Product filters">
        <div className="sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto rounded-3xl border border-surface-200 bg-white p-5 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters
            </h2>
            {active > 0 && (
              <button
                type="button"
                onClick={() => onChange(emptyFilters)}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          {body}
        </div>
      </aside>

      {/* Mobile / tablet — bottom sheet */}
      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-[105] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            <motion.button
              type="button"
              aria-label="Close filters"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 h-full w-full cursor-default bg-ink-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-3xl bg-white"
            >
              <div className="flex justify-center pt-3" aria-hidden="true">
                <span className="h-1 w-10 rounded-full bg-surface-300" />
              </div>
              <header className="flex items-center justify-between border-b border-surface-200 px-5 py-3.5">
                <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Filters
                  {active > 0 && (
                    <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">
                      {active}
                    </span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close filters"
                  className="rounded-lg p-2 text-ink-500 hover:bg-surface-100"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{body}</div>

              <footer className="flex gap-3 border-t border-surface-200 p-4 pb-safe">
                <Button
                  variant="outline"
                  onClick={() => onChange(emptyFilters)}
                  disabled={active === 0}
                  fullWidth
                >
                  Clear all
                </Button>
                <Button onClick={onClose} fullWidth>
                  Show {resultCount} {resultCount === 1 ? 'result' : 'results'}
                </Button>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-[13px] font-bold text-ink-900">{title}</legend>
      {children}
    </fieldset>
  );
}
