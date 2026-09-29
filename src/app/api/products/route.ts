import { NextResponse } from 'next/server';
import { listProducts } from '@/services/catalogService';
import type { ProductCategory, ProductCondition, ProductSort } from '@/types';

export const runtime = 'nodejs';

const PAGE_SIZE = 12;

/**
 * GET /api/products
 * Read-only listing endpoint used by the shop page's "Load more" button so it
 * can append results without a full navigation.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const list = (key: string) =>
    (searchParams.get(key) ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

  const priceParam = searchParams.get('price');
  const priceIndex = priceParam !== null ? Number(priceParam) : null;
  const range = Number.isInteger(priceIndex) ? RANGES[priceIndex!] : undefined;

  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const result = await listProducts({
    query: searchParams.get('q') ?? undefined,
    categories: list('category') as ProductCategory[],
    brands: list('brand'),
    conditions: list('condition') as ProductCondition[],
    rams: list('ram'),
    storages: list('storage'),
    minPricePaise: range?.min,
    maxPricePaise: range?.max,
    inStockOnly: searchParams.get('stock') === '1',
    sort: (searchParams.get('sort') as ProductSort) ?? 'featured',
    page,
    pageSize: PAGE_SIZE,
  });

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}

/** Mirrors `priceRanges` in `@/data/catalog` (kept local to avoid a client import). */
const RANGES = [
  { min: 0, max: 1500000 },
  { min: 1500000, max: 3000000 },
  { min: 3000000, max: 6000000 },
  { min: 6000000, max: 10000000 },
  { min: 10000000, max: 30000000 },
];
