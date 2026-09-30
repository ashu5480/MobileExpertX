'use client';

import { m } from 'framer-motion';
import { ChevronDown, LayoutGrid, PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { ProductCard } from '@/components/product/ProductCard';
import { QuickViewModal } from '@/components/product/QuickViewModal';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { Button, ButtonLink } from '@/components/ui/Button';
import {
  FilterSidebar,
  countActiveFilters,
  emptyFilters,
  type ShopFilterState,
} from '@/components/product/FilterSidebar';
import { priceRanges } from '@/data/catalog';
import type { Product, ProductCategory, ProductCondition, ProductSort } from '@/types';
const SORTS: Array<{ id: ProductSort; label: string }> = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'newest', label: 'Newest arrivals' },
  { id: 'rating', label: 'Top rated' },
  { id: 'discount', label: 'Biggest discount' },
];
const PAGE_SIZE = 12;
export interface ShopProductsPayload {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}
/**
 * Shop listing client.
 *
 * The URL is the single source of truth for filter + sort state: every
 * interaction writes to the query string, so a filtered view is shareable,
 * bookmarkable and survives a refresh. The server page re-renders from it.
 */
export function ShopClient({
  initial,
  brands,
}: {
  initial: ShopProductsPayload;
  brands: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [localResults, setLocalResults] = useState<ShopProductsPayload | null>(null);
  const [extraItems, setExtraItems] = useState<Product[]>([]);
  // ── URL <-> state ────────────────────────────────────────────────────
  const readState = useCallback((): ShopFilterState => {
    const get = (key: string) => (params.get(key) ?? '').split(',').filter(Boolean);
    const priceParam = params.get('price');
    return {
      categories: get('category') as ProductCategory[],
      brands: get('brand'),
      conditions: get('condition') as ProductCondition[],
      rams: get('ram'),
      storages: get('storage'),
      priceRange: priceParam !== null ? Number(priceParam) : null,
      inStockOnly: params.get('stock') === '1',
    };
  }, [params]);
  const filters = readState();
  const sort = (params.get('sort') as ProductSort) ?? 'featured';
  const page = Number(params.get('page') ?? '1');
  const activeCount = countActiveFilters(filters);
  /** Serialises current state into a new query string. */
  const buildUrl = useCallback(
    (overrides: Partial<ShopFilterState> = {}, overridesPage = 1, overridesSort?: ProductSort) => {
      const next: ShopFilterState = { ...filters, ...overrides };
      const sp = new URLSearchParams();
      const q = params.get('q');
      if (q) sp.set('q', q);
      if (next.categories.length) sp.set('category', next.categories.join(','));
      if (next.brands.length) sp.set('brand', next.brands.join(','));
      if (next.conditions.length) sp.set('condition', next.conditions.join(','));
      if (next.rams.length) sp.set('ram', next.rams.join(','));
      if (next.storages.length) sp.set('storage', next.storages.join(','));
      if (next.priceRange !== null) sp.set('price', String(next.priceRange));
      if (next.inStockOnly) sp.set('stock', '1');
      sp.set('sort', overridesSort ?? sort);
      if (overridesPage > 1) sp.set('page', String(overridesPage));
      return `/shop?${sp.toString()}`;
    },
    [filters, params, sort],
  );
  const push = useCallback(
    (url: string) => {
      startTransition(() => {
        router.push(url, { scroll: false });
      });
    },
    [router],
  );
  // Reset any locally-appended "load more" results when the URL changes.
  useEffect(() => {
    setExtraItems([]);
    setLocalResults(null);
  }, [params]);
  // Debounced live search.
  useEffect(() => {
    const current = params.get('q') ?? '';
    if (query === current) return;
    const t = window.setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (query) sp.set('q', query);
      else sp.delete('q');
      sp.delete('page');
      push(`/shop?${sp.toString()}`);
    }, 380);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  // Derived: server page 1 unless we have appended "load more" items.
  const base = localResults ?? initial;
  const visible = useMemo(
    () => (extraItems.length ? [...initial.items, ...extraItems] : initial.items),
    [initial.items, extraItems],
  );
  const handleLoadMore = async () => {
    const nextPage = page + 1;
    try {
      const sp = new URLSearchParams(params.toString());
      sp.set('page', String(nextPage));
      const res = await fetch(`/api/products?${sp.toString()}`);
      if (!res.ok) throw new Error('request failed');
      const data = (await res.json()) as ShopProductsPayload;
      setExtraItems((prev) => [...prev, ...data.items]);
      setLocalResults({ ...base, page: nextPage, hasMore: data.hasMore });
    } catch {
      // Fall back to a full navigation, which always works.
      push(buildUrl({}, nextPage));
    }
  };
  const goToPage = (target: number) => {
    push(buildUrl({}, target));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <div className="container">
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-surface-200 pb-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this catalogue…"
            aria-label="Search products"
            className="h-11 w-full rounded-xl border border-surface-300 bg-white pl-10 pr-10 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-700"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden"
            aria-haspopup="dialog"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
            {activeCount > 0 && (
              <span className="ml-0.5 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </Button>
          <label className="relative flex-1 sm:flex-none">
            <span className="sr-only">Sort products</span>
            <select
              value={sort}
              onChange={(e) => push(buildUrl({}, 1, e.target.value as ProductSort))}
              className="h-11 w-full appearance-none rounded-xl border border-surface-300 bg-white pl-4 pr-9 text-sm font-medium text-ink-800 transition-colors hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:w-48"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
          </label>
        </div>
      </div>
      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 py-4">
          {filters.categories.map((c) => (
            <Chip
              key={c}
              label={c.replace('-', ' ')}
              onRemove={() =>
                push(buildUrl({ categories: filters.categories.filter((x) => x !== c) }))
              }
            />
          ))}
          {filters.brands.map((b) => (
            <Chip
              key={b}
              label={b}
              onRemove={() => push(buildUrl({ brands: filters.brands.filter((x) => x !== b) }))}
            />
          ))}
          {filters.conditions.map((c) => (
            <Chip
              key={c}
              label={c}
              onRemove={() =>
                push(buildUrl({ conditions: filters.conditions.filter((x) => x !== c) }))
              }
            />
          ))}
          {filters.storages.map((s) => (
            <Chip
              key={s}
              label={s}
              onRemove={() =>
                push(buildUrl({ storages: filters.storages.filter((x) => x !== s) }))
              }
            />
          ))}
          {filters.rams.map((r) => (
            <Chip
              key={r}
              label={r}
              onRemove={() => push(buildUrl({ rams: filters.rams.filter((x) => x !== r) }))}
            />
          ))}
          {filters.priceRange !== null && (
            <Chip
              label={priceRanges[filters.priceRange]?.label ?? 'Price'}
              onRemove={() => push(buildUrl({ priceRange: null }))}
            />
          )}
          {filters.inStockOnly && (
            <Chip label="In stock" onRemove={() => push(buildUrl({ inStockOnly: false }))} />
          )}
          <button
            type="button"
            onClick={() => push(buildUrl({ ...emptyFilters }))}
            className="text-xs font-semibold text-ink-500 underline-offset-4 hover:text-brand-600 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
      <div className="flex gap-8 py-6">
        <FilterSidebar
          state={filters}
          onChange={(next) => push(buildUrl(next))}
          brands={brands}
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          resultCount={base.total}
        />
        {/* ── Results ─────────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-ink-600" aria-live="polite">
              {isPending ? (
                <span className="inline-block h-4 w-32 animate-pulse rounded bg-surface-200" />
              ) : (
                <>
                  <span className="font-bold text-ink-900">{base.total}</span>{' '}
                  {base.total === 1 ? 'phone' : 'phones'}
                  {activeCount > 0 && ' match your filters'}
                </>
              )}
            </p>
            <span className="hidden items-center gap-1.5 text-xs text-ink-400 sm:flex">
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              Page {base.page} of {base.totalPages}
            </span>
          </div>
          {isPending ? (
            <ProductGridSkeleton count={8} />
          ) : visible.length === 0 ? (
            <EmptyResults onReset={() => push('/shop')} />
          ) : (
            <>
              <m.div
                layout
                className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4"
              >
                {visible.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={setQuickView}
                    priority={i < 4}
                  />
                ))}
              </m.div>
              <div className="mt-12 flex flex-col items-center gap-5">
                {base.hasMore || page < base.totalPages ? (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleLoadMore}
                      loading={isPending}
                    >
                      Load more phones
                    </Button>
                    {base.totalPages > 2 && (
                      <nav aria-label="Pagination" className="flex items-center gap-1.5">
                        {Array.from({ length: base.totalPages }).map((_, i) => {
                          const target = i + 1;
                          const current = (localResults ? base.page : page) === target;
                          return (
                            <button
                              key={target}
                              type="button"
                              onClick={() => goToPage(target)}
                              aria-current={current ? 'page' : undefined}
                              className={
                                current
                                  ? 'h-10 min-w-10 rounded-xl bg-brand-gradient px-3 text-sm font-bold text-white shadow-soft'
                                  : 'h-10 min-w-10 rounded-xl px-3 text-sm font-semibold text-ink-700 transition-colors hover:bg-surface-100'
                              }
                            >
                              {target}
                            </button>
                          );
                        })}
                      </nav>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-ink-400">
                    That&apos;s every phone matching your filters.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/8 py-1.5 pl-3 pr-1.5 text-xs font-semibold text-brand-700">
      <span className="capitalize">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="grid h-5 w-5 place-items-center rounded-full transition-colors hover:bg-brand-500/20"
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </span>
  );
}
function EmptyResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-surface-300 bg-surface-50 px-6 py-20 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-3xl bg-white shadow-soft">
        <PackageSearch className="h-9 w-9 text-ink-400" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-lg font-bold text-ink-900">No phones match those filters</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
        Try widening the price range, clearing a brand filter, or searching for a
        different model.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={onReset}>Clear all filters</Button>
        <ButtonLink href="/contact" variant="outline">
          Ask us to find it
        </ButtonLink>
      </div>
    </div>
  );
}
