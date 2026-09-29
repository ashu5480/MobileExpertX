'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { products as seedProducts } from '@/data/products';
import { accessories as seedAccessories } from '@/data/accessories';
import {
  accessoryId,
  makeVariantKey,
  resolveCart,
  totalsFromCart,
  type CartEntry,
} from '@/lib/pricing';
import { getAllProducts } from '@/services/catalogService';
import type {
  AccessoryProduct,
  CartLine,
  DeliveryMethodId,
  OrderTotals,
  Product,
} from '@/types';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  Cart store
 * ────────────────────────────────────────────────────────────────────────────
 *  Persisted to localStorage so a refresh never loses the basket. The resolver
 *  always re-prices lines against the catalogue, so a stale or tampered
 *  localStorage entry can never set a price.
 * ──────────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'mex.cart.v1';
const COUPON_KEY = 'mex.coupon.v1';
const METHOD_KEY = 'mex.deliveryMethod.v1';

export const MAX_CART_QTY = 10;

type Action =
  | { type: 'hydrate'; lines: CartLine[] }
  | { type: 'add'; productId: string; variantKey: string; quantity: number }
  | { type: 'setQuantity'; productId: string; variantKey: string; quantity: number }
  | { type: 'remove'; productId: string; variantKey: string }
  | { type: 'clear' };

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case 'hydrate':
      return action.lines;

    case 'add': {
      const existing = state.find(
        (l) => l.productId === action.productId && l.variantKey === action.variantKey,
      );
      if (existing) {
        return state.map((l) =>
          l === existing
            ? { ...l, quantity: Math.min(MAX_CART_QTY, l.quantity + action.quantity) }
            : l,
        );
      }
      return [
        ...state,
        {
          productId: action.productId,
          variantKey: action.variantKey,
          quantity: Math.min(MAX_CART_QTY, Math.max(1, action.quantity)),
          addedAt: Date.now(),
        },
      ];
    }

    case 'setQuantity': {
      if (action.quantity < 1) {
        return state.filter(
          (l) => !(l.productId === action.productId && l.variantKey === action.variantKey),
        );
      }
      return state.map((l) =>
        l.productId === action.productId && l.variantKey === action.variantKey
          ? { ...l, quantity: Math.min(MAX_CART_QTY, action.quantity) }
          : l,
      );
    }

    case 'remove':
      return state.filter(
        (l) => !(l.productId === action.productId && l.variantKey === action.variantKey),
      );

    case 'clear':
      return [];

    default:
      return state;
  }
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export interface CartContextValue {
  lines: CartLine[];
  entries: CartEntry[];
  products: Product[];
  accessories: AccessoryProduct[];
  count: number;
  isHydrated: boolean;
  totals: OrderTotals;
  couponCode: string | null;
  deliveryMethod: DeliveryMethodId;
  addItem: (product: Product, variantKey?: string, quantity?: number) => void;
  addAccessory: (accessory: AccessoryProduct, quantity?: number) => void;
  setQuantity: (productId: string, variantKey: string, quantity: number) => void;
  removeItem: (productId: string, variantKey: string) => void;
  clearCart: () => void;
  setCouponCode: (code: string | null) => void;
  setDeliveryMethod: (method: DeliveryMethodId) => void;
  inCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, []);
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [isHydrated, setIsHydrated] = useState(false);
  const [couponCode, setCouponCodeState] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethodState] = useState<DeliveryMethodId>('standard');
  const hydrated = useRef(false);

  // Load the catalogue so variant prices are authoritative, then rehydrate.
  useEffect(() => {
    let cancelled = false;
    getAllProducts()
      .then((list) => {
        if (!cancelled && list.length) setProducts(list);
      })
      .catch(() => {
        /* keep the bundled seed catalogue */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    dispatch({ type: 'hydrate', lines: readStorage<CartLine[]>(STORAGE_KEY, []) });
    setCouponCodeState(readStorage<string | null>(COUPON_KEY, null));
    setDeliveryMethodState(readStorage<DeliveryMethodId>(METHOD_KEY, 'standard'));
    hydrated.current = true;
    setIsHydrated(true);
  }, []);

  // Persist only after hydration, so we never clobber storage with `[]`.
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* quota exceeded or private mode — the cart simply will not persist */
    }
  }, [lines]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      if (couponCode) window.localStorage.setItem(COUPON_KEY, JSON.stringify(couponCode));
      else window.localStorage.removeItem(COUPON_KEY);
    } catch {
      /* ignore */
    }
  }, [couponCode]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(METHOD_KEY, JSON.stringify(deliveryMethod));
    } catch {
      /* ignore */
    }
  }, [deliveryMethod]);

  const entries = useMemo(
    () => resolveCart(products, lines, seedAccessories),
    [products, lines],
  );
  const totals = useMemo(
    () => totalsFromCart(entries, { couponCode, deliveryMethod }),
    [entries, couponCode, deliveryMethod],
  );
  const count = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);

  const inCart = useCallback(
    (productId: string) => lines.some((l) => l.productId === productId),
    [lines],
  );

  const addItem = useCallback((product: Product, variantKey?: string, quantity = 1) => {
    dispatch({
      type: 'add',
      productId: product.id,
      variantKey: variantKey ?? makeVariantKey({}),
      quantity,
    });
  }, []);

  /** Accessory lines are namespaced so the resolver can tell them apart. */
  const addAccessory = useCallback((accessory: AccessoryProduct, quantity = 1) => {
    dispatch({
      type: 'add',
      productId: accessoryId(accessory.id),
      variantKey: makeVariantKey({}),
      quantity,
    });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      entries,
      products,
      accessories: seedAccessories,
      count,
      isHydrated,
      totals,
      couponCode,
      deliveryMethod,
      addItem,
      addAccessory,
      setQuantity: (productId, variantKey, quantity) =>
        dispatch({ type: 'setQuantity', productId, variantKey, quantity }),
      removeItem: (productId, variantKey) => dispatch({ type: 'remove', productId, variantKey }),
      clearCart: () => dispatch({ type: 'clear' }),
      setCouponCode: setCouponCodeState,
      setDeliveryMethod: setDeliveryMethodState,
      inCart,
    }),
    [
      lines, entries, products, count, isHydrated, totals,
      couponCode, deliveryMethod, addItem, addAccessory, inCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>.');
  return ctx;
}

