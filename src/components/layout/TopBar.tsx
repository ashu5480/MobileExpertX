'use client';

import { Marquee } from './Marquee';
import { siteConfig } from '@/lib/config';
import { Star, Truck, ShieldCheck } from 'lucide-react';

const ITEMS = [
  { icon: Truck, text: 'Free delivery on orders above ₹4,999' },
  { icon: ShieldCheck, text: '1-year warranty on every new device' },
  { icon: Star, text: 'Grade-A refurbished · 90-day assurance' },
];

/**
 * Announcement bar.
 *
 * Horizontally scrollable on small screens (rather than truncated) so nothing
 * is hidden, and a seamless marquee on wide screens.
 */
export function TopBar() {
  return (
    <div className="dark-section relative z-50 overflow-hidden bg-ink-900 text-white">
      <div className="container">
        {/* Mobile: a swipeable single row */}
        <div className="flex items-center gap-6 overflow-x-auto py-2.5 text-[12px] font-medium whitespace-nowrap [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden">
          {ITEMS.map((item) => (
            <span key={item.text} className="inline-flex items-center gap-1.5 text-white/75">
              <item.icon className="h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
              {item.text}
            </span>
          ))}
        </div>

        {/* Desktop: a slow, seamless marquee */}
        <div className="hidden h-9 items-center overflow-hidden sm:flex">
          <Marquee>
            {ITEMS.map((item) => (
              <span
                key={item.text}
                className="mx-8 inline-flex items-center gap-2 text-[13px] font-medium text-white/75"
              >
                <item.icon className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                {item.text}
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </div>
  );
}
