import type { Metadata } from 'next';
import { CheckoutClient } from '@/components/checkout/CheckoutClient';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Checkout',
  description: 'Complete your MobilExpertX order with secure payment.',
  path: '/checkout',
  noIndex: true,
});

export default function CheckoutPage() {
  return <CheckoutClient />;
}
