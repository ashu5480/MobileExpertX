/**
 * Sell-Your-Phone domain data.
 *
 * `base` is the notional resale value in paise at a reference condition
 * (Like New, all hardware working, 6 months old, 128 GB, no box).
 * `src/lib/sellPricing.ts` applies multipliers for storage, overall
 * condition, screen, battery, body, accessories, box and age.
 *
 * These are realistic Indian market estimates. For production accuracy,
 * point the estimator at a live re-commerce pricing API via
 * `NEXT_PUBLIC_SELL_PRICING_API_URL`.
 */

export interface SellModel {
  name: string;
  /** Base value in paise at the reference condition. */
  base: number;
  /** Purchase-age options (in years) that make sense for this model. */
  years: number[];
}

export interface SellBrand {
  name: string;
  slug: string;
  models: SellModel[];
}

export const sellBrands: SellBrand[] = [
  {
    name: 'Apple',
    slug: 'apple',
    models: [
      { name: 'iPhone 15 Pro Max', base: 11000000, years: [0, 1, 2, 3, 4] },
      { name: 'iPhone 15 Pro', base: 9500000, years: [0, 1, 2, 3, 4] },
      { name: 'iPhone 15', base: 6800000, years: [1, 2, 3, 4] },
      { name: 'iPhone 14 Pro', base: 6400000, years: [1, 2, 3, 4, 5] },
      { name: 'iPhone 14', base: 4800000, years: [1, 2, 3, 4, 5] },
      { name: 'iPhone 13 Pro', base: 5200000, years: [2, 3, 4, 5] },
      { name: 'iPhone 13', base: 3600000, years: [2, 3, 4, 5] },
      { name: 'iPhone 12', base: 2600000, years: [3, 4, 5, 6] },
      { name: 'iPhone 11', base: 1900000, years: [4, 5, 6, 7] },
      { name: 'iPhone SE (3rd gen)', base: 1500000, years: [3, 4, 5] },
    ],
  },
  {
    name: 'Samsung',
    slug: 'samsung',
    models: [
      { name: 'Galaxy S24 Ultra', base: 9800000, years: [0, 1, 2] },
      { name: 'Galaxy S24', base: 6200000, years: [0, 1, 2] },
      { name: 'Galaxy S23 Ultra', base: 5200000, years: [1, 2, 3] },
      { name: 'Galaxy S23', base: 3400000, years: [1, 2, 3, 4] },
      { name: 'Galaxy S22 Ultra', base: 3800000, years: [2, 3, 4, 5] },
      { name: 'Galaxy S22', base: 2200000, years: [2, 3, 4, 5] },
      { name: 'Galaxy A55 5G', base: 2800000, years: [0, 1, 2] },
      { name: 'Galaxy A54', base: 1800000, years: [1, 2, 3, 4] },
      { name: 'Galaxy A34', base: 1500000, years: [1, 2, 3, 4] },
      { name: 'Galaxy M35 5G', base: 1400000, years: [0, 1, 2] },
      { name: 'Galaxy Z Flip 5', base: 3600000, years: [0, 1, 2] },
    ],
  },
  {
    name: 'Xiaomi',
    slug: 'xiaomi',
    models: [
      { name: 'Xiaomi 14', base: 4600000, years: [0, 1, 2] },
      { name: 'Xiaomi 14 Ultra', base: 6200000, years: [0, 1, 2] },
      { name: 'Redmi Note 13 Pro', base: 1300000, years: [0, 1, 2, 3] },
      { name: 'Redmi Note 13', base: 950000, years: [0, 1, 2, 3] },
      { name: 'Redmi 13', base: 700000, years: [0, 1, 2, 3] },
      { name: 'Redmi 12', base: 550000, years: [0, 1, 2, 3] },
      { name: 'Poco X6 Pro', base: 1900000, years: [0, 1, 2, 3] },
      { name: 'Poco C55', base: 480000, years: [0, 1, 2] },
    ],
  },
  {
    name: 'OnePlus',
    slug: 'oneplus',
    models: [
      { name: 'OnePlus 12', base: 5600000, years: [0, 1, 2] },
      { name: 'OnePlus 11R', base: 2800000, years: [1, 2, 3] },
      { name: 'OnePlus Nord 4', base: 2200000, years: [0, 1, 2] },
      { name: 'OnePlus Nord CE 3', base: 1700000, years: [1, 2, 3] },
      { name: 'OnePlus 10R', base: 1900000, years: [2, 3, 4] },
      { name: 'OnePlus 9 Pro', base: 1600000, years: [3, 4, 5] },
    ],
  },
  {
    name: 'realme',
    slug: 'realme',
    models: [
      { name: 'realme 12 Pro+ 5G', base: 2100000, years: [0, 1, 2] },
      { name: 'realme 12 Pro', base: 1700000, years: [0, 1, 2] },
      { name: 'realme 12 5G', base: 1400000, years: [0, 1, 2] },
      { name: 'realme 11 Pro+', base: 1600000, years: [1, 2, 3] },
      { name: 'realme Narzo 70', base: 1000000, years: [0, 1, 2] },
      { name: 'realme C55', base: 520000, years: [0, 1, 2, 3] },
    ],
  },
  {
    name: 'Vivo',
    slug: 'vivo',
    models: [
      { name: 'vivo V30 Pro', base: 6000000, years: [0, 1, 2] },
      { name: 'vivo V29', base: 2600000, years: [0, 1, 2] },
      { name: 'vivo Y200', base: 1900000, years: [0, 1, 2] },
      { name: 'vivo V27', base: 2400000, years: [1, 2, 3] },
      { name: 'vivo Y100', base: 1100000, years: [1, 2, 3] },
      { name: 'vivo T3x', base: 850000, years: [0, 1, 2] },
    ],
  },
  {
    name: 'OPPO',
    slug: 'oppo',
    models: [
      { name: 'OPPO Reno12', base: 1900000, years: [0, 1, 2] },
      { name: 'OPPO Reno11', base: 1800000, years: [1, 2, 3] },
      { name: 'OPPO Reno10', base: 1600000, years: [2, 3, 4] },
      { name: 'OPPO F27', base: 1500000, years: [0, 1, 2] },
      { name: 'OPPO A79', base: 1000000, years: [0, 1, 2, 3] },
    ],
  },
  {
    name: 'Google',
    slug: 'google',
    models: [
      { name: 'Pixel 8 Pro', base: 6600000, years: [0, 1, 2] },
      { name: 'Pixel 8', base: 4800000, years: [0, 1, 2] },
      { name: 'Pixel 8a', base: 3000000, years: [0, 1, 2] },
      { name: 'Pixel 7 Pro', base: 3400000, years: [1, 2, 3] },
      { name: 'Pixel 7a', base: 2000000, years: [1, 2, 3] },
      { name: 'Pixel 6a', base: 1200000, years: [2, 3, 4] },
    ],
  },
  {
    name: 'Nothing',
    slug: 'nothing',
    models: [
      { name: 'Nothing Phone (2)', base: 2800000, years: [0, 1, 2, 3] },
      { name: 'Nothing Phone (2a)', base: 1900000, years: [0, 1, 2] },
      { name: 'Nothing Phone (1)', base: 1500000, years: [2, 3, 4] },
    ],
  },
  {
    name: 'Motorola',
    slug: 'motorola',
    models: [
      { name: 'motorola edge 50 ultra', base: 2500000, years: [0, 1, 2] },
      { name: 'motorola edge 50 fusion', base: 1900000, years: [0, 1, 2] },
      { name: 'motorola razr 40 ultra', base: 3600000, years: [1, 2, 3] },
      { name: 'motorola Edge 40', base: 1600000, years: [2, 3, 4] },
      { name: 'motorola G84', base: 900000, years: [0, 1, 2, 3] },
    ],
  },
  {
    name: 'Other / Not listed',
    slug: 'other',
    models: [{ name: 'Other device', base: 100000, years: [0, 1, 2, 3, 4, 5, 6, 7] }],
  },
];

