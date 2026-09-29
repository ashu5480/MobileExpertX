import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ShopClient } from '@/components/product/ShopClient';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { JsonLd } from '@/components/seo/JsonLd';
import { listProducts, getAllBrands } from '@/services/catalogService';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/config';
import type { ProductCategory, ProductCondition, ProductSort } from '@/types';

export const metadata: Metadata = buildMetadata({
  title: 'Shop Mobile Phones Online',
  description:
    'Browse verified new and Grade-A refurbished smartphones from Apple, Samsung, OnePlus, Google, Xiaomi and more. Filter by price, brand, condition, RAM and storage.',
  path: '/shop',
  keywords: ['buy mobile phone online', 'new smartphones India', 'refurbished phones'],
});

const PAGE_SIZE = 12;

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

const list = (v: string | string[] | undefined): string[] =>
  (first(v) ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const RANGES = [
  { min: 0, max: 1500000 },
  { min: 1500000, max: 3000000 },
  { min: 3000000, max: 6000000 },
  { min: 6000000, max: 10000000 },
  { min: 10000000, max: 30000000 },
];

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const priceIndex = first(searchParams.price);
  const range = priceIndex !== undefined ? RANGES[Number(priceIndex)] : undefined;
  const page = Math.max(1, Number(first(searchParams.page) ?? '1') || 1);

  const [initial, brands] = await Promise.all([
    listProducts({
      query: first(searchParams.q),
      categories: list(searchParams.category) as ProductCategory[],
      brands: list(searchParams.brand),
      conditions: list(searchParams.condition) as ProductCondition[],
      rams: list(searchParams.ram),
      storages: list(searchParams.storage),
      minPricePaise: range?.min,
      maxPricePaise: range?.max,
      inStockOnly: first(searchParams.stock) === '1',
      sort: (first(searchParams.sort) as ProductSort) ?? 'featured',
      page,
      pageSize: PAGE_SIZE,
    }),
    Promise.resolve(getAllBrands()),
  ]);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Shop', path: '/shop' },
        ])}
      />

      <div className="border-b border-surface-200 bg-surface-50">
        <div className="container py-8 sm:py-10">
          <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Shop' }]} />
          <h1 className="mt-4 text-display-sm font-extrabold tracking-tight text-ink-900">
            Shop mobile phones
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">
            Every device is inspected, every price is what you pay, and refurbished
            units publish their exact battery health before you commit.
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="container py-8">
            <ProductGridSkeleton count={12} />
          </div>
        }
      >
        <ShopClient initial={initial} brands={brands} />
      </Suspense>
    </>
  );
}
