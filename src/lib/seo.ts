import type { Metadata } from 'next';
import { hasAddress, siteConfig } from './config';
import type { Product, RepairService } from '@/types';

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  keywords?: string[];
}

/** Absolute canonical URL for a site-relative path. */
export function canonical(path: string): string {
  const base = siteConfig.url.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean === '/' ? '' : clean}`;
}

/** Builds a complete, canonical-aware Metadata object for any page. */
export function buildMetadata({
  title,
  description,
  path,
  image = '/opengraph-image.svg',
  type = 'website',
  noIndex = false,
  keywords = [],
}: PageMetaInput): Metadata {
  const url = canonical(path);
  const fullTitle = title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`;

  return {
    title: fullTitle,
    description,
    keywords: [
      'mobile phone store',
      'buy smartphones online',
      'sell old phone',
      'mobile repair',
      'mobile accessories',
      'refurbished phones',
      siteConfig.name,
      ...keywords,
    ],
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
        },
    openGraph: {
      type: type === 'product' ? 'website' : type,
      url,
      title: fullTitle,
      description,
      siteName: siteConfig.name,
      locale: 'en_IN',
      images: [
        {
          url: image.startsWith('http') ? image : canonical(image),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image.startsWith('http') ? image : canonical(image)],
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 *  JSON-LD structured data
 * ──────────────────────────────────────────────────────────────────────────── */

const ORG_ID = `${canonical('/')}#organization`;

/** Organization + LocalBusiness schema — emitted site-wide. */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': ORG_ID,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: `+${siteConfig.contact.phone}`,
    email: siteConfig.contact.email,
    image: canonical('/opengraph-image.svg'),
    logo: canonical('/logo.svg'),
    priceRange: '₹₹',
    currenciesAccepted: siteConfig.currency,
    paymentAccepted: 'Cash, UPI, Credit Card, Debit Card, Net Banking',
    // Only publish a PostalAddress when one is actually configured — an empty
    // address block is worse for local SEO than no block at all.
    ...(hasAddress
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: [siteConfig.address.line1, siteConfig.address.line2]
              .filter(Boolean)
              .join(', '),
            addressLocality: siteConfig.address.city,
            addressRegion: siteConfig.address.state,
            postalCode: siteConfig.address.postalCode,
            addressCountry: siteConfig.address.countryCode,
          },
        }
      : {}),
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ],
        opens: '10:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '11:00',
        closes: '18:00',
      },
    ],
    sameAs: [
      `https://instagram.com/${siteConfig.social.instagram}`,
      `https://facebook.com/${siteConfig.social.facebook}`,
      `https://youtube.com/${siteConfig.social.youtube}`,
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: `+${siteConfig.contact.phone}`,
        contactType: 'customer support',
        areaServed: siteConfig.address.countryCode,
        availableLanguage: ['English', 'Hindi', 'Gujarati'],
      },
    ],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${canonical('/')}#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function productSchema(product: Product) {
  const url = canonical(`/shop/${product.slug}`);
  const images = product.images.filter((i) => i.url).map((i) => canonical(i.url));
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    description: product.description,
    sku: product.sku,
    mpn: product.sku,
    image: images.length ? images : [canonical('/opengraph-image.svg')],
    brand: { '@type': 'Brand', name: product.brand },
    color: product.colors.map((c) => c.name).join(', '),
    model: product.model,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating.toFixed(1),
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: siteConfig.currency,
      price: (product.price / 100).toFixed(2),
      priceValidUntil: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10),
      itemCondition:
        product.condition === 'new'
          ? 'https://schema.org/NewCondition'
          : 'https://schema.org/UsedCondition',
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: { '@id': ORG_ID },
      warranty: product.warranty,
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: siteConfig.address.countryCode,
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '99',
          currency: siteConfig.currency,
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: siteConfig.address.countryCode,
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 2,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 2,
            maxValue: 5,
            unitCode: 'DAY',
          },
        },
      },
    },
  };
}

export function serviceSchema(service: RepairService) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.longDescription,
    serviceType: service.name,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: siteConfig.address.country },
    offers: {
      '@type': 'Offer',
      priceCurrency: siteConfig.currency,
      price: (service.startingPrice / 100).toFixed(2),
      description: `Starting price for ${service.name}`,
    },
  };
}

export function faqSchema(items: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}


export function breadcrumbSchema(trail: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: canonical(item.path),
    })),
  };
}