/* ── Cart drawer / menu / search open state ─────────────────────────────── */

export interface FlySource {
  rect: DOMRect;
  accent: string;
  key: number;
}

interface UIContextValue {
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Element currently flying toward the cart icon (add-to-cart animation). */
  flySource: FlySource | null;
  registerFlySource: (el: HTMLElement | null, accent: string) => void;
  isMenuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  /** Cart icon anchor, so the fly animation knows where to land. */
  cartAnchor: HTMLElement | null;
  setCartAnchor: (el: HTMLElement | null) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setCartOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [flySource, setFlySource] = useState<FlySource | null>(null);
  const [cartAnchor, setCartAnchor] = useState<HTMLElement | null>(null);
  const flyKey = useRef(0);

  const registerFlySource = useCallback((el: HTMLElement | null, accent: string) => {
    if (!el) return;
    flyKey.current += 1;
    setFlySource({ rect: el.getBoundingClientRect(), accent, key: flyKey.current });
  }, []);

  // Close mobile-only overlays once the viewport reaches the desktop layout.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches) {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Lock body scroll whenever an overlay is open.
  const anyOverlay = isCartOpen || isMenuOpen || isSearchOpen;
  useEffect(() => {
    if (!anyOverlay) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [anyOverlay]);

  const value = useMemo<UIContextValue>(
    () => ({
      isCartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      flySource,
      registerFlySource,
      isMenuOpen,
      setMenuOpen,
      isSearchOpen,
      setSearchOpen,
      cartAnchor,
      setCartAnchor,
    }),
    [isCartOpen, isMenuOpen, isSearchOpen, flySource, registerFlySource, cartAnchor],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>.');
  return ctx;
}
