import type { Testimonial } from '@/types';

/** Home-page carousel content, spanning all four service lines. */
export const testimonials: Testimonial[] = [
  {
    id: 't-1',
    name: 'Rohan Mehta',
    location: 'Mumbai',
    avatarSeed: 'Rohan Mehta',
    rating: 5,
    review:
      'I compared the Galaxy S24 Ultra across four sites and MobilExpertX was the best price by a clear margin. The WhatsApp chat confirmed stock within minutes and the phone arrived sealed the next evening. This is how phone shopping should work.',
    purchased: 'Samsung Galaxy S24 Ultra · 256 GB',
    service: 'purchase',
  },
  {
    id: 't-2',
    name: 'Priya Deshmukh',
    location: 'Pune',
    avatarSeed: 'Priya Deshmukh',
    rating: 5,
    review:
      'Sold my two-year-old Pixel through them and the quote was exactly what the tool had estimated — not lower, which is rare. Cash in hand the same day. I have since sent two colleagues.',
    purchased: 'Sold Google Pixel 6 · 128 GB',
    service: 'sell',
  },
  {
    id: 't-3',
    name: 'Karan Shah',
    location: 'Vadodara',
    avatarSeed: 'Karan Shah',
    rating: 5,
    review:
      'My display was shattered and I expected a multi-day wait. They replaced it in four hours, showed me the old panel first, and charged exactly what was quoted. Genuinely impressed.',
    purchased: 'Repair — Screen Replacement',
    service: 'repair',
  },
  {
    id: 't-4',
    name: 'Sneha Kulkarni',
    location: 'Surat',
    avatarSeed: 'Sneha Kulkarni',
    rating: 5,
    review:
      'Bought a refurbished Galaxy S23 and honestly it feels better than my friend’s two-year-old new phone. New battery, original box, 90-day warranty. Fully transparent about the condition.',
    purchased: 'Samsung Galaxy S23 · 128 GB',
    service: 'purchase',
  },
  {
    id: 't-5',
    name: 'Arjun Nair',
    location: 'Bengaluru',
    avatarSeed: 'Arjun Nair',
    rating: 4,
    review:
      'The accessories are genuinely good, not the thin junk you find elsewhere. The 100W charger actually fast charges my phone. Shipping took two days to Bengaluru, which is fair.',
    purchased: '100W GaN Charger + Rugged Case',
    service: 'accessories',
  },
  {
    id: 't-6',
    name: 'Ananya Reddy',
    location: 'Hyderabad',
    avatarSeed: 'Ananya Reddy',
    rating: 5,
    review:
      'The refurbishment quality is what won me over. I inspected the phone under their desk lights and they explained every scratch honestly. Zero pressure to buy, which I really appreciated.',
    purchased: 'Apple iPhone 15 · 128 GB',
    service: 'purchase',
  },
  {
    id: 't-7',
    name: 'Meera Joshi',
    location: 'Nashik',
    avatarSeed: 'Meera Joshi',
    rating: 5,
    review:
      'They repaired my phone battery and explained what had actually degraded instead of just selling me a new one. That honesty is why I keep going back for all my family’s devices.',
    purchased: 'Repair — Battery Replacement',
    service: 'repair',
  },
  {
    id: 't-8',
    name: 'Vikram Singh',
    location: 'Jaipur',
    avatarSeed: 'Vikram Singh',
    rating: 5,
    review:
      'Traded in my old phone and upgraded in one visit. The trade-in value was on screen, agreed in five minutes, and the discount was applied straight to the new device. Zero friction.',
    purchased: 'Trade-in → OnePlus 12',
    service: 'sell',
  },
];
