import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface Crumb {
  name: string;
  href?: string;
}

/** Semantic breadcrumb trail; the last item is the current page (not a link). */
export function Breadcrumbs({ items, dark }: { items: Crumb[]; dark?: boolean }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        className={cn(
          'flex flex-wrap items-center gap-1 text-xs',
          dark ? 'text-white/50' : 'text-ink-500',
        )}
      >
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.name}-${i}`} className="flex items-center gap-1">
              {last ? (
                <span
                  aria-current="page"
                  className={cn('font-semibold', dark ? 'text-white/85' : 'text-ink-800')}
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href ?? '/'}
                  className={cn(
                    'transition-colors',
                    dark ? 'hover:text-white' : 'hover:text-brand-600',
                  )}
                >
                  {item.name}
                </Link>
              )}
              {!last && (
                <ChevronRight className="h-3 w-3 opacity-50" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
