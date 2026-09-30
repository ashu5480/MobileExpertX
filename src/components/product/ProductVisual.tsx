'use client';

import { memo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ColorOption, ProductImage } from '@/types';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  ProductVisual
 * ────────────────────────────────────────────────────────────────────────────
 *  Renders a phone render without shipping any binary assets:
 *
 *    • If `image.url` is set, it uses `next/image` (AVIF/WebP, lazy, sized).
 *    • Otherwise it draws a clean, centred CSS-3D phone on a soft studio
 *      backdrop, tinted from the product's own accent colour.
 *
 *  Real product photography can therefore be dropped in later by filling
 *  `image.url` — the layout, aspect ratio and gallery do not change.
 */

export interface ProductVisualProps {
  image?: ProductImage;
  alt: string;
  accent: string;
  colors?: ColorOption[];
  view?: ProductImage['view'];
  name?: string;
  highlights?: string[];
  className?: string;
  priority?: boolean;
  rounded?: string;
}

const CAMERA_LAYOUT: Record<string, Array<[number, number, number]>> = {
  triple: [[30, 30, 26], [30, 68, 26], [68, 30, 26]],
  dual: [[32, 32, 30], [32, 70, 30]],
  quad: [[26, 26, 22], [26, 60, 22], [60, 26, 22], [60, 60, 22]],
  single: [[50, 50, 40]],
};