/* ── Option lists driving the wizard ────────────────────────────────────── */

export const sellStorages = ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'];

export const sellConditions = [
  { value: 'like-new', label: 'Like New', hint: 'No scratches, works perfectly' },
  { value: 'good', label: 'Good', hint: 'Light signs of use, no damage' },
  { value: 'fair', label: 'Fair', hint: 'Visible scratches, works fine' },
  { value: 'broken', label: 'Not Working / Broken', hint: 'Does not power on or faulty' },
] as const;

export const sellScreenConditions = [
  { value: 'perfect', label: 'Pristine', hint: 'No cracks or marks' },
  { value: 'minor', label: 'Minor marks', hint: 'Hairline scratches' },
  { value: 'cracked', label: 'Cracked', hint: 'Cracks but display works' },
  { value: 'broken', label: 'Broken / Dead', hint: 'Unresponsive or shattered' },
] as const;

export const sellBatteryConditions = [
  { value: 'new', label: '100% / New', hint: 'Recently replaced' },
  { value: 'healthy', label: 'Healthy (85%+)', hint: 'Normal daily use' },
  { value: 'worn', label: 'Worn (70–84%)', hint: 'Noticeable drop' },
  { value: 'poor', label: 'Poor (<70%)', hint: 'Needs replacement' },
] as const;

export const sellBodyConditions = [
  { value: 'pristine', label: 'Pristine', hint: 'No dents or marks' },
  { value: 'minor', label: 'Minor scuffs', hint: 'Corner scuffs' },
  { value: 'damaged', label: 'Dents / Cracks', hint: 'Visible body damage' },
] as const;

export const sellAccessoryOptions = [
  'Original box',
  'Charger',
  'USB cable',
  'SIM ejector',
  'Case / cover',
  'Screen protector',
  'Earbuds',
  'Warranty card',
];

/**
 * The three-phase shape of the sell journey, matching how the process is
 * explained on the page: describe the phone → see price and grade → book the
 * free pickup. Lives here rather than next to the wizard because `/sell-phone`
 * renders it from a server component.
 */
export const sellPhases = [
  {
    id: 1,
    title: 'Tell us about your phone',
    blurb: 'Brand, model and condition — it takes about a minute.',
  },
  {
    id: 2,
    title: 'See your price',
    blurb: 'An instant valuation with the grade we would assign it.',
  },
  {
    id: 3,
    title: 'Book your free pickup',
    blurb: 'Pick a slot and get paid at your door.',
  },
] as const;

export const sellPurchaseAges = [
  { value: '0-6', label: 'Under 6 months' },
  { value: '6-12', label: '6 – 12 months' },
  { value: '12-24', label: '1 – 2 years' },
  { value: '24-36', label: '2 – 3 years' },
  { value: '36-48', label: '3 – 4 years' },
  { value: '48+', label: 'More than 4 years' },
] as const;

export const pickupTimeSlots = [
  '10:00 AM – 12:00 PM',
  '12:00 PM – 2:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
  '6:00 PM – 8:00 PM',
];

