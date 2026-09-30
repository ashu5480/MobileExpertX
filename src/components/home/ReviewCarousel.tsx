'use client';

import { m } from 'framer-motion';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Gift,
  Quote,
  ShoppingBag,
  Wrench,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Rating } from '@/components/ui/Rating';
import { Avatar } from '@/components/ui/Avatar';
import { testimonials } from '@/data/testimonials';
import { cn } from '@/lib/utils';
import { fadeUp, viewportOnce } from '@/lib/motion';
const SERVICE_ICONS = {
  purchase: ShoppingBag,
  sell: ArrowLeftRight,
  repair: Wrench,
  accessories: Gift,
} as const;
const SERVICE_LABELS = {
  purchase: 'Purchase',
  sell: 'Trade-in',
  repair: 'Repair',
  accessories: 'Accessories',
} as const;
/**
 * Testimonial carousel.
 *
 * Built on native scroll-snap rather than a JS transform loop: the browser
 * handles the physics, it works with touch and a trackpad, keyboard scrolling
 * works for free, and there is no rAF loop burning battery.
 */
export function ReviewCarousel() {
  const railRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const updateEdges = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 8);
  }, []);
  useEffect(() => {
    updateEdges();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, [updateEdges]);
  const scrollByCard = (direction: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector('li');
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction, behavior: 'smooth' });
  };
  return (
    <section className="section bg-surface-50" aria-labelledby="reviews-heading">
      <div className="container">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="reviews-heading"
            eyebrow="Customer reviews"
            title="What people actually say"
            description="4.8 out of 5 from more than 1,800 verified purchases and service bookings."
            className="flex-1"
          />
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={atStart}
              aria-label="Previous reviews"
              className="grid h-11 w-11 place-items-center rounded-xl border border-surface-300 bg-white text-ink-700 transition-all hover:border-brand-300 hover:text-brand-600 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={atEnd}
              aria-label="Next reviews"
              className="grid h-11 w-11 place-items-center rounded-xl border border-surface-300 bg-white text-ink-700 transition-all hover:border-brand-300 hover:text-brand-600 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <m.ul
          ref={railRef}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="scroll-rail mask-fade-x mt-10 snap-x snap-mandatory"
          aria-label="Customer testimonials"
        >
          {testimonials.map((t) => {
            const Icon = SERVICE_ICONS[t.service];
            return (
              <li
                key={t.id}
                className="w-[85vw] max-w-[380px] shrink-0 snap-start sm:w-[400px]"
              >
                <figure className="flex h-full flex-col rounded-3xl border border-surface-200 bg-white p-6 shadow-soft transition-shadow duration-400 hover:shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <Rating value={t.rating} size={15} />
                    <Quote className="h-7 w-7 shrink-0 text-surface-300" aria-hidden="true" />
                  </div>
                  <blockquote className="mt-4 flex-1">
                    <p className="text-[15px] leading-relaxed text-ink-700">“{t.review}”</p>
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-surface-200 pt-5">
                    <Avatar name={t.name} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink-900">{t.name}</p>
                      <p className="truncate text-xs text-ink-500">{t.location}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-500/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-600">
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {SERVICE_LABELS[t.service]}
                    </span>
                  </figcaption>
                  <p className="mt-3 truncate text-[11px] text-ink-400">{t.purchased}</p>
                </figure>
              </li>
            );
          })}
        </m.ul>
      </div>
    </section>
  );
}
