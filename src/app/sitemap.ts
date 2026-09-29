import type { MetadataRoute } from 'next';
import { products } from '@/data/products';
import { repairServices } from '@/data/repairs';
import { accessories } from '@/data/accessories';
import { siteConfig } from '@/lib/config';

/**
 * Dynamic sitemap covering every indexable route, including all products,
 * repair services and accessories. Regenerated hourly so new catalogue items
 * are picked up quickly without rebuilding on every request.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, '');
  const now = new Date();

  type Freq = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

  // Transactional pages are intentionally given a near-zero priority — they
  // should not rank, but the URLs still resolve.
  const staticRoutes: MetadataRoute.Sitemap = (
    [
      { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
      { url: `${base}/shop`, changeFrequency: 'daily', priority: 0.9 },
      { url: `${base}/sell-phone`, changeFrequency: 'monthly', priority: 0.9 },
      { url: `${base}/repair`, changeFrequency: 'monthly', priority: 0.9 },
      { url: `${base}/accessories`, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.5 },
      { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.6 },
      { url: `${base}/faqs`, changeFrequency: 'monthly', priority: 0.5 },
      { url: `${base}/cart`, changeFrequency: 'yearly', priority: 0.1 },
      { url: `${base}/checkout`, changeFrequency: 'yearly', priority: 0.1 },
      { url: `${base}/wishlist`, changeFrequency: 'yearly', priority: 0.1 },
    ] as Array<{ url: string; changeFrequency: Freq; priority: number }>
  ).map((route) => ({ ...route, lastModified: now }));

  const policyRoutes: MetadataRoute.Sitemap = [
    'privacy',
    'terms',
    'refund',
    'shipping',
    'warranty',
  ].map((slug) => ({
    url: `${base}/policies/${slug}`,
    lastModified: now,
    changeFrequency: 'yearly' as const,
    priority: 0.3,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/shop/${p.slug}`,
    lastModified: new Date(p.createdAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const repairRoutes: MetadataRoute.Sitemap = repairServices.map((s) => ({
    url: `${base}/repair/${s.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const accessoryRoutes: MetadataRoute.Sitemap = accessories.map((a) => ({
    url: `${base}/accessories/${a.slug}`,
    lastModified: new Date(a.createdAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...policyRoutes,
    ...productRoutes,
    ...repairRoutes,
    ...accessoryRoutes,
  ];
}
