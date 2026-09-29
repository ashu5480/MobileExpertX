export interface Policy {
  slug: string;
  title: string;
  updated: string;
  summary: string;
  sections: Array<{ heading: string; body: string[] }>;
}

/**
 * Policy copy lives here rather than inside the route so the page component
 * stays small and the content can be swapped for a CMS later without touching
 * the rendering logic.
 */
export const policies: Policy[] = [
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    updated: '1 September 2026',
    summary: 'What personal data we collect, why we collect it, and the choices you have.',
    sections: [
      {
        heading: 'What we collect',
        body: [
          'Contact details you give us when you buy, sell, book a repair or message us — your name, phone number, email and delivery address.',
          'Device details for trade-ins and repairs: brand, model, storage, condition and any photos you provide.',
          'Order and payment records. Card numbers are never handled by us — they are entered on the payment gateway and we only receive a payment reference and a status.',
        ],
      },
      {
        heading: 'How we use it',
        body: [
          'To fulfil orders, arrange pickups and repairs, and to contact you about those things.',
          'To send order updates and, if you opt in, occasional offers. You can unsubscribe at any time.',
          'To meet our tax and accounting obligations.',
        ],
      },
      {
        heading: 'What we never do',
        body: [
          'We do not sell or rent your personal data to anyone.',
          'We do not store card numbers, CVV codes or UPI credentials.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'You can ask for a copy of the data we hold, ask us to correct it, or ask us to delete it. Email us and we respond within 30 days.',
          'Trade-in devices are factory-reset before they leave our store, and we delete your submitted photos on request once the transaction is complete.',
        ],
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms & Conditions',
    updated: '1 September 2026',
    summary: 'The rules that govern the use of this site and purchases from us.',
    sections: [
      {
        heading: 'Orders and pricing',
        body: [
          'All prices are in Indian Rupees and include GST unless stated otherwise.',
          'An order is a request to buy. The contract forms when we confirm dispatch by email or WhatsApp.',
          'We may cancel and fully refund an order if a pricing error is obvious, or if stock is mis-listed.',
        ],
      },
      {
        heading: 'Device condition',
        body: [
          'Refurbished devices are Grade-A: new or genuine-grade battery, calibrated display, factory data wipe and a 42-point inspection. Exact battery health is published on each product page.',
          'Valuations are not binding until a physical inspection is complete, but we honour any confirmed quote.',
        ],
      },
      {
        heading: 'Acceptable use',
        body: [
          'Do not access the site without authorisation, scrape it at scale, or use it to place fraudulent orders.',
        ],
      },
    ],
  },
  {
    slug: 'refund',
    title: 'Refund Policy',
    updated: '1 September 2026',
    summary: 'How returns, replacements and refunds work.',
    sections: [
      {
        heading: '7-day return window',
        body: [
          'New devices can be returned within 7 days of delivery in original condition with all accessories and packaging. Refurbished devices have a 7-day replacement window for manufacturing defects.',
          'Refunds are issued to the original payment method within 5–7 business days of us receiving and inspecting the device.',
        ],
      },
      {
        heading: 'What we cannot accept',
        body: [
          'Physical damage, liquid damage, or data loss caused after delivery.',
          'Devices with an activation lock still signed in to an Apple or Google account.',
          'Change of mind on accessories once the seal is broken, unless faulty.',
        ],
      },
      {
        heading: 'Wrong or damaged on arrival',
        body: [
          'Message us within 48 hours with photos. We replace it immediately at our cost, including return shipping.',
        ],
      },
    ],
  },
  {
    slug: 'shipping',
    title: 'Shipping Policy',
    updated: '1 September 2026',
    summary: 'Delivery timelines, costs and tracking.',
    sections: [
      {
        heading: 'Timelines',
        body: [
          'Standard delivery: 2–4 business days after dispatch.',
          'Express delivery: next business day for orders placed before 4 PM.',
          'Store pickup: ready in about 2 hours during opening hours.',
        ],
      },
      {
        heading: 'Charges',
        body: [
          'Free standard delivery on orders above ₹4,999. Below that it is ₹99.',
          'Express delivery is ₹249, free above ₹19,999.',
          'Store pickup is always free.',
        ],
      },
      {
        heading: 'Tracking',
        body: [
          'We send tracking updates on WhatsApp to the number used for the order.',
          'If a parcel is delayed beyond the promised window, message us and we dispatch a replacement rather than making you chase it.',
        ],
      },
    ],
  },
  {
    slug: 'warranty',
    title: 'Warranty Policy',
    updated: '1 September 2026',
    summary: 'Manufacturer warranties on new devices, and our repair warranties.',
    sections: [
      {
        heading: 'New devices',
        body: [
          'Every new device carries its full manufacturer warranty in India, handled through the brand with you as the purchaser.',
          'Keep the invoice — we send it by email with your order confirmation.',
        ],
      },
      {
        heading: 'Refurbished devices',
        body: [
          'A 90-day MobilExpertX assurance warranty covering the battery, display and any fault present at the point of sale.',
          'If the same fault returns within that window, we replace or refund it in full.',
        ],
      },
      {
        heading: 'Repairs',
        body: [
          'Screen: 90 days. Battery: 6 months. Board-level work: 6 months. Most other repairs: 3 months.',
          'A repeat of the same fault within the warranty period is redone at no charge.',
        ],
      },
      {
        heading: 'Not covered',
        body: [
          'Physical or liquid damage after the repair, or damage caused by unauthorised third-party work.',
        ],
      },
    ],
  },
];

export const policyBySlug = (slug: string) => policies.find((p) => p.slug === slug);

