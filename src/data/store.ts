import type { Coupon, DeliveryMethod } from '@/types';

/* ── Coupons ────────────────────────────────────────────────────────────── */
/** Values in paise for `fixed`, percentage points for `percentage`. */
export const coupons: Coupon[] = [
  {
    code: 'MEXNEW10',
    type: 'percentage',
    value: 10,
    minCartPaise: 1000000,
    maxDiscountPaise: 500000,
    description: '10% off your first phone purchase (up to ₹5,000)',
    expiresAt: '2027-12-31',
    active: true,
  },
  {
    code: 'UPGRADE15',
    type: 'percentage',
    value: 15,
    minCartPaise: 2000000,
    maxDiscountPaise: 1000000,
    description: '15% off when you trade in your old phone (up to ₹10,000)',
    expiresAt: '2027-12-31',
    active: true,
  },
  {
    code: 'REPAIR500',
    type: 'fixed',
    value: 50000,
    minCartPaise: 0,
    description: '₹500 off any repair booking above ₹2,000',
    expiresAt: '2027-12-31',
    active: true,
  },
  {
    code: 'FREESHIP',
    type: 'fixed',
    value: 9900,
    minCartPaise: 0,
    description: 'Waives the standard delivery fee entirely',
    expiresAt: '2027-12-31',
    active: true,
  },
  {
    code: 'EXPIRED',
    type: 'percentage',
    value: 99,
    minCartPaise: 0,
    description: 'Test coupon — always expired',
    expiresAt: '2020-01-01',
    active: false,
  },
];

/* ── Delivery methods ───────────────────────────────────────────────────── */

export const deliveryMethods: DeliveryMethod[] = [
  {
    id: 'standard',
    label: 'Standard Delivery',
    description: 'Reliable 2–4 working day delivery with tracking.',
    eta: '2–4 business days',
    pricePaise: 9900,
    freeAbovePaise: 499900,
    icon: 'truck',
  },
  {
    id: 'express',
    label: 'Express Delivery',
    description: 'Priority dispatch — order before 4 PM, out the same day.',
    eta: 'Next business day',
    pricePaise: 24900,
    freeAbovePaise: 1999900,
    icon: 'zap',
  },
  {
    id: 'pickup',
    label: 'Store Pickup',
    description: 'Collect from our Ahmedabad store, ready in 2 hours.',
    eta: 'Ready in 2 hours',
    pricePaise: 0,
    icon: 'store',
  },
];

/* ── FAQ content (also emitted as FAQPage JSON-LD) ───────────────────────── */

export const faqs = [
  {
    q: 'Are the refurbished phones genuine?',
    a: 'Yes. Every refurbished device is Grade-A: a genuine or OEM-grade display and battery, a fully wiped data partition, a zeroed activation lock, and a completed 42-point inspection. We never sell B-grade stock, and the exact battery health of every unit is published on its product page before you buy.',
  },
  {
    q: 'How does the sell-my-phone valuation work?',
    a: 'You tell us the brand, model, storage, overall condition, screen, battery and body condition, what accessories you have and how old the phone is. We apply our market model to produce an estimated value instantly, then confirm it with a free in-person inspection. The confirmed quote is the value you receive — we do not reduce it after inspection unless we find something materially different from what you declared.',
  },
  {
    q: 'How long does a typical repair take?',
    a: 'Screen and battery replacements are same-day, usually 1 to 4 hours. Charging port, speaker, microphone and camera work is typically 1 to 3 hours. Water damage and motherboard-level work require inspection first and generally take 2 to 5 days. You will get an exact timeframe when you book.',
  },
  {
    q: 'What warranty comes with a repair?',
    a: 'Screen repairs carry 90 days on the fitted panel, battery replacements 6 months, board-level work 6 months, and most other repairs 3 months. If the same fault returns within that window the repair is redone at no charge.',
  },
  {
    q: 'Which payment methods do you accept?',
    a: 'UPI, all major credit and debit cards, net banking and wallet payments through a PCI-compliant payment gateway, plus cash on delivery and cash at the store. Payment details are handled entirely by the gateway — card numbers never touch our servers.',
  },
  {
    q: 'Do you deliver outside Ahmedabad?',
    a: 'Yes, we deliver across India. Delivery is free on standard shipping for orders above ₹4,999, and express delivery is available on most PIN codes for a small additional fee. You can also collect in person from the store at no extra cost.',
  },
  {
    q: 'Can I exchange a phone I bought from you?',
    a: 'Within 7 days of delivery, provided the device is in original condition with all accessories, we offer a return or an exchange to another device at the current price. Refurbished and accessory purchases are covered by a 7-day replacement window for manufacturing defects.',
  },
  {
    q: 'Is my personal data safe when I sell my phone?',
    a: 'We factory-reset every device on receipt, and our warranty is void if an activation lock is found. If you would rather do it yourself, we will wait while you erase it in front of our technician before completing the handover.',
  },
];

/* ── Company stats for the trust band ───────────────────────────────────── */

export const companyStats = [
  { value: '12,400+', label: 'Phones sold' },
  { value: '8,900+', label: 'Devices bought back' },
  { value: '15,000+', label: 'Repairs completed' },
  { value: '4.8/5', label: 'Average rating' },
];
