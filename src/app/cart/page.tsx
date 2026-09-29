import type { Metadata } from 'next';
import { CartClient } from '@/components/cart/CartClient';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Your Cart',
  description: 'Review the items in your MobilExpertX cart before checkout.',
  path: '/cart',
  noIndex: true,
});

export default function CartPage() {
  return <CartClient />;
}
