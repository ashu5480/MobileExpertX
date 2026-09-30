import { products as seedProducts } from '@/data/products';
import { accessories as seedAccessories } from '@/data/accessories';
import { repairServices as seedRepairs } from '@/data/repairs';
import { reviewsFor } from '@/data/reviews';
import { overlayAccessories, overlayProducts } from '@/lib/catalogue';
import { discountPercent } from '@/lib/utils';
import type {
  AccessoryCategory,
  AccessoryProduct,
  Paginated,
  Product,
  ProductFilters,
  ProductReview,
  ProductSort,
  RepairService,
} from '@/types';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  Data-access layer
 * ────────────────────────────────────────────────────────────────────────────
 *  Every component reads through these services instead of importing seed
 *  data directly, so the UI is never coupled to mock data.
 *
 *  The bundled catalogue is the baseline; admin edits from the admin panel are
 *  layered on top by `@/lib/catalogue`. If that layer cannot be read, we fall
 *  back to the bundled data, so the storefront never renders empty and a
 *  database problem cannot take the shop down.
 *
 *  Authoritative logic (pricing, payment verification, stock) is deliberately
 *  NOT reimplemented here — the server API recomputes it.
 */

/**
 * Runs an overlay read, falling back to the bundled list on any failure.
 *
 * Async because the overlay is a MongoDB read. Falling back is what keeps the
 * storefront alive when the database is unreachable or `MONGODB_URI` is
 * missing — a config mistake degrades to the bundled catalogue instead of
 * showing an error page to every visitor.
 */
async function safeOverlay<T>(read: () => Promise<T[]>, fallback: T[]): Promise<T[]> {
  try {
    const result = await read();
    return result.length ? result : fallback;
  } catch (error) {
    console.error('[catalog] overlay read failed, using bundled data:', error);
    return fallback;
  }
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  Data-access layer
 * ────────────────────────────────────────────────────────────────────────────
 *  Every component reads through these services instead of importing seed
 *  data directly, so the UI is never coupled to mock data.
 *
 *  To connect a real backend:
 *    1. Set `NEXT_PUBLIC_API_BASE_URL` to your server.
 *    2. Each function already has a live-fetch path; replace the mock branch
 *       with your endpoint, or swap the implementation entirely. The exported
 *       signatures and return types are the contract the UI depends on.
 *
 *  Authoritative logic (pricing, payment verification, stock) is deliberately
 *  NOT reimplemented here — the server API recomputes it.
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

async function tryFetch<T>(path: string): Promise<T | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300, tags: ['catalog'] },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Network or parse failure — fall back to the bundled catalogue so the
    // storefront never renders empty.
    return null;
  }
}

/* ── Products ───────────────────────────────────────────────────────────── */

const matches = (haystack: string, needle: string) =>
  haystack.toLowerCase().includes(needle.trim().toLowerCase());

function applyFilters(list: Product[], filters: ProductFilters): Product[] {
  let out = list;

  if (filters.query) {
    const q = filters.query;
    out = out.filter(
      (p) =>
        matches(p.name, q) ||
        matches(p.brand, q) ||
        matches(p.model, q) ||
        matches(p.highlights.join(' '), q) ||
        matches(p.specs.map((s) => `${s.label} ${s.value}`).join(' '), q),
    );
  }
  if (filters.categories?.length) out = out.filter((p) => filters.categories!.includes(p.category));
  if (filters.brands?.length) out = out.filter((p) => filters.brands!.includes(p.brand));
  if (filters.conditions?.length) out = out.filter((p) => filters.conditions!.includes(p.condition));
  if (filters.rams?.length) out = out.filter((p) => p.rams.some((r) => filters.rams!.includes(r)));
  if (filters.storages?.length)
    out = out.filter((p) => p.storages.some((s) => filters.storages!.includes(s)));
  if (typeof filters.minPricePaise === 'number')
    out = out.filter((p) => p.price >= filters.minPricePaise!);
  if (typeof filters.maxPricePaise === 'number')
    out = out.filter((p) => p.price <= filters.maxPricePaise!);
  if (filters.inStockOnly) out = out.filter((p) => p.stock > 0);

  return out;
}

const comparators: Record<ProductSort, (a: Product, b: Product) => number> = {
  featured: (a, b) =>
    Number(b.tags.includes('best-seller')) - Number(a.tags.includes('best-seller')) ||
    b.rating - a.rating,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  newest: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
  discount: (a, b) => discountPercent(b.price, b.mrp) - discountPercent(a.price, a.mrp),
};

