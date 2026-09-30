import Link from 'next/link';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/lib/config';

/**
 * Logo: "MOBIL" in near-black, "EXPERTX" in the electric blue → purple
 * gradient, with a geometric phone-glyph mark. Pure SVG + CSS so it is crisp
 * at any size, animates on hover, and costs no network request.
 */
export function Logo({
  className,
  markClassName,
  showWordmark = true,
  href = '/',
  inverted = false,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  href?: string | null;
  inverted?: boolean;
}) {
  const content = (
    <span className={cn('group inline-flex items-center gap-2.5', className)}>
      <span className={cn('relative', markClassName)}>
        <span
          className={cn(
            'absolute -inset-2 rounded-2xl bg-brand-gradient opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-45',
          )}
          aria-hidden="true"
        />
        <svg
          viewBox="0 0 40 40"
          className="relative h-8 w-8 sm:h-9 sm:w-9"
          role="img"
          aria-label={siteConfig.name}
        >
          <defs>
            <linearGradient id="mex-mark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>
          </defs>
          <rect
            x="11"
            y="3.5"
            width="18"
            height="33"
            rx="5.5"
            fill="url(#mex-mark)"
          />
          <rect
            x="14.5"
            y="8"
            width="11"
            height="24"
            rx="2.5"
            fill={inverted ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.92)'}
          />
          <line
            x1="17"
            y1="6.6"
            x2="23"
            y2="6.6"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="20" cy="28.5" r="1.4" fill="#6EE7B3" />
        </svg>
      </span>

      {showWordmark && (
        <span
          className={cn(
            'font-display text-[19px] font-extrabold leading-none tracking-tight sm:text-xl',
          )}
        >
          <span className={inverted ? 'text-white' : 'text-ink-900'}>MOBIL</span>
          <span className="bg-brand-gradient bg-clip-text text-transparent">EXPERTX</span>
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label={`${siteConfig.name} home`} className="inline-flex">
      {content}
    </Link>
  );
}