const isDark = (hex: string) => {
  const h = hex.replace('#', '');
  if (h.length !== 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
};

/** Camera count inferred from the product name and highlight chips. */
function inferLayout(name: string, highlights: string[] = []): keyof typeof CAMERA_LAYOUT {
  const hay = `${name} ${highlights.join(' ')}`.toLowerCase();
  if (hay.includes('quad')) return 'quad';
  if (hay.includes('dual')) return 'dual';
  if (hay.includes('single') || hay.includes('108') || hay.includes('foldable')) return 'single';
  if (hay.includes('s24 ultra')) return 'quad';
  return 'triple';
}

function PhoneRender({
  accent,
  colors,
  view,
  name,
  highlights,
}: {
  accent: string;
  colors?: ColorOption[];
  view?: ProductImage['view'];
  name: string;
  highlights?: string[];
}) {
  const color = colors?.[0];
  const [from, to] = color?.gradient ?? [accent, accent];
  const dark = isDark(color?.hex ?? accent);
  const showBack = view === 'back' || view === 'detail';
  const lenses = CAMERA_LAYOUT[
    showBack ? inferLayout(name, highlights) : 'single'
  ];

  return (
    <div className="relative h-full w-full [perspective:1200px]">
      <div
        className="phone-3d absolute inset-0 flex items-center justify-center"
        style={
          showBack
            ? { transform: 'perspective(1200px) rotateY(178deg) rotateX(6deg)' }
            : undefined
        }
      >
        <div
          className="relative h-[86%] max-h-[340px] w-[42%] max-w-[150px] rounded-[1.6rem] shadow-[0_28px_60px_-18px_rgba(8,9,13,0.55)] ring-1 ring-black/10"
          style={{ background: `linear-gradient(150deg, ${from} 0%, ${to} 100%)` }}
        >
          {/* Titanium / aluminium edge highlight */}
          <span
            className="pointer-events-none absolute inset-0 rounded-[1.6rem]"
            style={{
              background:
                'linear-gradient(115deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 26%, rgba(255,255,255,0) 72%, rgba(255,255,255,0.24) 100%)',
            }}
            aria-hidden="true"
          />

          {showBack ? (
            /* ── Back: camera module ──────────────────────────────── */
            <div className="absolute left-[12%] top-[8%] h-[34%] w-[46%] rounded-2xl bg-black/25 p-[6%] ring-1 ring-white/15">
              <div className="relative h-full w-full">
                {lenses.map(([x, y, d], i) => (
                  <span
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${d}%`,
                      height: `${d}%`,
                      transform: 'translate(-50%, -50%)',
                      background:
                        'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5), rgba(0,0,0,0.9) 58%)',
                      boxShadow:
                        'inset 0 0 0 1.5px rgba(255,255,255,0.28), 0 2px 6px rgba(0,0,0,0.5)',
                    }}
                  />
                ))}
              </div>
              <span className="absolute -bottom-2 right-1 block h-1.5 w-1.5 rounded-full bg-white/70" />
            </div>
          ) : (
            /* ── Front: screen with a subtle UI ghost ─────────────── */
            <div
              className="absolute inset-[3.5%] overflow-hidden rounded-[1.35rem] ring-1 ring-black/20"
              style={{
                background: dark
                  ? 'linear-gradient(165deg, #0B1020 0%, #141B33 100%)'
                  : 'linear-gradient(165deg, #F6F7FB 0%, #E7EAF3 100%)',
              }}
            >
              <div className="flex items-center justify-between px-2.5 pt-2">
                <span
                  className={cn('h-1 w-5 rounded-full', dark ? 'bg-white/45' : 'bg-ink-900/25')}
                />
                <span className="flex items-end gap-0.5">
                  {[3, 4, 5].map((h) => (
                    <span
                      key={h}
                      className={cn('w-[3px] rounded-sm', dark ? 'bg-white/50' : 'bg-ink-900/25')}
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </span>
              </div>

              {/* Accent glow bleeding in from the brand colour */}
              <div
                className="absolute -right-8 top-8 h-20 w-20 rounded-full opacity-70 blur-2xl"
                style={{ background: accent }}
                aria-hidden="true"
              />
              <div
                className="absolute -left-6 bottom-6 h-16 w-16 rounded-full opacity-40 blur-2xl"
                style={{ background: '#0D9488' }}
                aria-hidden="true"
              />

              {/* Abstract "app" grid so the screen reads as a real device */}
              <div className="absolute inset-x-3 bottom-9 grid grid-cols-3 gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className="aspect-square rounded-[5px]"
                    style={{
                      background:
                        i === 0
                          ? `linear-gradient(140deg, ${accent}, #0D9488)`
                          : dark
                            ? 'rgba(255,255,255,0.12)'
                            : 'rgba(11,16,32,0.08)',
                    }}
                  />
                ))}
              </div>

              <span
                className={cn(
                  'absolute bottom-2 left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-full',
                  dark ? 'bg-white/60' : 'bg-ink-900/25',
                )}
              />
              <span className="absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full bg-black/70 ring-1 ring-white/10" />
            </div>
          )}

          {/* Side buttons */}
          <span className="absolute -left-[2px] top-[26%] h-8 w-[2px] rounded-l bg-black/20" />
          <span className="absolute -left-[2px] top-[38%] h-12 w-[2px] rounded-l bg-black/20" />
          <span className="absolute -right-[2px] top-[32%] h-14 w-[2px] rounded-r bg-black/20" />
        </div>
      </div>
    </div>
  );
}

interface AccessoryRenderProps {
  accent: string;
  name: string;
  /**
   * Uploaded photo. When present the real image is rendered instead of the
   * generated SVG -- without this, an admin uploading a product photo would
   * see no change on the storefront.
   */
  image?: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}

