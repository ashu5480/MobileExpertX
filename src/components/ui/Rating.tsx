import { Star } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

/**
 * Star rating.
 *
 * Uses a clipped gradient for the filled portion so partial stars render
 * crisply at any size, and exposes the value to assistive tech via a label
 * rather than a pile of decorative icons.
 */
export function Rating({
  value,
  count,
  size = 14,
  showValue = false,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Rated ${value.toFixed(1)} out of 5${count ? ` from ${formatNumber(count)} reviews` : ''}`}
    >
      <span
        className="relative inline-block align-middle"
        style={{ width: size * 5, height: size }}
        aria-hidden="true"
      >
        {/* Empty track */}
        <span className="absolute inset-0 flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={size} className="text-surface-300" fill="currentColor" />
          ))}
        </span>
        {/* Filled overlay, clipped to the rating percentage */}
        <span
          className="absolute inset-0 flex overflow-hidden"
          style={{ width: `${pct}%` }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={size}
              className="shrink-0 text-amber-400"
              fill="currentColor"
            />
          ))}
        </span>
      </span>

      {showValue && (
        <span className="text-sm font-semibold tabular-nums text-ink-800">
          {value.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-xs text-ink-500">({formatNumber(count)})</span>
      )}
    </span>
  );
}
