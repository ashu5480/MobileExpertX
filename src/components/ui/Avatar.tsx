'use client';

import { cn } from '@/lib/utils';

/**
 * Deterministic avatar generated from a name.
 *
 * Renders initials on a stable brand-tinted gradient, so the same person is
 * always the same colour. No image request, no layout shift, no broken-image
 * states — and it works identically on the server and the client.
 */

const PALETTE = [
  ['#10B981', '#0D9488'],
  ['#0D9488', '#10B981'],
  ['#5EEAD4', '#10B981'],
  ['#0D9488', '#6EE7B3'],
  ['#10B981', '#6EE7B3'],
  ['#047857', '#0D9488'],
] as const;

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function Avatar({
  name,
  size = 40,
  className,
  rounded = 'rounded-full',
}: {
  name: string;
  size?: number;
  className?: string;
  rounded?: string;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const [from, to] = PALETTE[hash(name) % PALETTE.length];

  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden font-display font-bold text-white ring-1 ring-black/5',
        rounded,
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.38),
        background: `linear-gradient(140deg, ${from}, ${to})`,
      }}
      role="img"
      aria-label={name}
    >
      {/* Subtle top-light */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(160deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 55%)',
        }}
        aria-hidden="true"
      />
      <span className="relative">{initials}</span>
    </span>
  );
}
