# MobilExpertX

A premium, production-grade storefront for a mobile marketplace: **buy** new and
refurbished phones, **sell** your old device, **repair** handsets, and **shop**
genuine accessories — with WhatsApp and phone support woven through every step.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion and
React Three Fiber.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

The repo ships with a working `.env` using **placeholder** contact details and
**test-mode** payments, so it runs immediately with no setup and can never move
real money.

```bash
npm run build        # production build
npm start            # serve the build
npm test             # integration tests (needs the build running)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
```

---

## What's included

| Route | Description |
| --- | --- |
| `/` | Hero with a real WebGL device, trending phones, categories, refurbished band, sell-phone, repairs, accessories, trust, offers, review carousel, contact CTA |
| `/shop` | Full e-commerce listing: search, filters, sort, pagination, quick view, wishlist |
| `/shop/[slug]` | Product detail: gallery, live variant pricing, specs, reviews, sticky mobile buy bar |
| `/sell-phone` | 8-step animated wizard with instant, server-verified valuation |
| `/repair`, `/repair/[slug]` | 11 services, each with its own booking form |
| `/accessories`, `/accessories/[slug]` | Accessories marketplace |
| `/cart`, `/checkout`, `/checkout/success` | Cart, checkout and premium order confirmation |
| `/wishlist`, `/about`, `/contact`, `/faqs`, `/account` | Supporting pages |
| `/policies/[slug]` | Privacy, Terms, Refund, Shipping, Warranty |

Plus `sitemap.xml`, `robots.txt`, a web manifest, and Open Graph artwork.

---

## Architecture

```
src/
├── app/                    # Routes + API route handlers
│   └── api/                # orders, payments, repairs, sell-phone, contact, products
├── components/
│   ├── layout/             # Navbar, Footer, TopBar, CartDrawer, SearchOverlay, MobileNav
│   ├── ui/                 # Button, Field, Modal, Badge, Rating, Avatar, Skeleton…
│   ├── home/               # Home page sections
│   ├── product/            # ProductCard, Gallery, Filters, QuickView, Visual
│   ├── forms/              # RepairForm, SellPhoneWizard, CheckoutClient
│   ├── three/              # HeroPhoneScene (the only WebGL in the app)
│   └── contact/            # WhatsAppFab, ContactCTA, ContactForm
├── services/               # Data-access + API client + payment service + repository
├── data/                   # Typed seed catalogue
├── lib/                    # config, pricing, validation, seo, motion, utils
├── store/                  # Cart, wishlist, UI and toast contexts
└── types/                  # Domain models
```

**The UI never imports seed data directly.** Everything reads through
`src/services`, so swapping the bundled catalogue for a real backend means
editing one layer, not every component.

---

## Connecting a real backend

Every service in `src/services/catalogService.ts` already has a live-fetch path
that falls back to the bundled catalogue:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.mobilexpertx.com
```

Endpoints expected: `GET /products`, `GET /products/:slug`, `GET /accessories`,
`GET /repair-services`. Set the variable and the storefront switches over; unset
it and it stays fully functional on local data.

For persistence, `src/services/repository.ts` is the single seam — an in-memory
store today and a database tomorrow. It is async-shaped and sanitised
throughout, so the migration is a change to one file.

---

## Payments

**The app runs in test mode by default and says so in the UI.** No real money
can move until you explicitly configure a gateway.

```bash
# Server-side (authoritative — these must NOT use the NEXT_PUBLIC_ prefix)
PAYMENT_PROVIDER=razorpay        # razorpay | stripe | mock
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxxxxxxx

# Browser-safe (publishable keys only)
NEXT_PUBLIC_PAYMENT_PROVIDER=razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxx
```

Stripe works the same way with `STRIPE_SECRET_KEY` and
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

### Why the checkout is safe

1. The client posts what it *wants* to buy.
2. `POST /api/orders` **recomputes every price, discount, tax and total on the
   server** from the catalogue. The client's claimed total is ignored.
3. `POST /api/payments/create-intent` creates the gateway order using the secret.
4. The gateway collects payment in the browser.
5. `POST /api/payments/verify` asks the **gateway** what actually happened —
   signature check, captured status, and amount equality — and only then marks
   the order paid.

A tampered client cannot invent a price, and a client-side "success" message is
never treated as proof of payment. These behaviours are covered by
`tests/orders.test.cjs`.

---

## Security

- **Secrets stay server-side.** `serverConfig` in `src/lib/config.ts` is only
  imported by route handlers. `publicConfigFor()` hands the browser publishable
  keys and nothing else.
- **Every mutation is validated twice** — Zod for instant feedback, the same
  schema again in the API handler.
- **All input is sanitised** before storage (`sanitizeText` in `src/lib/utils.ts`).
- **Orders recompute all money server-side** and re-validate variants and stock.
- **Security headers** (`nosniff`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`) are set in `next.config.js`.
- **`robots.txt` blocks** `/api`, `/cart`, `/checkout`, `/wishlist`, `/account`
  and any URL with a query string.
