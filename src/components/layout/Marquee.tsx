'use client';

import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/components/providers/MotionProvider';

/**
 * Seamless infinite marquee.
 *
 * The track is duplicated once and translated by exactly -50%, so the loop is
 * mathematically seamless. `aria-hidden` on the clone keeps screen readers
 * from hearing every item twice. Motion is disabled for reduced-motion users,
 * who simply see a static row.
 */
export function Marquee({
  children,
  className,
  speedSeconds = 34,
  pauseOnHover = true,
}: {
  children: React.ReactNode;
  className?: string;
  speedSeconds?: number;
  pauseOnHover?: boolean;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <div
      className={cn(
        'relative flex w-full overflow-hidden',
        pauseOnHover && 'group',
        className,
      )}
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className={cn(
            'flex shrink-0 items-center justify-around',
            !reduced && 'animate-marquee',
            pauseOnHover && 'group-hover:[animation-play-state:paused]',
          )}
          style={reduced ? undefined : { animationDuration: `${speedSeconds}s` }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
