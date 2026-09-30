import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Transactional, private and API routes carry no search value and must
        // never be indexed (or crawled for parameter injection).
        disallow: [
          '/api/',
          '/admin',
          '/login',
          '/cart',
          '/checkout',
          '/checkout/',
          '/wishlist',
          '/account',
          '/uploads/',
          '/*?*',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