export async function listProducts(filters: ProductFilters = {}): Promise<Paginated<Product>> {
  const sort = filters.sort ?? 'featured';
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;

  // Seed catalogue with any admin edits (price, stock, discount, photo) layered
  // on top. Falls back to the bundled data if the catalogue cannot be read.
  const source = await safeOverlay(overlayProducts, seedProducts);

  const filtered = applyFilters(source, filters);
  const sorted = [...filtered].sort(comparators[sort] ?? comparators.featured);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
    hasMore: start + pageSize < total,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const live = await tryFetch<Product | null>(`/products/${encodeURIComponent(slug)}`);
  if (live) return live;
  const all = await safeOverlay(overlayProducts, seedProducts);
  return all.find((p) => p.slug === slug) ?? null;
}

/**
 * Resolves a product by id for the cart and order engine.
 *
 * Async because the overlay is a MongoDB read. The promise is memoised per
 * process, so a multi-line order costs one query rather than one per line.
 */
let phoneCache: Promise<Product[]> | null = null;
export function getProductById(id: string): Promise<Product | null> {
  phoneCache ??= safeOverlay(overlayProducts, seedProducts);
  return phoneCache.then((all) => all.find((p) => p.id === id) ?? null);
}


/** Full catalogue — used by the cart resolver on the client. */
export async function getAllProducts(): Promise<Product[]> {
  const live = await tryFetch<Product[]>('/products?pageSize=200');
  return live?.length ? live : seedProducts;
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const sameCategory = seedProducts.filter(
    (p) => p.id !== product.id && p.category === product.category,
  );
  const sameBrand = seedProducts.filter(
    (p) => p.id !== product.id && p.brand === product.brand,
  );
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const p of [...sameCategory, ...sameBrand]) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
    if (out.length >= limit) break;
  }
  return out;
}

export async function getProductReviews(slug: string): Promise<ProductReview[]> {
  return reviewsFor(slug);
}

export const getAllBrands = (): string[] =>
  Array.from(new Set(seedProducts.map((p) => p.brand))).sort();

export const getAllRams = (): string[] =>
  Array.from(new Set(seedProducts.flatMap((p) => p.rams))).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10),
  );

export const getAllStorages = (): string[] =>
  Array.from(new Set(seedProducts.flatMap((p) => p.storages)));

/** Price envelope across the catalogue — drives the shop price filter. */
export function getPriceBounds(): { min: number; max: number } {
  const prices = seedProducts.map((p) => p.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/* ── Accessories ────────────────────────────────────────────────────────── */

export interface AccessoryFilters {
  categories?: AccessoryCategory[];
  brands?: string[];
  query?: string;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export async function listAccessories(
  filters: AccessoryFilters = {},
): Promise<Paginated<AccessoryProduct>> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;

  // Admin edits layered over the bundled accessories.
  let out = await safeOverlay(overlayAccessories, seedAccessories);
  if (filters.categories?.length)
    out = out.filter((a) => filters.categories!.includes(a.category));
  if (filters.brands?.length) out = out.filter((a) => filters.brands!.includes(a.brand));
  if (filters.query)
    out = out.filter(
      (a) => matches(a.name, filters.query!) || matches(a.description, filters.query!),
    );

  const sort = filters.sort ?? 'featured';
  const sorted = [...out].sort((a, b) => {
    switch (sort) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'newest':
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      case 'rating':
        return b.rating - a.rating;
      case 'discount':
        return discountPercent(b.price, b.mrp) - discountPercent(a.price, a.mrp);
      default:
        return b.reviewCount - a.reviewCount;
    }
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
    hasMore: start + pageSize < total,
  };
}

export const getAllAccessories = (): Promise<AccessoryProduct[]> =>
  safeOverlay(overlayAccessories, seedAccessories);

export const getAccessoryBySlug = (slug: string): Promise<AccessoryProduct | null> =>
  safeOverlay(overlayAccessories, seedAccessories).then(
    (all) => all.find((a) => a.slug === slug) ?? null,
  );

export const getAccessoryBrands = (): Promise<string[]> =>
  safeOverlay(overlayAccessories, seedAccessories).then((all) =>
    Array.from(new Set(all.map((a) => a.brand))),
  );

/**
 * Drops the memoised catalogue after an admin edit.
 *
 * Without this, a price or stock change would not appear until the process
 * restarted, because `getProductById` caches for the cart and order engine.
 */
export function invalidateCatalogueCache(): void {
  phoneCache = null;
}


/* ── Repairs ────────────────────────────────────────────────────────────── */

export async function listRepairServices(): Promise<RepairService[]> {
  const live = await tryFetch<RepairService[]>('/repair-services');
  return live?.length ? live : seedRepairs;
}

export const getRepairService = (slug: string): RepairService | null =>
  seedRepairs.find((s) => s.slug === slug) ?? null;
