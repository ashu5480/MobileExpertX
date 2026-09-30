'use client';

import { m } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Check,
  Copy,
  MessageCircle,
  Package,
  Phone,
  Truck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { ProductVisual } from '@/components/product/ProductVisual';
import { ordersApi } from '@/services/api';
import { useToast } from '@/store/toastStore';
import {
  buildTelUrl,
  buildWhatsAppUrl,
  siteConfig,
  whatsappMessages,
} from '@/lib/config';
import { formatDate, formatPrice } from '@/lib/utils';
import type { Order } from '@/types';
/**
 * Order confirmation.
 *
 * The order is re-fetched from `GET /api/orders` on mount rather than trusted
 * from the URL or sessionStorage — a page refresh must still show the real
 * server-side record. If it cannot be found we say so plainly rather than
 * rendering a fake success screen.
 */
export function OrderSuccess() {
  const params = useSearchParams();
  const orderNumber = params.get('order') ?? '';
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');
  useEffect(() => {
    if (!orderNumber) {
      setStatus('missing');
      return;
    }
    let cancelled = false;
    // Prefer the in-memory order written by checkout, then confirm with the API.
    const fromSession = (() => {
      try {
        const raw = window.sessionStorage.getItem(`mex.order.${orderNumber}`);
        return raw ? (JSON.parse(raw) as Order) : null;
      } catch {
        return null;
      }
    })();
    if (fromSession) {
      setOrder(fromSession);
      setStatus('ready');
    }
    ordersApi
      .get(orderNumber)
      .then(({ order: fetched }) => {
        if (cancelled) return;
        setOrder(fetched);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        // Keep the session copy if the API is unreachable; only report missing
        // when we genuinely have nothing to show.
        if (!fromSession) setStatus('missing');
      });
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);
  const copyOrder = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      toast({ title: 'Order number copied', tone: 'success' });
    } catch {
      toast({ title: 'Could not copy', description: orderNumber, tone: 'info' });
    }
  };
  if (status === 'loading') {
    return (
      <div className="container py-20">
        <div className="mx-auto h-80 max-w-lg animate-pulse rounded-3xl bg-surface-100" />
      </div>
    );
  }
  if (status === 'missing' || !order) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-surface-300 bg-surface-50 p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-ink-400" aria-hidden="true" />
          <h1 className="mt-5 text-xl font-bold tracking-tight text-ink-900">
            We could not find that order
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            If you have just paid, message us on WhatsApp with your number and we will
            confirm straight away.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/shop">Continue shopping</ButtonLink>
            <a
              href={buildWhatsAppUrl(
                siteConfig.contact.whatsapp,
                whatsappMessages.orderSupport(orderNumber || 'unknown'),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-semibold text-white"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }
  const eta =
    order.deliveryMethod === 'pickup'
      ? 'Ready for collection in about 2 hours'
      : order.deliveryMethod === 'express'
        ? 'Arriving tomorrow'
        : 'Arriving in 2–4 business days';
  return (
    <div className="container py-10 sm:py-14">
      <div className="mx-auto max-w-2xl text-center">
        <m.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.08 }}
          className="relative mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lift"
        >
          <CheckCircle2 className="h-10 w-10 text-white" aria-hidden="true" />
          <m.span
            className="absolute inset-0 rounded-3xl ring-2 ring-emerald-400/40"
            animate={{ scale: 1.25, opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        </m.div>
        <m.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.45 }}
        >
          <h1 className="mt-6 text-display-sm font-extrabold tracking-tight text-ink-900">
            Thank you, {order.customer.fullName.split(' ')[0]}!
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            Your order is confirmed. We have emailed a copy to{' '}
            <span className="font-semibold text-ink-900">{order.customer.email}</span> and
            will WhatsApp you tracking updates on {order.customer.phone}.
          </p>
          <button
            type="button"
            onClick={copyOrder}
            className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-surface-300 bg-white px-5 py-2.5 transition-colors hover:border-brand-300"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              Order number
            </span>
            <span className="font-mono text-sm font-bold text-ink-900">
              {order.orderNumber}
            </span>
            <Copy className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
          </button>
          {order.paymentProvider === 'mock' && (
            <p className="mt-4 inline-block rounded-xl border border-amber-400/30 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
              This was a <strong>test-mode</strong> order — no real payment was processed.
            </p>
          )}
        </m.div>
      </div>
      <div className="mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft lg:col-span-2">
          <h2 className="text-lg font-bold tracking-tight text-ink-900">
            What you ordered
          </h2>
          <ul className="mt-5 divide-y divide-surface-200">
            {order.lines.map((line) => (
              <li
                key={`${line.productId}-${line.variantKey}`}
                className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <span className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-50">
                  <ProductVisual
                    alt={line.name}
                    accent={line.accent}
                    name={line.name}
                    rounded="rounded-xl"
                    className="h-full w-full"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <Link
                    href={
                      line.kind === 'accessory'
                        ? `/accessories/${line.slug}`
                        : `/shop/${line.slug}`
                    }
                    className="block truncate text-sm font-semibold text-ink-900 hover:text-brand-600"
                  >
                    {line.name}
                  </Link>
                  <span className="text-xs text-ink-500">
                    Qty {line.quantity} · {formatPrice(line.unitPricePaise)} each
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-ink-900">
                  {formatPrice(line.lineTotalPaise)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-surface-200 pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">Subtotal</dt>
              <dd className="font-semibold tabular-nums text-ink-900">
                {formatPrice(order.totals.subtotalPaise)}
              </dd>
            </div>
            {order.totals.discountPaise > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-600">Discount {order.totals.couponCode}</dt>
                <dd className="font-semibold tabular-nums text-emerald-600">
                  −{formatPrice(order.totals.discountPaise)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-600">Delivery</dt>
              <dd className="font-semibold tabular-nums text-ink-900">
                {order.totals.shippingPaise === 0
                  ? 'Free'
                  : formatPrice(order.totals.shippingPaise)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">GST</dt>
              <dd className="font-semibold tabular-nums text-ink-900">
                {formatPrice(order.totals.taxPaise)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-surface-200 pt-3 text-base">
              <dt className="font-bold text-ink-900">Total paid</dt>
              <dd className="font-extrabold tabular-nums text-ink-900">
                {formatPrice(order.totals.grandTotalPaise)}
              </dd>
            </div>
          </dl>
        </div>
        {/* ── Delivery + support ─────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900">
              <Truck className="h-4 w-4 text-brand-500" aria-hidden="true" />
              Delivery
            </h2>
            <p className="mt-2.5 text-sm font-semibold text-ink-900">{eta}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              {order.shippingAddress.addressLine}
              <br />
              {order.shippingAddress.area}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.pincode}
            </p>
            <p className="mt-3 text-xs text-ink-400">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft">
            <h2 className="text-sm font-bold text-ink-900">Need anything?</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
              Quote your order number and we will sort it out fast.
            </p>
            <div className="mt-4 space-y-2.5">
              <a
                href={buildWhatsAppUrl(
                  siteConfig.contact.whatsapp,
                  whatsappMessages.orderSupport(order.orderNumber),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Chat on WhatsApp
              </a>
              <a
                href={buildTelUrl(
                  siteConfig.contact.phone,
                  whatsappMessages.orderSupport(order.orderNumber),
                )}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-300 px-4 py-3 text-sm font-semibold text-ink-900"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call {siteConfig.contact.phoneDisplay}
              </a>
            </div>
          </div>
          <ButtonLink href="/shop" variant="outline" fullWidth>
            Continue shopping
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
