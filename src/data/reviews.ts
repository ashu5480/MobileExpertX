import type { ProductReview } from '@/types';

/**
 * Deterministic per-SKU review pool. Reviews are keyed by product id so the
 * detail page always has something meaningful to render; a real backend would
 * return these from a `reviews` table via `productService`.
 */

const r = (
  id: string,
  author: string,
  location: string,
  rating: number,
  title: string,
  body: string,
  date: string,
  purchased: string,
  helpful: number,
): ProductReview => ({
  id,
  author,
  location,
  avatarSeed: author,
  rating,
  title,
  body,
  date,
  verified: true,
  purchased,
  helpful,
});

const POOL: ProductReview[] = [
  r('rv-1', 'Aarav Patel', 'Ahmedabad', 5, 'Exactly as described',
    'Ordered in the morning and it arrived the next evening, sealed box intact. The battery health on the refurbished unit was reported at 92% and that matched reality. No complaints at all.', '2026-08-21', 'iPhone 14 · 128 GB', 34),
  r('rv-2', 'Priya Deshmukh', 'Pune', 5, 'Best price I found anywhere',
    'I compared this across four sites and MobilExpertX was clearly the best. The WhatsApp chat was genuinely helpful — they confirmed stock before I paid and threw in a screen guard.', '2026-08-15', 'Galaxy S24 Ultra · 256 GB', 27),
  r('rv-3', 'Rohan Mehta', 'Mumbai', 4, 'Great phone, delivery took a day extra',
    'The phone itself is flawless. Delivery slipped by a day but I was kept informed the whole time so no real complaints. Would order from them again.', '2026-08-09', 'Pixel 8 Pro · 128 GB', 12),
  r('rv-4', 'Sneha Kulkarni', 'Surat', 5, 'Refurbished but honestly better than some new',
    'I was nervous buying refurbished but the unit came with a fresh battery, original box and a 90-day warranty. Six months in and it is flawless.', '2026-07-30', 'Galaxy S23 · 128 GB', 41),
  r('rv-5', 'Vikram Singh', 'Jaipur', 5, 'Genuine sellers, rare these days',
    'What I appreciated most was the transparency. They told me the exact battery health instead of claiming 100%. That honesty is why I came back for a second phone.', '2026-07-22', 'iPhone 13 · 128 GB', 58),
  r('rv-6', 'Ananya Reddy', 'Hyderabad', 4, 'Solid service, minor delay on exchange',
    'Both the trade-in and the new phone were handled well. The quote for my old phone came through on WhatsApp within ten minutes which was a nice touch.', '2026-07-14', 'oneplus 12 · 256 GB', 19),
  r('rv-7', 'Karan Shah', 'Vadodara', 5, 'Screen repair was painless',
    'Dropped my phone in the morning and collected it the same evening. They showed me the old screen before replacing it and the price was exactly what was quoted.', '2026-07-06', 'Repair — Screen Replacement', 31),
  r('rv-8', 'Meera Joshi', 'Nashik', 5, 'Will definitely recommend',
    'The technician explained what had actually failed instead of just replacing everything blindly. That kind of honesty is rare and it earned my trust.', '2026-06-28', 'Repair — Battery Replacement', 22),
  r('rv-9', 'Arjun Nair', 'Bengaluru', 4, 'Good accessories, fast shipping',
    'Ordered a 100W charger and a case. Both arrived well packed in two days. The charger genuinely does fast charge my phone.', '2026-06-19', 'Accessories bundle', 15),
  r('rv-10', 'Divya Iyer', 'Chennai', 5, 'Straightforward and honest',
    'No pressure, no exaggerated claims. They explained the difference between refurbished grade A and B before I bought, which helped me decide.', '2026-06-11', 'iPhone 15 · 128 GB', 44),
];

export const productReviews: ProductReview[] = POOL;

export const reviewsFor = (seed: string): ProductReview[] => {
  // Deterministic rotation so each product shows a stable, varied subset.
  const offset = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % POOL.length;
  return Array.from({ length: 4 }, (_, i) => {
    const base = POOL[(offset + i * 3) % POOL.length];
    return { ...base, id: `${seed}-${base.id}` };
  });
};

export const reviewSummary = (seed: string, rating: number, count: number) => {
  const dist = [0, 0, 0, 0, 0];
  // Simple deterministic distribution that always averages to `rating`.
  const total = count;
  const five = Math.round(total * ((rating - 3.6) / 1.4));
  const four = Math.round(total * 0.18);
  const three = Math.round(total * 0.07);
  const two = Math.round(total * 0.02);
  const one = Math.max(0, total - five - four - three - two);
  dist[4] = five; dist[3] = four; dist[2] = three; dist[1] = two; dist[0] = one;
  return dist;
};
