import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { TrendingPhones } from '@/components/home/TrendingPhones';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { RefurbishedSection } from '@/components/home/RefurbishedSection';
import { SellPhoneSection } from '@/components/home/SellPhoneSection';
import { RepairSection } from '@/components/home/RepairSection';
import { AccessoriesSection } from '@/components/home/AccessoriesSection';
import { TrustSection } from '@/components/home/TrustSection';
import { OffersSection } from '@/components/home/OffersSection';
import { ReviewCarousel } from '@/components/home/ReviewCarousel';
import { ContactCTA } from '@/components/contact/ContactCTA';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/config';
import { faqs } from '@/data/store';

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  path: '/',
  keywords: [
    'buy mobile phone online India',
    'sell old phone',
    'mobile repair Ahmedabad',
    'refurbished phones India',
    'mobile accessories online',
  ],
});

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([{ name: 'Home', path: '/' }])}
      />

      {/* The hero owns the page H1 — a second one would dilute the heading
          outline and confuse assistive technology. */}

      <Hero />
      <TrendingPhones />
      <CategoryGrid />
      <RefurbishedSection />
      <SellPhoneSection />
      <RepairSection />
      <AccessoriesSection />
      <TrustSection />
      <OffersSection />
      <ReviewCarousel />
      <ContactCTA />
    </>
  );
}
