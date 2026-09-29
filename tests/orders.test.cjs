/**
 * Order creation, server-side re-pricing, tamper resistance and payment
 * verification tests — the security-critical surface of the app.
 */
const { post, get, assert, CUSTOMER, counts } = require('./helpers.cjs');

(async () => {
  // ── Order creation + server-side re-pricing ────────────────────────────
  const order = await post('/api/orders', {
    ...CUSTOMER,
    lines: [{ productId: 'p-iphone-14', variantKey: 'Midnight|256 GB|6 GB', quantity: 1 }],
    couponCode: 'MEXNEW10',
    // Deliberately wrong — the server must ignore this entirely.
    claimedSubtotalPaise: 1,
  });
  assert('order created', order.status === 201, `status=${order.status}`);
  const t = order.json?.order?.totals;
  assert('server ignored the claimed subtotal',
    t?.subtotalPaise !== 1 && t?.subtotalPaise > 100000, `subtotal=${t?.subtotalPaise}`);
  assert('coupon applied server-side', t?.discountPaise > 0, `discount=${t?.discountPaise}`);
  assert('GST applied', t?.taxPaise > 0, `tax=${t?.taxPaise}`);
  assert('order number generated', /^MEX\d{10}$/.test(order.json?.order?.orderNumber || ''),
    order.json?.order?.orderNumber);
  assert('line kind recorded', order.json?.order?.lines?.[0]?.kind === 'phone');
  assert('order starts unpaid', order.json?.order?.status === 'pending');

  // Accessory line.
  const accOrder = await post('/api/orders', {
    ...CUSTOMER, deliveryMethod: 'pickup',
    lines: [{ productId: 'acc:a-gan-100w', variantKey: 'default|default|default', quantity: 2 }],
  });
  assert('accessory order created', accOrder.status === 201, `status=${accOrder.status}`);
  assert('accessory priced from the catalogue, not the client',
    accOrder.json?.order?.lines?.[0]?.unitPricePaise === 249900,
    `unit=${accOrder.json?.order?.lines?.[0]?.unitPricePaise}`);
  assert('accessory line kind recorded',
    accOrder.json?.order?.lines?.[0]?.kind === 'accessory');
  assert('store pickup is free', accOrder.json?.order?.totals?.shippingPaise === 0);

  // ── Tamper resistance ──────────────────────────────────────────────────
  const tamper = await post('/api/orders', {
    ...CUSTOMER,
    lines: [{ productId: 'p-iphone-14', variantKey: 'Midnight|1024 TB|6 GB', quantity: 1 }],
  });
  assert('order rejects an unavailable storage',
    tamper.json?.order?.lines?.length === 0 || tamper.status >= 400,
    `status=${tamper.status}`);

  const badColour = await post('/api/orders', {
    ...CUSTOMER,
    lines: [{ productId: 'p-iphone-14', variantKey: 'Neon Green|256 GB|6 GB', quantity: 1 }],
  });
  assert('order rejects a colour that does not exist',
    badColour.json?.order?.lines?.length === 0 || badColour.status >= 400,
    `status=${badColour.status}`);

  // The razr has only 4 in stock, so 10 must be refused.
  const over = await post('/api/orders', {
    ...CUSTOMER,
    lines: [{ productId: 'p-motorola-razr-40', variantKey: 'default|default|default', quantity: 10 }],
  });
  assert('order rejects quantity above available stock',
    over.json?.order?.lines?.length === 0 || over.status >= 400,
    `status=${over.status}`);

  assert('order rejects an empty cart',
    (await post('/api/orders', { ...CUSTOMER, lines: [] })).status === 422);
  assert('order rejects an unknown product id',
    (await post('/api/orders', {
      ...CUSTOMER, lines: [{ productId: 'p-does-not-exist', variantKey: 'a|b|c', quantity: 1 }],
    })).status >= 400);
  assert('order rejects an invalid PIN code',
    (await post('/api/orders', {
      ...CUSTOMER, pincode: '12',
      lines: [{ productId: 'p-iphone-14', variantKey: 'Midnight|128 GB|6 GB', quantity: 1 }],
    })).status === 422);

  // ── Payments (test mode) ───────────────────────────────────────────────
  const orderId = order.json?.order?.id;
  const intent = await post('/api/payments/create-intent', { orderId });
  assert('payment intent created', intent.status === 200, `status=${intent.status}`);
  assert('provider resolves to mock with no keys',
    intent.json?.payment?.provider === 'mock', intent.json?.payment?.provider);
  assert('isLive is false in test mode', intent.json?.payment?.isLive === false);
  assert('expected amount matches the order total',
    intent.json?.payment?.expectedAmountPaise === t?.grandTotalPaise);
  assert('no secret material in the response',
    !JSON.stringify(intent.json).toLowerCase().includes('secret'));

  const verify = await post('/api/payments/verify', {
    orderId, provider: 'mock', paymentReference: 'test_abc123',
  });
  assert('payment verified', verify.json?.verified === true, verify.json?.message);
  assert('order marked paid', verify.json?.order?.status === 'paid', verify.json?.order?.status);
  assert('captured on the order', verify.json?.order?.paymentStatus === 'captured');

  assert('mismatched provider refused',
    (await post('/api/payments/verify', {
      orderId, provider: 'razorpay', paymentReference: 'x',
    })).json?.verified === false);
  assert('unknown order refused',
    (await post('/api/payments/verify', {
      orderId: 'ord_does_not_exist', provider: 'mock', paymentReference: 'x',
    })).json?.verified === false);
  assert('cannot re-open a paid order',
    (await post('/api/payments/create-intent', { orderId })).status === 409);

  // ── Order lookup ───────────────────────────────────────────────────────
  const found = await get(`/api/orders?orderNumber=${order.json?.order?.orderNumber}`);
  assert('order lookup by number works', found.status === 200, `status=${found.status}`);
  assert('unknown order number returns 404',
    (await get('/api/orders?orderNumber=MEX00000000')).status === 404);
  assert('malformed order number is rejected',
    (await get("/api/orders?orderNumber=' OR 1=1--")).status === 400);

  console.log(`\norders + payments: ${counts()} failure(s)`);
  if (counts() > 0) process.exitCode = 1;
})();
