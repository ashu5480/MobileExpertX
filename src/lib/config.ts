/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MobilExpertX — Central Site Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every WhatsApp number, phone number, email, address and payment-gateway
 *  setting is read from environment variables here. NEVER hardcode these values
 *  in components — always import from `@/lib/config`.
 *
 *  Server-only secrets are read through `serverConfig` and must only be
 *  imported inside server code (route handlers), never in "use client" files.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const num = (value: string | undefined, fallback: string): string => {
  const v = (value ?? '').trim();
  return v.length > 0 ? v : fallback;
};

/** Strips every non-digit character — required by wa.me / tel: URLs. */
export const digitsOnly = (value: string): string => value.replace(/\D/g, '');

/** Builds an international wa.me URL with a pre-filled, encoded message. */
export function buildWhatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${digitsOnly(number)}?text=${encodeURIComponent(message)}`;
}

/** Builds a `tel:` URI (optionally prefilling the dialer with a message). */
export function buildTelUrl(number: string, encodedMessage?: string): string {
  const tel = `tel:${digitsOnly(number)}`;
  return encodedMessage ? `${tel}?calltext=${encodeURIComponent(encodedMessage)}` : tel;
}

/** Strips a leading + / country code so links dial correctly everywhere. */
function dialableNumber(raw: string): string {
  const d = digitsOnly(raw);
  return d.startsWith('0') ? d.slice(1) : d;
}

const rawWhatsApp = num(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER, '919716216480');
const rawPhone = num(process.env.NEXT_PUBLIC_CONTACT_PHONE, rawWhatsApp);
const rawRepair = num(process.env.NEXT_PUBLIC_REPAIR_PHONE, rawPhone);

export const siteConfig = {
  name: 'MobilExpertX',
  legalName: 'MobilExpertX Technologies',
  /** Founder / point of contact, shown on the contact and about pages. */
  ownerName: num(process.env.NEXT_PUBLIC_OWNER_NAME, 'Ishak Khan'),
  tagline: 'Your Phone. Your Upgrade. Your Expert.',
  description:
    'Buy premium smartphones, sell your old device, get expert repairs, and shop genuine accessories — all in one place.',
  shortDescription:
    'Premium smartphones, honest trade-in value, expert repairs and genuine accessories.',
  url: num(process.env.NEXT_PUBLIC_SITE_URL, 'https://mobilexpertx.com'),
  locale: 'IN',
  currency: 'INR',
  currencySymbol: '₹',

  /* ── Contact channels (all env-driven) ─────────────────────────────── */
  contact: {
    /** E.164 digits, e.g. 919716216480 — used for wa.me deep links. */
    whatsapp: digitsOnly(rawWhatsApp),
    whatsappDisplay: rawWhatsApp,
    /** Sales / general support line. */
    phone: rawPhone,
    phoneDisplay: rawPhone,
    phoneDialable: dialableNumber(rawPhone),
    /** Dedicated repair desk line. */
    repairPhone: rawRepair,
    repairPhoneDisplay: rawRepair,
    repairPhoneDialable: dialableNumber(rawRepair),
    email: num(process.env.NEXT_PUBLIC_CONTACT_EMAIL, 'hello@mobilexpertx.com'),
    supportEmail: num(
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
      'support@mobilexpertx.com',
    ),
  },

  /**
   * Business address.
   *
   * Every field defaults to an EMPTY string, so a shop that has not published a
   * storefront address yet simply does not show one — the UI and the JSON-LD
   * both check `hasAddress` first. Fill in `NEXT_PUBLIC_ADDRESS_*` in `.env.local`
   * to put it back.
   */
  address: {
    line1: num(process.env.NEXT_PUBLIC_ADDRESS_LINE1, ''),
    line2: num(process.env.NEXT_PUBLIC_ADDRESS_LINE2, ''),
    city: num(process.env.NEXT_PUBLIC_CITY, ''),
    state: num(process.env.NEXT_PUBLIC_STATE, ''),
    postalCode: num(process.env.NEXT_PUBLIC_PINCODE, ''),
    /** Country stays populated: it drives "area served" and return policies. */
    country: num(process.env.NEXT_PUBLIC_COUNTRY, 'India'),
    countryCode: num(process.env.NEXT_PUBLIC_COUNTRY_CODE, 'IN'),
  },

  hours: {
    weekday: num(
      process.env.NEXT_PUBLIC_HOURS_WEEKDAY,
      'Mon – Sat · 10:00 AM – 8:00 PM',
    ),
    sunday: num(process.env.NEXT_PUBLIC_HOURS_SUNDAY, 'Sunday · 11:00 AM – 6:00 PM'),
    display: num(
      process.env.NEXT_PUBLIC_HOURS_DISPLAY,
      'Mon – Sat 10am – 8pm · Sun 11am – 6pm',
    ),
  },

  social: {
    instagram: num(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM, 'mobilexpertx'),
    facebook: num(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK, 'mobilexpertx'),
    youtube: num(process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE, '@mobilexpertx'),
    x: num(process.env.NEXT_PUBLIC_SOCIAL_X, 'mobilexpertx'),
  },

  /**
   * Payment gateway — PUBLIC (browser-safe) settings only.
   * The publishable key / client token is safe to ship. Secrets are NOT here.
   */
  payments: {
    provider: num(process.env.NEXT_PUBLIC_PAYMENT_PROVIDER, 'mock') as
      | 'razorpay'
      | 'stripe'
      | 'mock',
    currency: num(process.env.NEXT_PUBLIC_PAYMENT_CURRENCY, 'INR'),
    razorpayKeyId: num(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, ''),
    stripePublishableKey: num(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, ''),
  },

  /** Free-shipping threshold in paise (minor unit) — used by the cart engine. */
  freeShippingThresholdPaise: Number(
    process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_PAISE ?? '499900',
  ),
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 *  Address helpers
 *  The storefront address is optional. UI and structured data both check
 *  `hasAddress` so nothing renders an empty block or a blank PostalAddress.
 * ──────────────────────────────────────────────────────────────────────────── */

/** True when at least one street/city line is configured. */
export const hasAddress: boolean = Boolean(
  siteConfig.address.line1 || siteConfig.address.city,
);

/** Address split into display lines, skipping anything that is blank. */
export const addressLines: string[] = [
  siteConfig.address.line1,
  siteConfig.address.line2,
  [siteConfig.address.city, siteConfig.address.state]
    .filter(Boolean)
    .join(', '),
  [siteConfig.address.postalCode, siteConfig.address.country]
    .filter(Boolean)
    .join(' '),
].filter(Boolean);

/** Single-line address for compact spots (chips, map labels). */
export const addressOneLine: string = addressLines.join(', ');


/* ────────────────────────────────────────────────────────────────────────────
 *  Contextual WhatsApp message builders.
 *  Each page/component composes a relevant pre-filled message.
 * ──────────────────────────────────────────────────────────────────────────── */

const brand = siteConfig.name;

export const whatsappMessages = {
  general: () =>
    `Hi ${brand}, I need some help with your mobile services. Could you assist me?`,

  needHelp: (context?: string) =>
    context
      ? `Hi ${brand}, I need help regarding ${context}. Please guide me.`
      : `Hi ${brand}, I need help. Could you please assist me?`,

  askAboutPhone: (name: string, sku: string) =>
    `Hi ${brand}, I'm interested in the ${name} (${sku}). Is it currently in stock? Can you share more details?`,

  sellPhone: (summary?: string) =>
    summary
      ? `Hi ${brand}, I'd like to sell my phone.\n\n${summary}\n\nPlease share my best quote.`
      : `Hi ${brand}, I'd like to sell my old phone. Please guide me through the process.`,

  bookRepair: (service?: string, device?: string) =>
    `Hi ${brand}, I'd like to book a repair${service ? ` for: ${service}` : ''}${
      device ? `\nDevice: ${device}` : ''
    }\n\nPlease confirm the next available slot.`,

  orderSupport: (orderNumber: string) =>
    `Hi ${brand}, I need help with my order ${orderNumber}. Please share an update.`,

  priceEnquiry: (name?: string) =>
    name
      ? `Hi ${brand}, could you share the best price and availability for the ${name}?`
      : `Hi ${brand}, could you share your latest offers and pricing?`,
} as const;

/* ────────────────────────────────────────────────────────────────────────────
 *  Server-only configuration. Import ONLY from route handlers / server code.
 * ──────────────────────────────────────────────────────────────────────────── */

export const serverConfig = {
  payment: {
    provider: num(process.env.PAYMENT_PROVIDER, 'mock') as
      | 'razorpay'
      | 'stripe'
      | 'mock',
    razorpayKeyId: num(
      process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      '',
    ),
    razorpayKeySecret: num(process.env.RAZORPAY_KEY_SECRET, ''),
    stripeSecretKey: num(process.env.STRIPE_SECRET_KEY, ''),
    stripeWebhookSecret: num(process.env.STRIPE_WEBHOOK_SECRET, ''),
  },
  /** Hard guard: refuse to treat a "real" provider as configured without creds. */
  isLivePaymentConfigured(): boolean {
    if (serverConfig.payment.provider === 'razorpay') {
      return Boolean(
        serverConfig.payment.razorpayKeyId && serverConfig.payment.razorpayKeySecret,
      );
    }
    if (serverConfig.payment.provider === 'stripe') {
      return Boolean(serverConfig.payment.stripeSecretKey);
    }
    return false;
  },
} as const;

export type SiteConfig = typeof siteConfig;
