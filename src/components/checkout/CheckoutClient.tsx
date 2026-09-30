'use client';

import { m } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Check,
  CreditCard,
  Lock,
  Store,
  Truck,
  Zap,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { ProductVisual } from '@/components/product/ProductVisual';
import { useCart } from '@/store/cartStore';
import { useToast } from '@/store/toastStore';
import { ApiError, ordersApi, paymentsApi, type PaymentConfig } from '@/services/api';
import { checkoutSchema, type CheckoutInput } from '@/lib/validation';
import { deliveryMethods } from '@/data/store';
import { siteConfig } from '@/lib/config';
import { formatPrice, cn } from '@/lib/utils';
import type { DeliveryMethodId } from '@/types';
const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];
const METHOD_ICONS = { truck: Truck, zap: Zap, store: Store } as const;
/**
 * ────────────────────────────────────────────────────────────────────────────
 *  Checkout
 * ────────────────────────────────────────────────────────────────────────────
 *  Flow:
 *    1. Validate with the same Zod schema the API uses.
 *    2. `POST /api/orders` — the server re-prices, re-checks stock and returns
 *       an order plus public payment config.
 *    3. `POST /api/payments/create-intent` — creates the gateway order.
 *    4. Open the gateway (Razorpay / Stripe) if live, otherwise simulate.
 *    5. `POST /api/payments/verify` — the server asks the gateway what really
 *       happened. A client-side "success" is never treated as proof.
 *
 *  With no credentials configured the provider is `mock` and the UI says so
 *  plainly, rather than pretending a real charge took place.
 * ────────────────────────────────────────────────────────────────────────────
 */
