/**
 * Catalogue API tests: filtering, search, sorting and pagination.
 */
const { get, assert, counts } = require('./helpers.cjs');

(async () => {
  // ── Filters ────────────────────────────────────────────────────────────
  const refurbished = await get('/api/products?category=refurbished&pageSize=50');
  assert('filters by category',
    refurbished.json?.items?.length > 0 &&
    refurbished.json.items.every((p) => p.category === 'refurbished'),
    `count=${refurbished.json?.items?.length}`);

  const byBrand = await get('/api/products?brand=Apple');
  assert('filters by brand',
    byBrand.json?.items?.length > 0 && byBrand.json.items.every((p) => p.brand === 'Apple'),
    `count=${byBrand.json?.items?.length}`);

  const byCondition = await get('/api/products?condition=new');
  assert('filters by condition',
    byCondition.json?.items?.every((p) => p.condition === 'new'));

  const byRam = await get('/api/products?ram=16%20GB');
  assert('filters by RAM', byRam.json?.items?.every((p) => p.rams.includes('16 GB')));

  const byStorage = await get('/api/products?storage=512%20GB');
  assert('filters by storage', byStorage.json?.items?.every((p) => p.storages.includes('512 GB')));

  // priceRanges[1] = ₹15,000 – ₹30,000
  const priced = await get('/api/products?price=1&pageSize=50');
  assert('price range filter applies',
    priced.json?.items?.length > 0 &&
    priced.json.items.every((p) => p.price >= 1500000 && p.price <= 3000000),
    `count=${priced.json?.items?.length}`);

  const cheap = await get('/api/products?price=0&pageSize=50');
  assert('lowest price band applies',
    cheap.json?.items?.every((p) => p.price < 1500000),
    `count=${cheap.json?.items?.length}`);

  const inStock = await get('/api/products?stock=1&pageSize=50');
  assert('in-stock filter applies', inStock.json?.items?.every((p) => p.stock > 0));

  // ── Search ─────────────────────────────────────────────────────────────
  const searched = await get('/api/products?q=iphone');
  assert('full-text search works', searched.json?.items?.length > 0,
    `count=${searched.json?.items?.length}`);

  const searchedSpec = await get('/api/products?q=amoled');
  assert('search also matches spec text', searchedSpec.json?.items?.length > 0,
    `count=${searchedSpec.json?.items?.length}`);

  // ── Sorts ──────────────────────────────────────────────────────────────
  const asc = await get('/api/products?sort=price-asc&pageSize=50');
  const ascPrices = asc.json?.items?.map((p) => p.price) ?? [];
  assert('sort price ascending', ascPrices.every((v, i) => i === 0 || ascPrices[i - 1] <= v));

  const desc = await get('/api/products?sort=price-desc&pageSize=50');
  const descPrices = desc.json?.items?.map((p) => p.price) ?? [];
  assert('sort price descending', descPrices.every((v, i) => i === 0 || descPrices[i - 1] >= v));

  const rating = await get('/api/products?sort=rating&pageSize=50');
  const ratings = rating.json?.items?.map((p) => p.rating) ?? [];
  assert('sort by rating', ratings.every((v, i) => i === 0 || ratings[i - 1] >= v));

  const newest = await get('/api/products?sort=newest&pageSize=50');
  const dates = newest.json?.items?.map((p) => +new Date(p.createdAt)) ?? [];
  assert('sort by newest', dates.every((v, i) => i === 0 || dates[i - 1] >= v));

  // ── Pagination ─────────────────────────────────────────────────────────
  const p1 = await get('/api/products?pageSize=4&page=1');
  const p2 = await get('/api/products?pageSize=4&page=2');
  assert('pagination returns distinct pages', p1.json?.items?.[0]?.id !== p2.json?.items?.[0]?.id);
  assert('pagination reports hasMore', p1.json?.hasMore === true);
  assert('pagination reports a total', p1.json?.total > 16, `total=${p1.json?.total}`);

  const combined = await get('/api/products?category=flagship&condition=new&sort=price-asc&pageSize=50');
  assert('filters combine correctly',
    combined.json?.items?.every((p) => p.category === 'flagship' && p.condition === 'new'),
    `count=${combined.json?.items?.length}`);

  console.log(`\ncatalogue: ${counts()} failure(s)`);
  if (counts() > 0) process.exitCode = 1;
})();
