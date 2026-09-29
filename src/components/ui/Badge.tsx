import { cn } from '@/lib/utils';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'dark' | 'cyan';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-500/10 text-brand-600 ring-brand-500/20',
  cyan: 'bg-cyan-500/12 text-cyan-600 ring-cyan-500/25',
  success: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
  warning: 'bg-amber-500/12 text-amber-700 ring-amber-500/25',
  danger: 'bg-rose-500/10 text-rose-600 ring-rose-500/20',
  neutral: 'bg-surface-100 text-ink-700 ring-surface-300',
  dark: 'bg-ink-900 text-white ring-ink-900',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
  dot,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Condition pill used on product cards and the detail page. */
export function ConditionBadge({ condition }: { condition: string }) {
  const map: Record<string, { label: string; tone: Tone }> = {
    new: { label: 'Brand New', tone: 'success' },
    refurbished: { label: 'Refurbished', tone: 'brand' },
    used: { label: 'Used', tone: 'warning' },
  };
  const meta = map[condition] ?? { label: condition, tone: 'neutral' as Tone };
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}

/** Discount badge, e.g. "18% OFF". */
export function DiscountBadge({ percent }: { percent: number }) {
  if (percent <= 0) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-soft">
      {percent}% OFF
    </span>
  );
}