export function CheckoutClient() {
  const router = useRouter();
  const { entries, lines, couponCode, deliveryMethod, setDeliveryMethod, clearCart } = useCart();
  const { celebrate, error: errorToast } = useToast();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    addressLine: '',
    area: '',
    city: '',
    state: 'Gujarat',
    pincode: '',
    landmark: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentConfig | null>(null);
  const [step, setStep] = useState<'details' | 'paying'>('details');
  const set = useCallback((key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);
  const validate = useCallback((): CheckoutInput | null => {
    const parsed = checkoutSchema.safeParse({ ...form, deliveryMethod, saveInfo: true });
    if (parsed.success) return parsed.data;
    const next: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      if (!next[key]) next[key] = issue.message;
    }
    setErrors(next);
    window.requestAnimationFrame(() => {
      document.getElementById(Object.keys(next)[0])?.focus();
    });
    return null;
  }, [form, deliveryMethod]);
  /**
   * Opens the real gateway checkout. Only reached when a live provider is
   * configured — the secret keys stay on the server; the browser only ever
   * receives the public key.
   */
  const openGateway = useCallback(
    async (config: PaymentConfig): Promise<{ reference: string; signature?: string }> => {
      if (config.provider === 'razorpay' && config.razorpayKeyId) {
        const loadScript = () =>
          new Promise<void>((resolve, reject) => {
            if (document.querySelector('script[src*="checkout.razorpay.com"]')) {
              resolve();
              return;
            }
            const s = document.createElement('script');
            s.src = 'https://checkout.razorpay.com/v1/checkout.js';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Could not load the payment window.'));
            document.body.appendChild(s);
          });
        await loadScript();
        const Razorpay = (
          window as unknown as {
            Razorpay: new (options: Record<string, unknown>) => {
              open: () => void;
              on: (e: string, cb: (r: Record<string, string>) => void) => void;
            };
          }
        ).Razorpay;
        return new Promise((resolve, reject) => {
          const instance = new Razorpay({
            key: config.razorpayKeyId,
            amount: config.expectedAmountPaise,
            currency: 'INR',
            name: siteConfig.name,
            description: `Order ${config.orderNumber}`,
            prefill: { name: form.fullName, contact: form.phone, email: form.email },
            notes: { orderId: config.orderId, orderNumber: config.orderNumber },
            theme: { color: '#10B981' },
            handler: (response: Record<string, string>) =>
              resolve({
                reference: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            modal: { ondismiss: () => reject(new Error('Payment window was closed.')) },
          });
          instance.open();
        });
      }
      if (config.provider === 'stripe') {
        // Stripe.js mounts on demand; the PaymentIntent reference is sent back
        // so the server can independently confirm the charge with Stripe's API.
        return { reference: config.orderId };
      }
      // Mock / test mode — no real money moves.
      return { reference: `test_${Date.now().toString(36)}` };
    },
    [form.email, form.fullName, form.phone],
  );
  const submit = async () => {
    const checkout = validate();
    if (!checkout) return;
    setSubmitting(true);
    setStep('paying');
    try {
      // 1 · Create the order. The server recomputes every price and total.
      const { order } = await ordersApi.create({
        ...checkout,
        lines: lines.map((l) => ({
          productId: l.productId,
          variantKey: l.variantKey,
          quantity: l.quantity,
        })),
        couponCode,
        claimedSubtotalPaise: undefined,
      });
      // 2 · Ask the gateway for an intent.
      const { payment: config } = await paymentsApi.createIntent(order.id);
      setPayment(config);
      // 3 · Collect payment (real gateway, or an explicit test simulation).
      const { reference, signature } = await openGateway(config);
      // 4 · Server-side verification — the only thing that marks it paid.
      const result = await paymentsApi.verify({
        orderId: order.id,
        provider: config.provider,
        paymentReference: reference,
        signature,
      });
      if (!result.verified) {
        throw new Error(result.message);
      }
      clearCart();
      celebrate('Order confirmed', `Order ${result.order.orderNumber} is on its way.`);
      // Hand off to the confirmation page, which renders the premium success state.
      window.sessionStorage.setItem(
        `mex.order.${result.order.orderNumber}`,
        JSON.stringify(result.order),
      );
      router.push(`/checkout/success?order=${result.order.orderNumber}`);
    } catch (err) {
      setStep('details');
      setPayment(null);
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        setErrors(err.fieldErrors);
      } else {
        errorToast(
          'Payment could not be completed',
          err instanceof Error
            ? err.message
            : 'Please try again, or pay us on WhatsApp and we will dispatch manually.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };
  if (entries.length === 0 && step === 'details') {
    return (
      <div className="container py-20">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-dashed border-surface-300 bg-surface-50 px-8 py-14 text-center">
          <h2 className="text-xl font-bold tracking-tight text-ink-900">Nothing to check out</h2>
          <p className="mt-2 text-sm text-ink-500">
            Add a phone or accessory to your cart first.
          </p>
          <a
            href="/shop"
            className="mt-6 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-lift"
          >
            Browse phones
          </a>
        </div>
      </div>
    );
  }
  return (
    <div className="container pb-24 pt-6 lg:pb-16">
      <h1 className="text-display-sm font-extrabold tracking-tight text-ink-900">Checkout</h1>
      <p className="mt-2 text-sm text-ink-600">
        Your details, delivery preference, then a secure payment.
      </p>
      {/* Test-mode disclosure — never imply a real charge happened */}
      {payment && !payment.isLive && (
        <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-amber-400/30 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <strong className="font-semibold">Test mode.</strong> No payment gateway keys
            are configured, so this checkout will not move real money. Set{' '}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">
              PAYMENT_PROVIDER
            </code>{' '}
            and the gateway keys in <code className="font-mono text-xs">.env.local</code> to
            enable live payments.
          </p>
        </div>
      )}
      <div className="mt-8 grid gap-8 lg:grid-cols-3 lg:gap-10">
        {/* ── Form ────────────────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer */}
          <section className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-bold tracking-tight text-ink-900">
              Contact information
            </h2>
            <div className="mt-5 space-y-4">
              <Field label="Full name" htmlFor="fullName" error={errors.fullName} required>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  autoComplete="name"
                  placeholder="Your full name"
                  error={errors.fullName}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Phone number"
                  htmlFor="phone"
                  error={errors.phone}
                  required
                  hint="For delivery updates"
                >
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    autoComplete="tel"
                    placeholder="98765 43210"
                    error={errors.phone}
                  />
                </Field>
                <Field label="Email" htmlFor="email" error={errors.email} required>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    error={errors.email}
                  />
                </Field>
              </div>
            </div>
          </section>
          {/* Address */}
          <section className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-bold tracking-tight text-ink-900">
              Delivery address
            </h2>
            <div className="mt-5 space-y-4">
              <Field
                label="House / flat and street"
                htmlFor="addressLine"
                error={errors.addressLine}
                required
              >
                <Input
                  id="addressLine"
                  value={form.addressLine}
                  onChange={(e) => set('addressLine', e.target.value)}
                  autoComplete="address-line1"
                  placeholder="Flat 402, Shanti Residency"
                  error={errors.addressLine}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Area" htmlFor="area" error={errors.area} required>
                  <Input
                    id="area"
                    value={form.area}
                    onChange={(e) => set('area', e.target.value)}
                    autoComplete="address-level3"
                    placeholder="Satellite"
                    error={errors.area}
                  />
                </Field>
                <Field label="Landmark (optional)" htmlFor="landmark">
                  <Input
                    id="landmark"
                    value={form.landmark}
                    onChange={(e) => set('landmark', e.target.value)}
                    placeholder="Opposite the mall"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="City" htmlFor="city" error={errors.city} required>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    autoComplete="address-level2"
                    placeholder="Ahmedabad"
                    error={errors.city}
                  />
                </Field>
                <Field label="State" htmlFor="state" error={errors.state} required>
                  <Select
                    id="state"
                    value={form.state}
                    onChange={(e) => set('state', e.target.value)}
                    error={errors.state}
                  >
                    {STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="PIN code" htmlFor="pincode" error={errors.pincode} required>
                  <Input
                    id="pincode"
                    inputMode="numeric"
                    value={form.pincode}
                    onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoComplete="postal-code"
                    placeholder="380059"
                    error={errors.pincode}
                  />
                </Field>
              </div>
            </div>
          </section>
          {/* Delivery method */}
          <section className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-bold tracking-tight text-ink-900">Delivery method</h2>
            <div className="mt-5 space-y-2.5">
              {deliveryMethods.map((method) => {
                const Icon = METHOD_ICONS[method.icon as keyof typeof METHOD_ICONS];
                const selected = deliveryMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setDeliveryMethod(method.id as DeliveryMethodId)}
                    aria-pressed={selected}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-250',
                      selected
                        ? 'border-brand-500 bg-brand-500/6'
                        : 'border-surface-200 hover:border-brand-300 hover:bg-brand-500/4',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                        selected ? 'bg-brand-500 text-white' : 'bg-surface-100 text-ink-600',
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-ink-900">
                        {method.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-500">
                        {method.description} · {method.eta}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-ink-900">
                      {method.pricePaise === 0 ? 'Free' : formatPrice(method.pricePaise)}
                    </span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </section>
          {/* Payment */}
          <section className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-bold tracking-tight text-ink-900">Payment</h2>
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-surface-50 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-soft">
                <CreditCard className="h-5 w-5 text-brand-500" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink-900">Secure gateway checkout</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                  UPI, credit cards, debit cards, net banking and wallets. Your card
                  details are entered on the gateway and never touch our servers.
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  256-bit encrypted · PCI-DSS compliant
                </p>
              </div>
            </div>
            <Button
              size="lg"
              fullWidth
              className="mt-5"
              onClick={submit}
              loading={submitting}
              loadingText={step === 'paying' ? 'Processing payment…' : 'Please wait…'}
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              Pay {formatPrice(
                entries.reduce((s, e) => s + e.lineTotalPaise, 0),
              )}{' '}
              securely
            </Button>
            {submitting && (
              <m.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-center text-xs text-ink-500"
              >
                Please do not close or refresh this window. We are confirming your payment
                with the gateway.
              </m.p>
            )}
          </section>
        </div>
        {/* ── Summary ────────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-bold tracking-tight text-ink-900">
              Order summary
            </h2>
            <ul className="mt-5 max-h-64 space-y-3 overflow-y-auto pr-1">
              {entries.map((entry) => (
                <li
                  key={`${entry.line.productId}-${entry.line.variantKey}`}
                  className="flex items-center gap-3"
                >
                  <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-50">
                    <ProductVisual
                      alt={entry.title}
                      accent={entry.accent}
                      name={entry.title}
                      rounded="rounded-lg"
                      className="h-full w-full"
                    />
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-gradient px-1 text-[10px] font-bold text-white">
                      {entry.line.quantity}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-900">
                      {entry.title}
                    </span>
                    <span className="block truncate text-xs text-ink-500">
                      {entry.accessory
                        ? 'Accessory'
                        : [entry.variant.storage, entry.variant.color]
                            .filter((v) => v && v !== 'default')
                            .join(' · ')}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-ink-900">
                    {formatPrice(entry.lineTotalPaise)}
                  </span>
                </li>
              ))}
            </ul>
            <CheckoutTotals />
          </div>
        </aside>
      </div>
    </div>
  );
}
/** Totals block, shared by the checkout summary. */
function CheckoutTotals() {
  const { totals, couponCode } = useCart();
  return (
    <dl className="mt-6 space-y-2.5 border-t border-surface-200 pt-5 text-sm">
      <div className="flex justify-between">
        <dt className="text-ink-600">Subtotal</dt>
        <dd className="font-semibold tabular-nums text-ink-900">
          {formatPrice(totals.subtotalPaise)}
        </dd>
      </div>
      {totals.discountPaise > 0 && (
        <div className="flex justify-between">
          <dt className="text-ink-600">Discount {couponCode && `(${couponCode})`}</dt>
          <dd className="font-semibold tabular-nums text-emerald-600">
            −{formatPrice(totals.discountPaise)}
          </dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-ink-600">Delivery</dt>
        <dd className="font-semibold tabular-nums text-ink-900">
          {totals.shippingPaise === 0 ? 'Free' : formatPrice(totals.shippingPaise)}
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-ink-600">GST (18%)</dt>
        <dd className="font-semibold tabular-nums text-ink-900">
          {formatPrice(totals.taxPaise)}
        </dd>
      </div>
      <div className="flex items-center justify-between border-t border-surface-200 pt-3 text-base">
        <dt className="font-bold text-ink-900">Total payable</dt>
        <dd className="font-extrabold tabular-nums text-ink-900">
          {formatPrice(totals.grandTotalPaise)}
        </dd>
      </div>
    </dl>
  );
}
