/**
 * SEO, accessibility, security-header and contact-link tests.
 * These assert on the rendered HTML, which is what search engines and
 * screen readers actually consume.
 */
const { assert, counts } = require('./helpers.cjs');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

/**
 * Read the real contact number out of `.env` so these assertions track the
 * business config instead of a number frozen into the test.
 */
const envText = readFileSync(join(__dirname, '..', '.env'), 'utf8');
const WA = (envText.match(/^NEXT_PUBLIC_WHATSAPP_NUMBER=(.+)$/m)?.[1] ?? '').trim();
const OWNER = (envText.match(/^NEXT_PUBLIC_OWNER_NAME=(.+)$/m)?.[1] ?? '').trim();
const ADDRESS_FIELD = envText.match(/^NEXT_PUBLIC_ADDRESS_LINE1=(.*)$/m)?.[1]?.trim() ?? '';

const PAGES = [
  ['/', 'MobilExpertX'],
  ['/shop', 'Shop Mobile Phones'],
  ['/shop/apple-iphone-15-pro', 'iPhone 15 Pro'],
  ['/sell-phone', 'Sell Your Old Phone'],
  ['/repair', 'Mobile Phone Repair'],
  ['/repair/battery-replacement', 'Battery Replacement'],
  ['/accessories', 'Mobile Accessories'],
  ['/accessories/100w-gan-charger', '100W GaN'],
  ['/about', 'About Us'],
  ['/contact', 'Contact Us'],
  ['/faqs', 'Frequently Asked Questions'],
  ['/policies/privacy', 'Privacy Policy'],
];

const getText = async (path) => {
  const res = await fetch('http://localhost:3000' + path);
  return { status: res.status, html: await res.text(), res };
};

(async () => {
  // ── Per-page SEO ───────────────────────────────────────────────────────
  for (const [path] of PAGES) {
    const { status, html } = await getText(path);
    assert(`${path} returns 200`, status === 200, `status=${status}`);

    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
    assert(`${path} has a title`, title.length > 10, title.slice(0, 55));

    const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
    assert(`${path} has a meta description`, desc.length > 50, `${desc.length} chars`);

    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? '';
    assert(`${path} has a canonical URL`, canonical.includes(path === '/' ? 'localhost' : path),
      canonical);

    assert(`${path} has Open Graph data`, html.includes('property="og:title"'));
    assert(`${path} has a Twitter card`, html.includes('name="twitter:card"'));
    assert(`${path} has exactly one h1`, (html.match(/<h1[\s>]/g) ?? []).length === 1,
      `count=${(html.match(/<h1[\s>]/g) ?? []).length}`);

    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '').replace(/<[^>]*>/g, '').trim();
    assert(`${path} h1 is meaningful`, h1.length > 3, h1.slice(0, 50));
  }

  // ── Structured data ────────────────────────────────────────────────────
  const home = await getText('/');
  assert('home emits Organization/LocalBusiness JSON-LD', home.html.includes('"LocalBusiness"'));
  assert('home emits WebSite JSON-LD', home.html.includes('"WebSite"'));
  assert('home emits breadcrumb JSON-LD', home.html.includes('"BreadcrumbList"'));

  const product = await getText('/shop/apple-iphone-15-pro');
  assert('product page emits Product JSON-LD', product.html.includes('"@type":"Product"'));
  assert('product JSON-LD includes an offer', product.html.includes('"offers"'));
  assert('product JSON-LD includes a rating', product.html.includes('aggregateRating'));

  assert('FAQ page emits FAQPage JSON-LD', (await getText('/faqs')).html.includes('"FAQPage"'));
  assert('repair page emits Service JSON-LD',
    (await getText('/repair/screen-replacement')).html.includes('"@type":"Service"'));

  // ── Transactional pages must not be indexed ────────────────────────────
  for (const p of ['/cart', '/checkout', '/wishlist', '/account']) {
    assert(`${p} is noindex`, (await getText(p)).html.includes('noindex'));
  }

  // ── Security headers ───────────────────────────────────────────────────
  const { res } = await getText('/');
  assert('X-Content-Type-Options is nosniff',
    res.headers.get('x-content-type-options') === 'nosniff');
  assert('Referrer-Policy is set', Boolean(res.headers.get('referrer-policy')),
    res.headers.get('referrer-policy'));
  assert('X-Frame-Options is set', Boolean(res.headers.get('x-frame-options')),
    res.headers.get('x-frame-options'));
  assert('Permissions-Policy is set', Boolean(res.headers.get('permissions-policy')));

  // ── Contact channels ───────────────────────────────────────────────────
  assert('WhatsApp number is configured in .env', /^\d{10,15}$/.test(WA), WA);
  assert('WhatsApp deep links are present', home.html.includes(`wa.me/${WA}`));
  assert('WhatsApp messages are pre-filled',
    new RegExp(`wa\\.me/${WA}\\?text=Hi%20MobilExpertX`).test(home.html));
  assert('tel: links are present', home.html.includes(`href="tel:${WA}"`));
  assert('external links use rel=noopener',
    !/target="_blank"(?![^>]*rel="noopener)/.test(home.html));

  // ── Owner + address behaviour ───────────────────────────────────────────
  const contact = await getText('/contact');
  assert('owner name is published on the contact page',
    OWNER.length > 0 && contact.html.includes(OWNER), OWNER);

  // The storefront address is deliberately unset right now: the pages must
  // hide the block entirely rather than render an empty one.
  assert('no storefront address is configured', ADDRESS_FIELD === '');
  for (const path of ['/contact', '/about', '/']) {
    const { html } = await getText(path);
    assert(`${path} renders no empty address block`,
      !/Visit the store|Visit us</.test(html));
  }
  const contactLd = contact.html.match(
    /<script type="application\/ld\+json">(\{.*?"@type":"LocalBusiness".*?\})<\/script>/s)?.[1] ?? '';
  assert('LocalBusiness JSON-LD omits PostalAddress when there is no address',
    contactLd.length > 0 && !contactLd.includes('PostalAddress'));

  // ── No secrets in the client bundle ────────────────────────────────────
  for (const p of ['/', '/shop', '/checkout']) {
    const { html } = await getText(p);
    assert(`${p} leaks no payment secret`,
      !/RAZORPAY_KEY_SECRET|STRIPE_SECRET_KEY|razorpayKeySecret/.test(html));
  }

  console.log(`\nseo + security: ${counts()} failure(s)`);
  if (counts() > 0) process.exitCode = 1;
})();
