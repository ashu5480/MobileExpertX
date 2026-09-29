import type { Metadata } from 'next';
import { WishlistClient } from '@/components/wishlist/WishlistClient';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Your Wishlist',
  description: 'Phones and accessories you have saved for later.',
  path: '/wishlist',
  noIndex: true,
});

export default function WishlistPage() {
  return <WishlistClient />;
}
