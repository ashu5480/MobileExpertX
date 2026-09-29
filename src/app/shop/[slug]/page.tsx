import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductPurchase } from '@/components/product/ProductPurchase';
import { ProductSpecs, ProductHighlights } from '@/components/product/ProductDetails';
import { ProductReviews } from '@/components/product/ProductReviews';
import { ProductCard } from '@/components/product/ProductCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ProductDetailStickyBar } from '@/components/product/ProductDetailStickyBar';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, buildMetadata, productSchema } from '@/lib/seo';
import {
  getProductBySlug,
  getProductReviews,
  getRelatedProducts,
} from '@/services/catalogService';
import { products } from '@/data/products';
import { deliveryMethods } from '@/data/store';
import { formatDate, formatPrice } from '@/lib/utils';

interface Params {
  params: { slug: string };
}

/** Pre-render every product page at build time for instant loads and SEO. */
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    return buildMetadata({
      title: 'Product not found',
      description: 'This product is no longer available.',
      path: `/shop/${params.slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${product.name} — Buy online`,
    description: `${product.name} for ${formatPrice(product.price)}. ${
      product.condition === 'refurbished'
        ? `Grade-A refurbished with ${product.batteryHealth ?? 90}% battery health and a 90-day warranty.`
        : `${product.warranty}. Free delivery above ₹4,999.`
    }`,
    path: `/shop/${product.slug}`,
    type: 'product',
    image: product.images[0]?.url || undefined,
    keywords: [product.brand, product.model, 'buy online', product.name],
  });
}

export default async function ProductPage({ params }: Params) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const [reviews, related] = await Promise.all([
    getProductReviews(product.slug),
    getRelatedProducts(product, 4),
  ]);

  return (
    <>
      <JsonLd
        data={[
          productSchema(product),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Shop', path: '/shop' },
            { name: product.name, path: `/shop/${product.slug}` },
          ]),
        ]}
      />

      <div className="container py-6 sm:py-8">
        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: 'Shop', href: '/shop' },
            { name: product.name },
          ]}
        />
      </div>

      {/* ── Two-column: gallery | buy box ─────────────────────────────── */}
      <div className="container">
        <div className="grid gap-8 pb-14 lg:grid-cols-2 lg:gap-12">
          <ProductGallery product={product} />
          <ProductPurchase product={product} />
        </div>

        {/* ── Detail sections ─────────────────────────────────────────── */}
        <div className="grid gap-12 border-t border-surface-200 pb-16 pt-12 lg:grid-cols-3 lg:gap-10">
          <div className="lg:col-span-2">
            <h2 className="text-title-lg font-extrabold tracking-tight text-ink-900">
              About the {product.name}
            </h2>
            <div className="mt-4">
              <ProductHighlights product={product} />
            </div>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-600">
              {product.description}
            </p>

            <h3 className="mt-10 text-lg font-bold tracking-tight text-ink-900">
              Technical specifications
            </h3>
            <div className="mt-4">
              <ProductSpecs product={product} />
            </div>

            <h3 className="mt-10 text-lg font-bold tracking-tight text-ink-900">
              Delivery information
            </h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {deliveryMethods.map((method) => (
                <li
                  key={method.id}
                  className="rounded-2xl border border-surface-200 bg-surface-50 p-4"
                >
                  <p className="text-sm font-bold text-ink-900">{method.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-600">{method.eta}</p>
                  <p className="mt-2 text-sm font-semibold text-brand-600">
                    {method.pricePaise === 0 ? 'Free' : `From ₹${method.pricePaise / 100}`}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-surface-200 bg-surface-50 p-6">
              <h3 className="text-sm font-bold text-ink-900">Warranty &amp; returns</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="text-ink-500">Warranty</dt>
                  <dd className="font-semibold text-ink-900">{product.warranty}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Return window</dt>
                  <dd className="font-semibold text-ink-900">7 days, no questions</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Published</dt>
                  <dd className="font-semibold text-ink-900">
                    {formatDate(product.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>

        <ProductReviews product={product} reviews={reviews} />
      </div>

      {/* ── Related ────────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="section border-t border-surface-200 bg-surface-50">
          <div className="container">
            <SectionHeading
              eyebrow="You might also like"
              title="Similar phones worth considering"
            />
            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Thumb-reachable actions on mobile */}
      <ProductDetailStickyBar product={product} />
    </>
  );
}
