import { cn } from '@/lib/utils';

/**
 * Consistent section header: eyebrow → heading → description → action.
 * Kept as one component so vertical rhythm and type scale stay identical
 * across every page.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  id,
  align = 'left',
  dark = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  id?: string;
  align?: 'left' | 'center';
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <p
            className={cn(
              'mb-3 text-[12px] font-bold uppercase tracking-[0.14em]',
              dark ? 'text-cyan-400' : 'text-brand-500',
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2
          id={id}
          className={cn(
            'text-display-sm font-extrabold tracking-tight',
            dark ? 'text-white' : 'text-ink-900',
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              'mt-3.5 text-base leading-relaxed',
              dark ? 'text-white/60' : 'text-ink-600',
            )}
          >
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
