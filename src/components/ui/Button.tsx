'use client';

import { m, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
/**
 * The single Button primitive for the whole app.
 *
 * - `as="link"` renders a `next/link` (client-side navigation, prefetch).
 * - `loading` swaps the leading icon for a spinner and sets aria-busy.
 * - A gradient sheen sweeps across on hover for the primary variant.
 */
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'whatsapp' | 'dark';
type Size = 'sm' | 'md' | 'lg' | 'icon';
const base =
  'relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold transition-all duration-300 ease-premium disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] whitespace-nowrap';
const variants: Record<Variant, string> = {
  primary: cn(
    base,
    'bg-brand-gradient text-white shadow-lift',
    'hover:shadow-glow hover:brightness-[1.06]',
  ),
  secondary: cn(
    base,
    'border border-brand-200 bg-brand-50 text-brand-800',
    'hover:border-brand-300 hover:bg-brand-100',
  ),
  outline: cn(
    base,
    'border border-surface-300 bg-white text-ink-900 shadow-soft',
    'hover:border-brand-300 hover:bg-surface-50 hover:text-brand-700',
  ),
  ghost: cn(base, 'text-ink-700 hover:bg-surface-100 hover:text-ink-900'),
  whatsapp: cn(base, 'bg-[#25D366] text-white shadow-lift hover:brightness-105 hover:shadow-[0_18px_48px_-12px_rgba(37,211,102,0.55)]'),
  // Reserved for the few surfaces that are still dark (device mockups, the
  // cart drawer backdrop). Everywhere else prefer `secondary` or `outline`.
  dark: cn(base, 'bg-white/10 text-white backdrop-blur-md ring-1 ring-inset ring-white/20 hover:bg-white/20'),
};
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-[15px]',
  icon: 'h-10 w-10 p-0',
};
const sheen =
  'pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-premium group-hover:translate-x-full';
export interface ButtonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}
type NativeProps = Omit<HTMLMotionProps<'button'>, 'children' | 'className'>;
type LinkProps = Omit<
  React.ComponentProps<typeof Link>,
  'children' | 'className' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'style'
>;
export type ButtonComponent =
  | ((props: NativeProps & ButtonProps) => JSX.Element)
  | ((props: LinkProps & ButtonProps) => JSX.Element);
function Inner({
  children,
  loading,
  loadingText,
  size,
  variant,
}: ButtonProps & { children: React.ReactNode }) {
  return (
    <>
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {loading && loadingText ? loadingText : children}
      </span>
      {variant === 'primary' && (
        <span className={cn(sheen, 'group-hover:translate-x-full')} aria-hidden="true" />
      )}
      {size === 'lg' && null}
    </>
  );
}
export const Button = forwardRef<HTMLButtonElement, NativeProps & ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      fullWidth,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <m.button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        whileHover={disabled || loading ? undefined : { y: -2 }}
        whileTap={disabled || loading ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className={cn(
          'group',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        <Inner variant={variant} size={size} loading={loading} loadingText={loadingText}>
          {children}
        </Inner>
      </m.button>
    );
  },
);
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  ...props
}: LinkProps & ButtonProps) {
  return (
    <Link
      className={cn('group', variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    >
      <Inner variant={variant} size={size}>
        {children}
      </Inner>
    </Link>
  );
}
