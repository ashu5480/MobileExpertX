import { Check, ThumbsUp } from 'lucide-react';
import { Rating } from '@/components/ui/Rating';
import { Avatar } from '@/components/ui/Avatar';
import { reviewSummary } from '@/data/reviews';
import { formatDate, formatNumber } from '@/lib/utils';
import type { Product, ProductReview } from '@/types';

/** Rating summary + individual verified reviews. */
export function ProductReviews({
  product,
  reviews,
}: {
  product: Product;
  reviews: ProductReview[];
}) {
  const dist = reviewSummary(product.slug, product.rating, product.reviewCount);

  return (
    <section id="reviews" className="scroll-mt-28" aria-labelledby="reviews-heading">
      <h2
        id="reviews-heading"
        className="text-display-sm font-extrabold tracking-tight text-ink-900"
      >
        Customer reviews
      </h2>

      <div className="mt-6 grid gap-6 rounded-3xl border border-surface-200 bg-surface-50 p-6 lg:grid-cols-3">
        <div className="text-center lg:border-r lg:border-surface-200 lg:pr-6">
          <p className="text-5xl font-extrabold tracking-tight text-ink-900">
            {product.rating.toFixed(1)}
          </p>
          <div className="mt-2 flex justify-center">
            <Rating value={product.rating} size={18} />
          </div>
          <p className="mt-2 text-sm text-ink-500">
            Based on {formatNumber(product.reviewCount)} verified reviews
          </p>
        </div>

        <div className="space-y-1.5 lg:col-span-2">
          {dist.map((count, i) => {
            const stars = 5 - i;
            const pct = product.reviewCount ? (count / product.reviewCount) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3">
                <span className="w-8 shrink-0 text-xs font-semibold text-ink-600">
                  {stars}★
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-200">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-ink-500">
                  {formatNumber(count)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-6 grid gap-4 lg:grid-cols-2">
        {reviews.map((review) => (
          <li
            key={review.id}
            className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft"
          >
            <div className="flex items-start gap-3.5">
              <Avatar name={review.author} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-sm font-bold text-ink-900">{review.author}</p>
                  {review.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      <Check className="h-2.5 w-2.5" aria-hidden="true" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-500">
                  {review.location} · {formatDate(review.date)}
                </p>
              </div>
              <Rating value={review.rating} size={13} />
            </div>

            <h3 className="mt-4 text-sm font-bold text-ink-900">{review.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{review.body}</p>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-surface-200 pt-3.5">
              <p className="truncate text-xs text-ink-400">Purchased: {review.purchased}</p>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-ink-400">
                <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                {review.helpful}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
