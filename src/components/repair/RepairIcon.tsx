'use client';

import { m } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RepairService } from '@/types';
/**
 * Repair service icon set.
 *
 * Hand-drawn SVG rather than an icon-font dependency: these render crisply at
 * any size, inherit `currentColor`, and add ~0 bytes of JavaScript. The
 * `className` prop lets a caller control the coloured container.
 */
const PATHS: Record<string, JSX.Element> = {
  screen: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2.5" />
      <path d="M9.5 4.5h5" />
      <path d="M10 18.5l-1 2h6l-1-2" />
      <path d="M8.5 9.5l2 2 4-4" />
    </>
  ),
  battery: (
    <>
      <rect x="2" y="7" width="17" height="10" rx="2.5" />
      <path d="M21 11v2" />
      <path d="M12 9.5l-2 4h3l-1 3" />
    </>
  ),
  charging: (
    <>
      <path d="M12 2v4M12 18v4" />
      <path d="M8 6h8v5a4 4 0 01-8 0V6z" />
      <path d="M4 21h16" />
    </>
  ),
  speaker: (
    <>
      <path d="M4 9h3l4-4v14l-4-4H4z" />
      <path d="M15 8.5a5 5 0 010 7" />
      <path d="M18 6a9 9 0 010 12" />
    </>
  ),
  microphone: (
    <>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0014 0" />
      <path d="M12 18v4M8 22h8" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8h4l1.5-2h7L17 8h4v12H3z" />
      <circle cx="12" cy="13.5" r="4" />
    </>
  ),
  backglass: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <rect x="8.5" y="5" width="4" height="4" rx="1" />
      <path d="M10 14l1.5 2 2.5-4" />
    </>
  ),
  water: (
    <>
      <path d="M12 2.5S5 10 5 14.5a7 7 0 0014 0C19 10 12 2.5 12 2.5z" />
      <path d="M9 15a3 3 0 003 3" />
    </>
  ),
  software: (
    <>
      <rect x="2.5" y="4" width="19" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M9 10l2.5 2.5L9 15" />
      <path d="M13.5 15H16" />
    </>
  ),
  chip: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M10 10h4v4h-4z" />
      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
    </>
  ),
  diagnostics: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.5-4.5" />
      <path d="M11 8v3.5l2 1.5" />
    </>
  ),
};
export function RepairIcon({
  name,
  className,
  iconClassName = 'h-6 w-6',
}: {
  name: string;
  className?: string;
  iconClassName?: string;
}) {
  const fallback = (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2.5" />
      <path d="M9 9h6M9 13h6" />
    </>
  );
  return (
    <span className={cn('shrink-0', className)} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={iconClassName}
      >
        {PATHS[name] ?? fallback}
      </svg>
    </span>
  );
}
/** Animated "phone being repaired" visual used on the repair page hero. */
export function RepairPhoneVisual({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)} aria-hidden="true">
      <m.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mx-auto aspect-[9/17] w-32"
      >
        <div className="absolute inset-0 rounded-[1.4rem] bg-gradient-to-br from-brand-500 to-purple-600 p-2.5 shadow-lift">
          <div className="h-full w-full rounded-[1.1rem] bg-ink-800" />
        </div>
        {/* Cracked glass overlay */}
        <svg viewBox="0 0 100 180" className="absolute inset-0 h-full w-full">
          <path
            d="M52 8 L44 60 L58 78 L40 120 L56 172"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1.2"
            fill="none"
          />
          <path d="M44 60 L20 46" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" />
          <path d="M58 78 L84 66" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" />
          <path d="M40 120 L14 134" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" />
        </svg>
        <m.div
          className="absolute inset-0 rounded-[1.4rem]"
          animate={{ opacity: [0, 0.55, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ boxShadow: '0 0 40px 8px rgba(16,185,129,0.45)' }}
        />
      </m.div>
      <m.div
        className="absolute -right-6 top-8 grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-lift"
        animate={{ y: [0, 10, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ShieldCheck className="h-5 w-5 text-emerald-500" />
      </m.div>
    </div>
  );
}
