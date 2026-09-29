import { products as seedProducts } from '@/data/products';
import { accessories as seedAccessories } from '@/data/accessories';
import { repairServices as seedRepairs } from '@/data/repairs';
import { reviewsFor } from '@/data/reviews';
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
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null) continue;
    params.set(k, Array.isArray(v) ? v.join(',') : String(v));
  }
  const live = await tryFetch<Paginated<Product>>(`/products?${params.toString()}`);

  const sort = filters.sort ?? 'featured';
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;

  const source = live?.items?.length ? live.items : seedProducts;
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
  return live ?? seedProducts.find((p) => p.slug === slug) ?? null;
}

export const getProductById = (id: string): Product | null =>
  seedProducts.find((p) => p.id === id) ?? null;

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

  let out = seedAccessories;
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
  Promise.resolve(seedAccessories);

export const getAccessoryBySlug = (slug: string): AccessoryProduct | null =>
  seedAccessories.find((a) => a.slug === slug) ?? null;

export const getAccessoryBrands = (): string[] =>
  Array.from(new Set(seedAccessories.map((a) => a.brand)));

/* ── Repairs ────────────────────────────────────────────────────────────── */

export async function listRepairServices(): Promise<RepairService[]> {
  const live = await tryFetch<RepairService[]>('/repair-services');
  return live?.length ? live : seedRepairs;
}

export const getRepairService = (slug: string): RepairService | null =>
  seedRepairs.find((s) => s.slug === slug) ?? null;
