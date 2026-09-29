'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

/**
 * Wishlist store — persisted, SSR-safe (renders nothing until hydrated so the
 * server and client markup always match).
 */

const STORAGE_KEY = 'mex.wishlist.v1';

interface WishlistContextValue {
  /** Product ids currently saved. */
  ids: string[];
  count: number;
  isHydrated: boolean;
  has: (productId: string) => boolean;
  toggle: (productId: string) => boolean;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setIds(parsed.filter((v) => typeof v === 'string'));
      }
    } catch {
      /* ignore malformed storage */
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [ids, isHydrated]);

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  const add = useCallback((productId: string) => {
    setIds((prev) => (prev.includes(productId) ? prev : [productId, ...prev]));
  }, []);

  const remove = useCallback((productId: string) => {
    setIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  /** Returns the new saved state so callers can show the right toast. */
  const toggle = useCallback((productId: string) => {
    let next = false;
    setIds((prev) => {
      if (prev.includes(productId)) {
        next = false;
        return prev.filter((id) => id !== productId);
      }
      next = true;
      return [productId, ...prev];
    });
    return next;
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({ ids, count: ids.length, isHydrated, has, toggle, add, remove, clear: () => setIds([]) }),
    [ids, isHydrated, has, toggle, add, remove],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>.');
  return ctx;
}
