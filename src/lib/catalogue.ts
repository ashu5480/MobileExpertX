import 'server-only';
import { products as seedProducts } from '@/data/products';
import { accessories as seedAccessories } from '@/data/accessories';
import { id as makeId, isDuplicateKey, now, products as productsCollection, type ProductDoc } from '@/lib/mongo';
import { sanitizeText, slugify } from '@/lib/utils';
import type { AccessoryProduct, Product } from '@/types';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  Catalogue overlay
 * ────────────────────────────────────────────────────────────────────────────
 *  The bundled catalogue in `src/data/*.ts` stays the baseline. Documents in
 *  the `products` collection layer on top of it, so the admin can change a
 *  price, a stock count, a discount or swap in a photo WITHOUT us losing the
 *  rich seed fields (specs, colours, highlights, gallery angles) that only
 *  exist in code.
 *
 *  An admin-created item has no seed counterpart, so it carries a full
 *  `payload` instead.
 *
 *  Seeding happens once. Deleting an admin-created document removes it;
 *  blanking a seeded document's fields resets that item back to its bundled
 *  values, because the overlay only overwrites what it has a value for.
 *
 *  Arrays and booleans are stored natively (`images: string[]`, `active:
 *  boolean`) rather than as the JSON strings and 0/1 integers SQLite forced,
 *  so the overlay logic reads the same values it always did.
 */

export type Kind = 'phone' | 'accessory';

/**
 * A catalogue row as the admin UI consumes it.
 *
 * Kept deliberately identical to the shape the admin pages already expect, so
 * the overlay change is invisible above this module.
 */
export interface CatalogueRow {
  id: string;
  kind: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  pricePaise: number;
  mrpPaise: number;
  stock: number;
  description: string;
  images: string[];
  active: number;
  discountPercent: number;
  featured: number;
  sku: string;
  highlights: string[];
  compatibility: string[];
  payload: string;
  createdAt: string;
  updatedAt: string;
}