function AccessoryRender({
  accent,
  name,
  image,
  alt,
  className,
  priority,
}: AccessoryRenderProps) {
  if (image) {
    return (
      <div className={cn('relative h-full w-full overflow-hidden bg-surface-50', className)}>
        <Image
          src={image}
          alt={alt || name}
          fill
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 320px"
          className="object-contain p-4"
        />
      </div>
    );
  }

  const isWatch = /watch/i.test(name);
  const isEarbuds = /earbud|earphone/i.test(name);
  const isCable = /cable/i.test(name);

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center [perspective:900px]',
        className,
      )}
    >
      <div
        className="absolute inset-[12%] rounded-full opacity-25 blur-3xl"
        style={{ background: accent }}
        aria-hidden="true"
      />
      <div className="phone-3d relative flex items-center justify-center">
        {isWatch ? (
          <div className="relative h-[70%] w-[38%] max-w-[130px]">
            <div className="absolute inset-x-0 top-0 h-[34%] rounded-t-xl bg-ink-800" />
            <div className="absolute inset-x-0 bottom-0 h-[34%] rounded-b-xl bg-ink-800" />
            <div
              className="absolute inset-x-0 top-[30%] h-[40%] rounded-[1.4rem] shadow-lift"
              style={{ background: 'linear-gradient(150deg, #2A2C31, #0B0D12)' }}
            >
              <div
                className="absolute inset-1.5 rounded-[1.1rem]"
                style={{ background: `linear-gradient(160deg, ${accent}33, #05070C)` }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <span className="font-display text-lg font-bold text-white">72</span>
                <span className="text-[8px] uppercase tracking-widest text-white/50">bpm</span>
              </div>
            </div>
          </div>
        ) : isEarbuds ? (
          <div className="relative h-[62%] w-[58%] max-w-[190px]">
            <div
              className="absolute bottom-0 left-1/2 h-[56%] w-[86%] -translate-x-1/2 rounded-[1.5rem] shadow-lift"
              style={{ background: 'linear-gradient(160deg, #FFFFFF, #E4E7EF)' }}
            />
            <div className="absolute inset-x-[18%] top-0 h-[14%] rounded-full bg-ink-900/10" />
            {[-1, 1].map((side) => (
              <div
                key={side}
                className="absolute top-[8%] h-[38%] w-[30%] rounded-full shadow-soft"
                style={{
                  left: side === -1 ? '6%' : '64%',
                  background: 'linear-gradient(160deg, #FFFFFF, #DFE3EC)',
                }}
              >
                <span className="absolute inset-[22%] rounded-full bg-ink-900/70" />
              </div>
            ))}
          </div>
        ) : isCable ? (
          <div className="relative h-[46%] w-[80%] max-w-[230px]">
            <span
              className="absolute inset-x-0 top-1/2 h-5 -translate-y-1/2 rounded-full"
              style={{ background: `linear-gradient(90deg, ${accent}, #0D9488)` }}
            />
            <span className="absolute left-[-6%] top-1/2 h-8 w-8 -translate-y-1/2 rounded-md bg-ink-900" />
            <span className="absolute right-[-6%] top-1/2 h-8 w-8 -translate-y-1/2 rounded-md bg-ink-900" />
          </div>
        ) : (
          <div
            className="relative h-[52%] w-[46%] max-w-[150px] rounded-2xl shadow-lift"
            style={{ background: `linear-gradient(150deg, ${accent}, #0B1020)` }}
          >
            <span className="absolute inset-x-4 top-4 h-1.5 rounded-full bg-white/30" />
            <span className="absolute inset-x-4 top-8 h-1.5 w-2/3 rounded-full bg-white/20" />
            <span className="absolute inset-x-4 bottom-4 h-9 rounded-xl bg-white/15 ring-1 ring-white/25" />
          </div>
        )}
      </div>
    </div>
  );
}

function ProductVisualInner({
  image,
  alt,
  accent,
  colors,
  view,
  name,
  highlights,
  className,
  priority,
  rounded = 'rounded-2xl',
}: ProductVisualProps) {
  if (image?.url) {
    return (
      <div className={cn('relative overflow-hidden bg-surface-50', rounded, className)}>
        <Image
          src={image.url}
          alt={image.alt || alt}
          fill
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 320px"
          className="object-contain p-4 transition-transform duration-700 ease-premium"
        />
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden', rounded, className)}
      style={{
        background: `radial-gradient(120% 90% at 50% 0%, ${accent}14 0%, #F7F8FC 55%, #EEF0F7 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-[18%] bottom-[12%] h-4 rounded-[50%] blur-xl"
        style={{ background: `${accent}33` }}
        aria-hidden="true"
      />
      <PhoneRender
        accent={accent}
        colors={colors}
        view={view}
        name={name ?? alt}
        highlights={highlights}
      />
    </div>
  );
}

export const ProductVisual = memo(ProductVisualInner);
export { AccessoryRender as AccessoryVisual };
