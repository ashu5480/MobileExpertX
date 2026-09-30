/**
 * Sell-phone valuation, repair booking and contact API tests.
 * Run against a production build: npm run build && npm start, then npm test
 */
const { post, get, assert, QUOTE_BASE, counts } = require('./helpers.cjs');

(async () => {
  // ── Sell-phone quote (server-authoritative valuation) ──────────────────
  const q1 = await post('/api/sell-phone/quote', QUOTE_BASE);
  assert('quote accepts valid input', q1.status === 200, `status=${q1.status}`);
  assert('quote returns an estimate', q1.json?.quote?.estimatedValuePaise > 0,
    `value=${q1.json?.quote?.estimatedValuePaise}`);
  assert('quote returns a low/high band', q1.json?.quote?.lowPaise < q1.json?.quote?.highPaise);
  assert('quote explains itself', Array.isArray(q1.json?.quote?.breakdown));

  const q2 = await post('/api/sell-phone/quote', { ...QUOTE_BASE, storage: '512 GB' });
  assert('512GB is valued above 256GB',
    q2.json?.quote?.estimatedValuePaise > q1.json?.quote?.estimatedValuePaise,
    `${q1.json?.quote?.estimatedValuePaise} -> ${q2.json?.quote?.estimatedValuePaise}`);

  const q3 = await post('/api/sell-phone/quote', {
    ...QUOTE_BASE,
    condition: 'fair', screen: 'cracked', battery: 'worn', body: 'damaged',
    accessories: [], hasOriginalBox: false, purchaseAge: '24-36',
  });
  assert('worse condition is valued lower',
    q3.json?.quote?.estimatedValuePaise < q1.json?.quote?.estimatedValuePaise,
    `${q1.json?.quote?.estimatedValuePaise} -> ${q3.json?.quote?.estimatedValuePaise}`);

  assert('quote rejects invalid input',
    (await post('/api/sell-phone/quote', { brand: 'Apple' })).status === 422);

  // ── Device grading (Superb / Good / Fair / Not working) ─────────────────
  // The grade is derived from the condition answers, never accepted as input,
  // so a tampered client cannot inflate its own quote by claiming "Superb".
  assert('quote returns a grade', typeof q1.json?.quote?.grade?.grade === 'string',
    `grade=${q1.json?.quote?.grade?.grade}`);
  assert('mint phone grades superb',
    q1.json?.quote?.grade?.grade === 'superb',
    `got ${q1.json?.quote?.grade?.grade}`);
  assert('grade explains itself to the customer',
    typeof q1.json?.quote?.grade?.reason === 'string' &&
      q1.json?.quote?.grade?.reason.length > 0);

  // A perfect screen with a scuffed body must NOT reach the top band.
  const scuffed = await post('/api/sell-phone/quote', { ...QUOTE_BASE, body: 'minor' });
  assert('cosmetic wear drops superb to good',
    scuffed.json?.quote?.grade?.grade === 'good',
    `got ${scuffed.json?.quote?.grade?.grade}`);
  assert('a lower grade is valued lower',
    scuffed.json?.quote?.estimatedValuePaise < q1.json?.quote?.estimatedValuePaise,
    `${q1.json?.quote?.estimatedValuePaise} -> ${scuffed.json?.quote?.estimatedValuePaise}`);

  const crackedScreen = await post('/api/sell-phone/quote', { ...QUOTE_BASE, screen: 'cracked' });
  assert('a cracked screen caps the grade below superb',
    crackedScreen.json?.quote?.grade?.grade !== 'superb',
    `got ${crackedScreen.json?.quote?.grade?.grade}`);

  const dead = await post('/api/sell-phone/quote', {
    ...QUOTE_BASE, condition: 'broken', screen: 'broken', battery: 'poor', body: 'damaged',
  });
  assert('a dead phone is graded not-working',
    dead.json?.quote?.grade?.grade === 'non-working',
    `got ${dead.json?.quote?.grade?.grade}`);

  // A client sending a fake grade must be ignored, not trusted.
  const spoofed = await post('/api/sell-phone/quote', { ...QUOTE_BASE, grade: 'superb' });
  assert('a client-supplied grade is ignored',
    spoofed.json?.quote?.grade?.grade === 'superb',
    `got ${spoofed.json?.quote?.grade?.grade}`);

  // ── Repair service catalogue (the /repair picker) ────────────────────────
  const svc = await get('/api/repairs');
  assert('repair services are listable', Array.isArray(svc.json?.services) && svc.json.services.length > 0,
    `count=${svc.json?.services?.length}`);
  assert('each service exposes price, turnaround and warranty',
    svc.json.services.every(
      (s) => s.startingPrice > 0 && typeof s.turnaround === 'string' && typeof s.warranty === 'string',
    ));

  // ── Repair booking ─────────────────────────────────────────────────────
  const rep = await post('/api/repairs', {
    name: 'Test Customer', phone: '9876543210', email: 'test@example.com',
    brand: 'Apple', model: 'iPhone 15 Pro',
    problem: 'The screen cracked after a drop and touch is unresponsive.',
    serviceSlug: 'screen-replacement',
    preferredDate: '2099-01-15', preferredTime: '10:00 AM – 11:30 AM',
    dropoff: 'walk-in',
  });
  assert('repair booking accepted', rep.status === 201, `status=${rep.status}`);
  assert('repair reference generated', /^REP-[A-Z0-9]{6}$/.test(rep.json?.booking?.reference || ''),
    rep.json?.booking?.reference);
  assert('repair estimate attached from the service', rep.json?.booking?.estimatedFromPaise > 0);

  assert('repair rejects invalid input',
    (await post('/api/repairs', { name: 'x', phone: 'abc' })).status === 422);
  assert('repair rejects a past date',
    (await post('/api/repairs', {
      name: 'Test Customer', phone: '9876543210', brand: 'Apple', model: 'iPhone 15 Pro',
      problem: 'Screen is completely shattered and will not respond to touch.',
      preferredDate: '2020-01-01', preferredTime: '10:00 AM – 11:30 AM', dropoff: 'pickup',
    })).status === 422);

  // ── Contact ────────────────────────────────────────────────────────────
  const con = await post('/api/contact', {
    name: 'Test Customer', phone: '9876543210', email: 'test@example.com',
    subject: 'Which phone is best?', message: 'I want a phone under 30000 with a good camera.',
  });
  assert('contact accepted', con.status === 201, `status=${con.status}`);

  const conXss = await post('/api/contact', {
    name: '<script>alert(1)</script>Bob', phone: '9876543210', email: 'test@example.com',
    subject: 'Hello', message: '<img src=x onerror=alert(1)> testing sanitisation here.',
  });
  assert('contact strips markup from the stored name',
    !String(conXss.json?.inquiry?.name).includes('<'), JSON.stringify(conXss.json?.inquiry?.name));

  console.log(`\nservices: ${counts()} failure(s)`);
  if (counts() > 0) process.exitCode = 1;
})();
