import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OrderSuccess } from '@/components/checkout/OrderSuccess';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Order Confirmed',
  description: 'Thank you for your MobilExpertX order.',
  path: '/checkout/success',
  noIndex: true,
});

export default function OrderSuccessPage() {
  // `OrderSuccess` reads `useSearchParams`, which requires a Suspense boundary
  // so this route can still be statically prerendered.
  return (
    <Suspense
      fallback={
        <div className="container py-20">
          <div className="mx-auto h-80 max-w-lg animate-pulse rounded-3xl bg-surface-100" />
        </div>
      }
    >
      <OrderSuccess />
    </Suspense>
  );
}