/** MongoDB document -> the row shape above. */
function toRow(d: ProductDoc): CatalogueRow {
  return {
    id: d._id,
    kind: d.kind,
    slug: d.slug,
    name: d.name,
    brand: d.brand,
    category: d.category,
    pricePaise: d.pricePaise,
    mrpPaise: d.mrpPaise,
    stock: d.stock,
    description: d.description,
    images: d.images ?? [],
    active: d.active ? 1 : 0,
    discountPercent: d.discountPercent,
    featured: d.featured ? 1 : 0,
    sku: d.sku,
    highlights: d.highlights ?? [],
    compatibility: d.compatibility ?? [],
    payload: JSON.stringify(d.payload ?? {}),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

async function allRows(): Promise<CatalogueRow[]> {
  const docs = await (await productsCollection()).find({}).toArray();
  return docs.map(toRow);
}



/* ── Seeding ──────────────────────────────────────────────────────────────── */

/**
 * Copies the bundled catalogue into the database the first time.
 *
 * This is what makes every existing phone and accessory editable from the
 * admin panel. After it runs, `src/data/*.ts` is only a fallback: the
 * database is the source of truth for anything the admin has touched.
 *
 * The `seeded` flag is a per-instance optimisation only. The authoritative
 * guard is the count check below, so a cold start that loses the flag simply
 * re-checks and finds the rows already there — it never re-seeds.
 */
let seedPromise: Promise<void> | null = null;

export function ensureCatalogueSeeded(): Promise<void> {
  seedPromise ??= seedOnce().catch((error) => {
    // Let the next call retry rather than caching a failure forever.
    seedPromise = null;
    throw error;
  });
  return seedPromise;
}

async function seedOnce(): Promise<void> {
  const collection = await productsCollection();

  // `estimatedDocumentCount` is O(1) here because we only need "is it empty",
  // never an exact number.
  if ((await collection.estimatedDocumentCount()) > 0) return;

  const ts = now();
  const docs: ProductDoc[] = [
    ...seedProducts.map(
      (p): ProductDoc => ({
        _id: p.id,
        kind: 'phone',
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        category: p.category,
        pricePaise: p.price,
        mrpPaise: p.mrp,
        stock: p.stock,
        description: p.description,
        // Seed galleries are `ProductImage[]`; the overlay stores bare URL
        // strings, so keep only the url of each.
        images: (p.images ?? []).map((img) => img.url).filter(Boolean),
        active: true,
        discountPercent: 0,
        featured: false,
        sku: p.sku,
        highlights: p.highlights ?? [],
        compatibility: [],
        payload: {},
        createdAt: ts,
        updatedAt: ts,
      }),
    ),
    ...seedAccessories.map(
      (a): ProductDoc => ({
        _id: a.id,
        kind: 'accessory',
        slug: a.slug,
        name: a.name,
        brand: a.brand,
        category: a.category,
        pricePaise: a.price,
        mrpPaise: a.mrp,
        stock: a.stock,
        description: a.description,
        images: a.image ? [a.image] : [],
        active: true,
        discountPercent: 0,
        featured: false,
        sku: '',
        highlights: a.highlights ?? [],
        compatibility: a.compatibility ?? [],
        payload: {},
        createdAt: ts,
        updatedAt: ts,
      }),
    ),
  ];

  try {
    // `ordered: false` upserts the whole seed in one round trip, and the
    // unique `_id` makes a concurrent seeder a no-op rather than a duplicate.
    await collection.bulkWrite(
      docs.map((d) => ({
        updateOne: {
          filter: { _id: d._id },
          update: { $setOnInsert: d },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  } catch (error) {
    // Losing a seeding race is fine -- it only means the rows now exist.
    if (!isDuplicateKey(error)) throw error;
  }
}



/* ── Overlay reads ────────────────────────────────────────────────────────── */

/** True when the overlay actually holds a value worth applying. */
const has = (v: unknown): boolean =>
  v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0);

/**
 * Products for the storefront: the seed baseline with admin overrides applied.
 *
 * A blank `name` on the row counts as "not overridden", so an admin can clear
 * a field to fall back to the bundled copy instead of blanking the storefront.
 */
export async function overlayProducts(): Promise<Product[]> {
  await ensureCatalogueSeeded();
  const rows_ = await allRows();
  const byId = new Map(rows_.map((r) => [r.id, r]));

  const merged = seedProducts.map((p) => {
    const row = byId.get(p.id);
    return row ? (applyRow(p, row) as Product) : p;
  });

  // Admin-created phones have no seed counterpart to merge into.
  const extras = rows_.filter(
    (r) => r.kind === 'phone' && !seedProducts.some((p) => p.id === r.id),
  );
  return [...merged, ...extras.map(buildPhone)];
}

export async function overlayAccessories(): Promise<AccessoryProduct[]> {
  await ensureCatalogueSeeded();
  const rows_ = await allRows();
  const byId = new Map(rows_.map((r) => [r.id, r]));

  const merged = seedAccessories.map((a) => {
    const row = byId.get(a.id);
    return row ? (applyRow(a, row) as AccessoryProduct) : a;
  });

  const extras = rows_.filter(
    (r) => r.kind === 'accessory' && !seedAccessories.some((a) => a.id === r.id),
  );
  return [...merged, ...extras.map(buildAccessory)];
}

/**
 * Layers one admin row over a seed object, field by field.
 *
 * Typed on `object` rather than `Record<string, unknown>` because Product and
 * AccessoryProduct are plain interfaces with no index signature.
 */
function applyRow<T extends object>(base: T, row: CatalogueRow): T {
  // These are native arrays on the document now, so no JSON parsing here.
  const images = row.images ?? [];
  const highlights = row.highlights ?? [];
  const compatibility = row.compatibility ?? [];

  const next = { ...base } as Record<string, unknown>;

  if (row.name) next.name = row.name;
  if (row.brand) next.brand = row.brand;
  if (row.slug) next.slug = row.slug;
  if (row.description) next.description = row.description;
  if (row.pricePaise > 0) next.price = row.pricePaise;
  if (row.mrpPaise > 0) next.mrp = row.mrpPaise;
  if (Number.isFinite(row.stock)) next.stock = row.stock;
  if (row.sku) next.sku = row.sku;
  if (row.active === 0) next.active = false;

  // A discount is applied to the MRP, so the "was" price stays truthful and
  // the badge matches whatever the admin typed.
  if (row.discountPercent > 0) {
    const mrp = row.mrpPaise > 0 ? row.mrpPaise : Number(next.mrp ?? 0);
    next.mrp = mrp;
    next.price = Math.round((mrp * (100 - row.discountPercent)) / 100);
  } else if (row.mrpPaise > 0 && row.pricePaise <= 0) {
    next.price = row.mrpPaise;
  }

  if (has(highlights)) next.highlights = highlights;
  if (has(compatibility)) next.compatibility = compatibility;

  // A single uploaded photo maps to the accessory `image` field, and to the
  // first gallery slot for a phone.
  const photo = images[0];
  if (photo) {
    if (next.category !== undefined && String(next.category).includes('-')) {
      next.image = photo;
    } else if (Array.isArray(next.images)) {
      next.images = [{ url: photo, alt: row.name, view: 'front' as const }];
    }
  }

  return next as T;
}

/* ── Builders for admin-created items ─────────────────────────────────────── */

function baseOf(row: CatalogueRow): Record<string, unknown> {
  const payload = (() => {
    try {
      return row.payload ? JSON.parse(row.payload) : {};
    } catch {
      return {};
    }
  })();
  return { ...payload, name: row.name, slug: row.slug, brand: row.brand };
}

function buildAccessory(row: CatalogueRow): AccessoryProduct {
  const base = baseOf(row);
  const photo = (row.images ?? [])[0] ?? '';
  const mrp = row.mrpPaise || row.pricePaise;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand || 'MobilExpertX',
    category: (row.category || 'other') as AccessoryProduct['category'],
    price: row.pricePaise || mrp,
    mrp,
    rating: Number(base.rating ?? 4.5),
    reviewCount: Number(base.reviewCount ?? 0),
    image: photo,
    accent: String(base.accent ?? '#10B981'),
    description: row.description,
    stock: row.stock,
    highlights: row.highlights ?? [],
    createdAt: row.createdAt,
    compatibility: row.compatibility ?? [],
  };
}

function buildPhone(row: CatalogueRow): Product {
  const base = baseOf(row);
  const photos = row.images ?? [];
  const mrp = row.mrpPaise || row.pricePaise;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand || 'MobilExpertX',
    model: String(base.model ?? row.name),
    condition: (base.condition ?? 'new') as Product['condition'],
    category: (row.category || 'mid-range') as Product['category'],
    price: row.pricePaise || mrp,
    mrp,
    rating: Number(base.rating ?? 4.5),
    reviewCount: Number(base.reviewCount ?? 0),
    images: photos.length
      ? photos.map((url) => ({ url, alt: row.name, view: 'front' as const }))
      : [],
    colors: (base.colors ?? [{ name: 'Black', hex: '#1B2233' }]) as Product['colors'],
    storages: (base.storages ?? ['128 GB']) as string[],
    rams: (base.rams ?? ['6 GB']) as string[],
    highlights: row.highlights ?? [],
    description: row.description,
    specs: (base.specs ?? []) as Product['specs'],
    stock: row.stock,
    sku: row.sku || row.id.toUpperCase(),
    warranty: String(base.warranty ?? '1 year on every new device'),
    tags: (base.tags ?? []) as Product['tags'],
    createdAt: row.createdAt,
    accent: String(base.accent ?? '#10B981'),
    batteryHealth: base.batteryHealth as number | undefined,
    installedOS: base.installedOS as string | undefined,
  };
}

/* ── Admin writes ─────────────────────────────────────────────────────────── */

export interface CatalogueInput {
  kind: Kind;
  name: string;
  brand?: string;
  category?: string;
  pricePaise: number;
  mrpPaise?: number;
  discountPercent?: number;
  stock?: number;
  description?: string;
  images?: string[];
  highlights?: string[];
  compatibility?: string[];
  active?: boolean;
  featured?: boolean;
  sku?: string;
  payload?: Record<string, unknown>;
}

/** Validation shared by the API route and the form. */
export function validateCatalogue(input: CatalogueInput): string | null {
  if (!input.kind || (input.kind !== 'phone' && input.kind !== 'accessory')) {
    return 'Pick phone or accessory.';
  }
  if (input.name.trim().length < 3) return 'Give the item a name.';
  if (input.name.length > 120) return 'That name is too long.';
  if (input.pricePaise <= 0) return 'Enter a valid price.';

  const discount = input.discountPercent ?? 0;
  if (discount < 0 || discount > 95) return 'Discount must be between 0 and 95%.';
  if (discount > 0 && (input.mrpPaise ?? 0) <= 0) {
    return 'Set the MRP before applying a discount.';
  }
  if ((input.mrpPaise ?? 0) > 0 && input.mrpPaise! < input.pricePaise) {
    return 'The MRP cannot be lower than the selling price.';
  }
  if ((input.stock ?? 0) < 0) return 'Stock cannot be negative.';
  return null;
}

/** Unique across phones and accessories, ignoring the document being edited. */
async function uniqueSlug(base: string, kind: Kind, ignoreId?: string): Promise<string> {
  const taken = new Set(
    (await allRows())
      .filter((r) => r.kind === kind && r.id !== ignoreId)
      .map((r) => r.slug),
  );
  let slug = base || 'item';
  let n = 2;
  while (taken.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export async function createCatalogueItem(input: CatalogueInput): Promise<CatalogueRow> {
  await ensureCatalogueSeeded();
  const ts = now();
  const collection = await productsCollection();
  const row: ProductDoc = {
    _id: makeId('itm'),
    kind: input.kind,
    slug: await uniqueSlug(slugify(input.name), input.kind),
    name: sanitizeText(input.name).slice(0, 120),
    brand: sanitizeText(input.brand ?? 'MobilExpertX').slice(0, 60),
    category: input.category ?? '',
    pricePaise: Math.round(input.pricePaise),
    mrpPaise: Math.round(input.mrpPaise ?? input.pricePaise),
    stock: Math.max(0, Math.round(input.stock ?? 0)),
    description: sanitizeText(input.description ?? '').slice(0, 4000),
    images: (input.images ?? []).slice(0, 8),
    active: input.active !== false,
    discountPercent: Math.max(0, Math.round(input.discountPercent ?? 0)),
    featured: Boolean(input.featured),
    sku: input.sku?.slice(0, 40) ?? '',
    highlights: (input.highlights ?? []).slice(0, 10),
    compatibility: (input.compatibility ?? []).slice(0, 12),
    payload: input.payload ?? {},
    createdAt: ts,
    updatedAt: ts,
  };

  await collection.insertOne(row);
  return toRow(row);
}

export async function getCatalogueRow(id: string): Promise<CatalogueRow | null> {
  const found = await (await productsCollection()).findOne({ _id: id });
  return found ? toRow(found) : null;
}

export async function deleteCatalogueItem(id: string): Promise<boolean> {
  const result = await (await productsCollection()).deleteOne({ _id: id });
  return result.deletedCount > 0;
}

/** Flat rows for the admin table, newest first. */
export async function listForAdmin(kind?: Kind): Promise<CatalogueRow[]> {
  await ensureCatalogueSeeded();
  const rows_ = await allRows();
  return kind ? rows_.filter((r) => r.kind === kind) : rows_;
}

export async function updateCatalogueItem(
  id: string,
  patch: Partial<CatalogueInput>,
): Promise<CatalogueRow | null> {
  const current = await getCatalogueRow(id);
  if (!current) return null;

  const merged: CatalogueInput = {
    kind: patch.kind ?? (current.kind as Kind),
    name: patch.name ?? current.name,
    brand: patch.brand ?? current.brand,
    category: patch.category ?? current.category,
    pricePaise: patch.pricePaise ?? current.pricePaise,
    mrpPaise: patch.mrpPaise ?? current.mrpPaise,
    discountPercent: patch.discountPercent ?? current.discountPercent,
    stock: patch.stock ?? current.stock,
    description: patch.description ?? current.description,
    images: patch.images ?? current.images,
    highlights: patch.highlights ?? current.highlights,
    compatibility: patch.compatibility ?? current.compatibility,
    active: patch.active ?? current.active === 1,
    featured: patch.featured ?? current.featured === 1,
    sku: patch.sku ?? current.sku,
    payload: patch.payload ?? safeJson(current.payload) ?? {},
  };

  await (await productsCollection()).updateOne(
    { _id: id },
    {
      $set: {
        name: sanitizeText(merged.name).slice(0, 120),
        brand: merged.brand,
        category: merged.category,
        pricePaise: Math.round(merged.pricePaise),
        mrpPaise: Math.round(merged.mrpPaise ?? merged.pricePaise),
        stock: merged.stock ?? 0,
        description: sanitizeText(merged.description ?? '').slice(0, 4000),
        images: (merged.images ?? []).slice(0, 8),
        active: merged.active !== false,
        discountPercent: Math.max(0, Math.round(merged.discountPercent ?? 0)),
        featured: Boolean(merged.featured),
        sku: merged.sku ?? '',
        highlights: merged.highlights ?? [],
        compatibility: merged.compatibility ?? [],
        payload: merged.payload ?? {},
        updatedAt: now(),
      },
    },
  );

  return getCatalogueRow(id);
}


function safeJson(json: string): Record<string, unknown> | null {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}