- Order numbers are pattern-validated before lookup, so injection attempts are
  rejected with a 400.

---

## Performance

- **Three.js is code-split** behind `next/dynamic` and loaded only on the home
  page. `dpr` is capped, antialiasing is off, and a reduced-motion visitor gets a
  single static frame.
- **`LazyMotion`** loads the Framer animation runtime on demand.
- **Catalogue pages use no WebGL at all** — products are rendered as CSS-3D
  devices, so they are crisp, zero-request and instant.
- **Native scroll-snap** powers the mobile product rails and the review carousel
  (no JS transform loop, no rAF, real momentum).
- **Fonts are self-hosted** by `next/font` with preloading and zero layout shift.
- Images go through `next/image` with AVIF/WebP, lazy loading and `sizes`.

Typical first-load JS is **~150–210 kB** depending on the route.

---

## Accessibility

- Skip link, semantic landmarks, and exactly one `h1` per page.
- Focus is trapped in dialogs and restored on close; `Escape` dismisses them.
- `aria-pressed`, `aria-expanded`, `aria-invalid`, `aria-describedby` and
  `role="alert"` are used throughout.
- Visible focus rings on every interactive element.
- All imagery has descriptive alt text; generated visuals are `aria-hidden`
  with the product name carried by adjacent text.
- `prefers-reduced-motion` is honoured globally, in Framer, in Lenis and in the
  WebGL scene.

---

## Replacing the placeholder imagery

Product `images[].url` is intentionally empty, so `ProductVisual` renders a
generated CSS-3D device tinted with the product's own accent colour. To use real
photography, set a URL:

```ts
images: [{ url: '/products/iphone-15-pro-front.webp', alt: 'iPhone 15 Pro, front view', view: 'front' }]
```

`next/image` takes over automatically — no other change needed.

---

## Configuration reference

See [`.env.example`](./.env.example) for every variable, grouped and annotated.

Already configured: WhatsApp and contact phone (`919716216480`) and the owner
name used on the contact and about pages.

| Variable | Why |
| --- | --- |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Drives every WhatsApp deep link on the site |
| `NEXT_PUBLIC_CONTACT_PHONE` | Drives every `tel:` link and displayed number |
| `NEXT_PUBLIC_OWNER_NAME` | The person named on the contact and about pages |
| `NEXT_PUBLIC_REPAIR_PHONE` | Repair-specific number; falls back to the contact phone |

### The address is intentionally blank

There is **no public storefront address at the moment**. Every
`NEXT_PUBLIC_ADDRESS_*` variable in `.env` is empty, and the site handles that
gracefully rather than rendering an empty block:

- the footer, contact page and about page hide their address section entirely;
- the about page and contact CTA swap the address for the owner's name;
- the `LocalBusiness` JSON-LD omits `PostalAddress` altogether.

Country (`NEXT_PUBLIC_COUNTRY` / `NEXT_PUBLIC_COUNTRY_CODE`) is still
populated, because it drives "area served", shipping and the return policy in
structured data — neither of those should be blank.

To publish an address later, fill in the `NEXT_PUBLIC_ADDRESS_*` values and
rebuild. The address blocks come back automatically; no code change is needed.

---

## Testing

`npm test` runs four integration suites against a production build:

| Suite | Covers |
| --- | --- |
| `services.test.cjs` | Valuation logic, repair bookings, contact, input sanitisation |
| `orders.test.cjs` | Server-side re-pricing, tamper resistance, stock limits, payment verification |
| `catalogue.test.cjs` | Filtering, search, sorting, pagination |
| `seo.test.cjs` | Titles, descriptions, canonicals, JSON-LD, headers, contact links, secret leakage |

Current status: **all suites passing, 189 assertions, 0 failures.**

---

© MobilExpertX. All rights reserved.
