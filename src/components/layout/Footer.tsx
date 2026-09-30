import Link from 'next/link';
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Youtube,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { addressLines, buildTelUrl, buildWhatsAppUrl, hasAddress, siteConfig, whatsappMessages } from '@/lib/config';
import { companyStats } from '@/data/store';

const QUICK_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Sell Phone', href: '/sell-phone' },
  { label: 'Repair', href: '/repair' },
  { label: 'Accessories', href: '/accessories' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const SUPPORT_LINKS = [
  { label: 'WhatsApp', href: '/contact#whatsapp' },
  { label: 'Call Us', href: '/contact#call' },
  { label: 'Email', href: '/contact#email' },
  { label: 'FAQs', href: '/faqs' },
];

const POLICY_LINKS = [
  { label: 'Privacy Policy', href: '/policies/privacy' },
  { label: 'Terms & Conditions', href: '/policies/terms' },
  { label: 'Refund Policy', href: '/policies/refund' },
  { label: 'Shipping Policy', href: '/policies/shipping' },
  { label: 'Warranty Policy', href: '/policies/warranty' },
];

const SOCIALS = [
  {
    label: 'Instagram',
    href: `https://instagram.com/${siteConfig.social.instagram}`,
    icon: Instagram,
  },
  {
    label: 'Facebook',
    href: `https://facebook.com/${siteConfig.social.facebook}`,
    icon: Facebook,
  },
  {
    label: 'YouTube',
    href: `https://youtube.com/${siteConfig.social.youtube}`,
    icon: Youtube,
  },
];

/**
 * Site footer.
 *
 * A server component — it has no interactivity, so shipping it as one avoids
 * adding client JS for something that is pure content. All contact values
 * come from `siteConfig`.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="light-section-tint border-t border-surface-200">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-70" aria-hidden="true" />
      <div className="light-grid" aria-hidden="true" />

      <div className="container relative">
        {/* ── Main grid ─────────────────────────────────────────────── */}
        <div className="grid gap-10 py-14 sm:py-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-600">
              Buy, sell, repair and upgrade your mobile experience. Verified
              devices, honest trade-in value and repairs by real technicians.
            </p>

            <div className="mt-6 space-y-2.5">
              <a
                href={buildWhatsAppUrl(
                  siteConfig.contact.whatsapp,
                  whatsappMessages.general(),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 text-sm text-ink-700 transition-colors hover:text-brand-700"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-soft ring-1 ring-surface-200 transition-transform duration-300 group-hover:-translate-y-0.5">
                  <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[11px] uppercase tracking-wider text-ink-500">
                    WhatsApp
                  </span>
                  +{siteConfig.contact.whatsappDisplay}
                </span>
              </a>

              <a
                href={buildTelUrl(siteConfig.contact.phone, whatsappMessages.general())}
                className="group flex items-center gap-3 text-sm text-ink-700 transition-colors hover:text-brand-700"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-soft ring-1 ring-surface-200 transition-transform duration-300 group-hover:-translate-y-0.5">
                  <Phone className="h-4 w-4 text-brand-600" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[11px] uppercase tracking-wider text-ink-500">
                    Call us
                  </span>
                  +{siteConfig.contact.phoneDisplay}
                </span>
              </a>

              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="group flex items-center gap-3 text-sm text-ink-700 transition-colors hover:text-brand-700"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-soft ring-1 ring-surface-200 transition-transform duration-300 group-hover:-translate-y-0.5">
                  <Mail className="h-4 w-4 text-brand-600" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wider text-ink-500">
                    Email
                  </span>
                  <span className="block truncate">{siteConfig.contact.email}</span>
                </span>
              </a>

              {hasAddress && (
                <div className="flex items-start gap-3 text-sm text-ink-700">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-soft ring-1 ring-surface-200">
                    <MapPin className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[11px] uppercase tracking-wider text-ink-500">
                      Visit us
                    </span>
                    {addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </span>
                </div>
              )}
            </div>
          </div>

          <FooterColumn title="Quick Links" links={QUICK_LINKS} className="lg:col-span-2" />
          <FooterColumn title="Customer Support" links={SUPPORT_LINKS} className="lg:col-span-2" />
          <FooterColumn title="Policies" links={POLICY_LINKS} className="lg:col-span-2" />

          <div className="lg:col-span-2">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-ink-500">
              Follow us
            </h2>
            <ul className="mt-4 space-y-3">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2.5 text-sm text-ink-700 transition-colors hover:text-brand-700"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-ink-600 shadow-soft ring-1 ring-surface-200 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-brand-500 group-hover:text-white group-hover:ring-brand-500">
                      <social.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-xs leading-relaxed text-ink-500">
              {siteConfig.hours.display}
            </p>
          </div>
        </div>

        {/* ── Stats band ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-surface-200 bg-surface-200 sm:grid-cols-4">
          {companyStats.map((stat) => (
            <div key={stat.label} className="bg-white px-4 py-5 text-center">
              <p className="bg-brand-gradient bg-clip-text text-2xl font-extrabold text-transparent">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-ink-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ────────────────────────────────────────────── */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-surface-200 py-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-ink-500">
            © {year} {siteConfig.legalName}. All rights reserved.
          </p>
          <p className="text-xs text-ink-500">
            Secure payments · Verified devices · Expert repairs
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  className,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
  className?: string;
}) {
  return (
    <nav className={className} aria-label={title}>
      <h2 className="text-[13px] font-bold uppercase tracking-wider text-ink-500">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-2 text-sm text-ink-600 transition-colors hover:text-brand-700"
            >
              <span className="h-px w-0 bg-brand-500 transition-all duration-300 group-hover:w-3" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
