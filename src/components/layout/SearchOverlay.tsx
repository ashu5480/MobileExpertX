'use client';

import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownLeft, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useUI } from '@/store/cartStore';
import { products } from '@/data/products';
import { ProductVisual } from '@/components/product/ProductVisual';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

/**
 * Command-palette style search.
 *
 * Opens with the `/` key (a familiar shortcut) or the navbar button. Matching
 * is done in-memory against the bundled catalogue, so results appear on the
 * first keystroke with no network round trip. Full keyboard support: arrows to
 * move, Enter to open, Escape to close.
 */

const MAX_RESULTS = 6;

export function SearchOverlay() {
  const router = useRouter();
  const { isSearchOpen, setSearchOpen } = useUI();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset whenever the overlay opens.
  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      setActiveIndex(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [isSearchOpen]);

  // `/` opens search, but never while the visitor is typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if (e.key === '/' && !typing && !isSearchOpen) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) setSearchOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isSearchOpen, setSearchOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return products.filter((p) => p.tags.includes('best-seller')).slice(0, MAX_RESULTS);
    }
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.highlights.some((h) => h.toLowerCase().includes(q)),
      )
      .slice(0, MAX_RESULTS);
  }, [query]);

  const go = (href: string) => {
    setSearchOpen(false);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[activeIndex]) go(`/shop/${results[activeIndex].slug}`);
      else if (query.trim()) go(`/shop?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <div className="fixed inset-0 z-[112] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]">
          <motion.button
            type="button"
            aria-label="Close search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setSearchOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-ink-900/55 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-lift"
          >
            <div className="flex items-center gap-3 border-b border-surface-200 px-4">
              <Search className="h-5 w-5 shrink-0 text-ink-400" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search phones, brands, features…"
                aria-label="Search products"
                autoComplete="off"
                className="h-14 flex-1 bg-transparent text-[15px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-surface-100 hover:text-ink-900"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-ink-900">No matches for “{query}”</p>
                  <p className="mt-1 text-sm text-ink-500">
                    Try a different brand, model or feature.
                  </p>
                  <button
                    type="button"
                    onClick={() => go(`/shop?q=${encodeURIComponent(query.trim())}`)}
                    className="mt-4 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                  >
                    Search the full catalogue
                  </button>
                </div>
              ) : (
                <>
                  <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                    {query
                      ? `${results.length} result${results.length === 1 ? '' : 's'}`
                      : 'Popular right now'}
                  </p>
                  <ul role="listbox" aria-label="Search results">
                    {results.map((product, i) => (
                      <li key={product.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={i === activeIndex}
                          onClick={() => go(`/shop/${product.slug}`)}
                          onMouseEnter={() => setActiveIndex(i)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                            i === activeIndex ? 'bg-brand-500/8' : 'hover:bg-surface-50',
                          )}
                        >
                          <span className="h-12 w-10 shrink-0 overflow-hidden rounded-lg">
                            <ProductVisual
                              image={product.images[0]}
                              alt={product.name}
                              accent={product.accent}
                              colors={product.colors}
                              name={product.name}
                              rounded="rounded-lg"
                              className="h-full w-full"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-ink-900">
                              {product.name}
                            </span>
                            <span className="block truncate text-xs text-ink-500">
                              {product.brand} · {product.storages[0]} ·{' '}
                              {product.condition === 'refurbished' ? 'Refurbished' : 'Brand new'}
                            </span>
                          </span>
                          <span className="shrink-0 text-sm font-bold tabular-nums text-ink-900">
                            {formatPrice(product.price)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>

                  {query && (
                    <button
                      type="button"
                      onClick={() => go(`/shop?q=${encodeURIComponent(query.trim())}`)}
                      className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border-t border-surface-200 px-3 py-3 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-500/5"
                    >
                      See all results for “{query}”
                      <CornerDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
