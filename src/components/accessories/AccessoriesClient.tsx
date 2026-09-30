'use client';

import { m, AnimatePresence } from 'framer-motion';
import { PackageSearch, Plus, Search, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AccessoryVisual } from '@/components/product/ProductVisual';
import { Rating } from '@/components/ui/Rating';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useCart } from '@/store/cartStore';
import { useToast } from '@/store/toastStore';
import { formatPrice, discountPercent, cn } from '@/lib/utils';
import { accessories } from '@/data/accessories';
import { accessoryCategories } from '@/data/catalog';
import type { AccessoryCategory, AccessoryProduct } from '@/types';
const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
  { id: 'newest', label: 'Newest' },
] as const;
type SortId = (typeof SORTS)[number]['id'];
/** Accessories grid with category chips, live search and sorting. */
export function AccessoriesClient() {
  const params = useSearchParams();
  const [category, setCategory] = useState<AccessoryCategory | null>(
    params.get('category') as AccessoryCategory | null,
  );
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [sort, setSort] = useState<SortId>('featured');

  // Loaded over HTTP so the grid reflects what the admin has published.
  // The bundled seed is the fallback for a failed fetch, so the page still
  // renders something useful.
  const [items, setItems] = useState<AccessoryProduct[]>(accessories);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/catalogue?public=1')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('catalogue'))))
      .then((data) => {
        if (cancelled || !Array.isArray(data?.items) || !data.items.length) return;
        setItems(data.items);
      })
      .catch(() => {
        /* keep the bundled catalogue */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    let out = items;
    if (category) out = out.filter((a) => a.category === category);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.compatibility.join(' ').toLowerCase().includes(q),
      );
    }
    const sorted = [...out];
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      default:
        sorted.sort((a, b) => b.reviewCount - a.reviewCount);
    }
    return sorted;
  }, [category, query, sort]);
  return (
    <div className="container">
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
            placeholder="Search chargers, cables, cases…"
            aria-label="Search accessories"
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
        <label className="relative sm:w-52">
          <span className="sr-only">Sort accessories</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            className="h-11 w-full appearance-none rounded-xl border border-surface-300 bg-white px-4 text-sm font-medium text-ink-800 transition-colors hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="scroll-rail mask-fade-r flex gap-2 py-5">
        <CategoryChip active={category === null} onClick={() => setCategory(null)}>
          All
        </CategoryChip>
        {accessoryCategories.map((c) => (
          <CategoryChip
            key={c.id}
            active={category === c.id}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </CategoryChip>
        ))}
      </div>
      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-surface-300 bg-surface-50 px-6 py-20 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-3xl bg-white shadow-soft">
            <PackageSearch className="h-9 w-9 text-ink-400" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-lg font-bold text-ink-900">No accessories match</h2>
          <p className="mt-2 max-w-sm text-sm text-ink-500">
            Try a different category, or ask us for something specific.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => {
                setCategory(null);
                setQuery('');
              }}
            >
              Show all accessories
            </Button>
            <ButtonLink href="/contact" variant="outline">
              Ask us
            </ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 pb-16 sm:gap-5 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {results.map((item) => (
              <AccessoryCard key={item.id} item={item} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-250',
        active
          ? 'border-brand-500 bg-brand-500 text-white shadow-soft'
          : 'border-surface-300 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-600',
      )}
    >
      {children}
    </button>
  );
}
function AccessoryCard({ item }: { item: AccessoryProduct }) {
  const { addAccessory } = useCart();
  const { success } = useToast();
  const off = discountPercent(item.price, item.mrp);
  return (
    <m.li
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <a
        href={`/accessories/${item.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-soft transition-all duration-400 ease-premium hover:-translate-y-1.5 hover:shadow-lift"
      >
        <div className="relative aspect-square overflow-hidden">
          <AccessoryVisual accent={item.accent} name={item.name} />
          {off > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white">
              {off}% OFF
            </span>
          )}
          {item.stock <= 20 && (
            <span className="absolute right-3 top-3 rounded-full bg-ink-900/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
              Only {item.stock} left
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            {item.brand}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink-900 transition-colors group-hover:text-brand-600">
            {item.name}
          </h3>
          <Rating value={item.rating} size={11} count={item.reviewCount} className="mt-1.5" />
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-ink-900">
                {formatPrice(item.price)}
              </span>
              {off > 0 && (
                <span className="text-xs text-ink-400 line-through">
                  {formatPrice(item.mrp)}
                </span>
              )}
            </div>
            {/* The card link wraps the image + text; this sits above it so the
                tap target is a real button rather than a nested anchor. */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addAccessory(item);
                success('Added to cart', `${item.name} · ${formatPrice(item.price)}`);
              }}
              aria-label={`Add ${item.name} to cart`}
              className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-lift transition-all duration-300 hover:shadow-glow active:scale-95"
            >
              <Plus className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </a>
    </m.li>
  );
}
