import 'server-only';
import { products as seedProducts } from '@/data/products';
import { accessories as seedAccessories } from '@/data/accessories';
import { db, id as makeId, now, rows } from '@/lib/db';
import { sanitizeText, slugify } from '@/lib/utils';
import type { AccessoryProduct, Product } from '@/types';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  Catalogue overlay
 * ────────────────────────────────────────────────────────────────────────────
 *  The bundled catalogue in `src/data/*.ts` stays the baseline. Rows in the
 *  `products` table layer on top of it, so the admin can change a price, a
 *  stock count, a discount or swap in a photo WITHOUT us losing the rich seed
 *  fields (specs, colours, highlights, gallery angles) that only exist in code.
 *
 *  An admin-created item has no seed counterpart, so it carries a full
 *  `payload` instead.
 *
 *  Seeding happens once. Deleting an admin-created row removes it; blanking a
 *  seeded row's fields resets that item back to its bundled values, because
 *  the overlay only overwrites what it has a value for.
 */

export type Kind = 'phone' | 'accessory';

interface CatalogueRow {
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
  images: string;
  active: number;
  discountPercent: number;
  featured: number;
  sku: string;
  highlights: string;
  compatibility: string;
  payload: string;
  createdAt: string;
  updatedAt: string;
}

function parseList(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function allRows(): CatalogueRow[] {
  return rows<CatalogueRow>(db.prepare('SELECT * FROM products').all() as unknown[]);
}


/* ── Seeding ──────────────────────────────────────────────────────────────── */

let seeded = false;

/**
 * Copies the bundled catalogue into the database the first time.
 *
 * This is what makes every existing phone and accessory editable from the
 * admin panel. After it runs, `src/data/*.ts` is only a fallback: the
 * database is the source of truth for anything the admin has touched.
 */
export function ensureCatalogueSeeded(): void {
  if (seeded) return;
  const has = db.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number };
  if (has.n > 0) {
    seeded = true;
    return;
  }

  const insert = db.prepare(
    `INSERT INTO products
       (id, kind, slug, name, brand, category, pricePaise, mrpPaise, stock,
        description, images, active, discountPercent, featured, sku, highlights,
        compatibility, payload, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, ?, ?, ?, '', ?, ?)`,
  );
  const ts = now();

  const run = () => {
    for (const p of seedProducts) {
      insert.run(
        p.id, 'phone', p.slug, p.name, p.brand, p.category, p.price, p.mrp,
        p.stock, p.description, JSON.stringify(p.images ?? []), p.sku,
        JSON.stringify(p.highlights ?? []), '[]', ts, ts,
      );
    }
    for (const a of seedAccessories) {
      insert.run(
        a.id, 'accessory', a.slug, a.name, a.brand, a.category, a.price, a.mrp,
        a.stock, a.description, JSON.stringify(a.image ? [a.image] : []), '',
        JSON.stringify(a.highlights ?? []), JSON.stringify(a.compatibility ?? []),
        ts, ts,
      );
    }
  };

  // Seeding is guarded by the count check above, but two build workers can
  // still race. Losing that race is fine -- it only means the rows now exist.
  try {
    run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/UNIQUE constraint failed/i.test(message)) throw error;
  }
  seeded = true;
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
export function overlayProducts(): Product[] {
  ensureCatalogueSeeded();
  const rows_ = allRows();
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

export function overlayAccessories(): AccessoryProduct[] {
  ensureCatalogueSeeded();
  const rows_ = allRows();
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
  const images = parseList(row.images);
  const highlights = parseList(row.highlights);
  const compatibility = parseList(row.compatibility);

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
  const photo = parseList(row.images)[0] ?? '';
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
    highlights: parseList(row.highlights),
    createdAt: row.createdAt,
    compatibility: parseList(row.compatibility),
  };
}

function buildPhone(row: CatalogueRow): Product {
  const base = baseOf(row);
  const photos = parseList(row.images);
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
    highlights: parseList(row.highlights),
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

/** Unique across phones and accessories, ignoring the row being edited. */
function uniqueSlug(base: string, kind: Kind, ignoreId?: string): string {
  const taken = new Set(
    allRows().filter((r) => r.kind === kind && r.id !== ignoreId).map((r) => r.slug),
  );
  let slug = base || 'item';
  let n = 2;
  while (taken.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export function createCatalogueItem(input: CatalogueInput) {
  ensureCatalogueSeeded();
  const ts = now();
  const row = {
    id: makeId('itm'),
    kind: input.kind,
    slug: uniqueSlug(slugify(input.name), input.kind),
    name: sanitizeText(input.name).slice(0, 120),
    brand: sanitizeText(input.brand ?? 'MobilExpertX').slice(0, 60),
    category: input.category ?? '',
    pricePaise: Math.round(input.pricePaise),
    mrpPaise: Math.round(input.mrpPaise ?? input.pricePaise),
    stock: Math.max(0, Math.round(input.stock ?? 0)),
    description: sanitizeText(input.description ?? '').slice(0, 4000),
    images: JSON.stringify((input.images ?? []).slice(0, 8)),
    active: input.active === false ? 0 : 1,
    discountPercent: Math.max(0, Math.round(input.discountPercent ?? 0)),
    featured: input.featured ? 1 : 0,
    sku: input.sku?.slice(0, 40) ?? '',
    highlights: JSON.stringify((input.highlights ?? []).slice(0, 10)),
    compatibility: JSON.stringify((input.compatibility ?? []).slice(0, 12)),
    payload: JSON.stringify(input.payload ?? {}),
    ts,
  };

  db.prepare(
    `INSERT INTO products
       (id, kind, slug, name, brand, category, pricePaise, mrpPaise, stock,
        description, images, active, discountPercent, featured, sku, highlights,
        compatibility, payload, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id, row.kind, row.slug, row.name, row.brand, row.category, row.pricePaise,
    row.mrpPaise, row.stock, row.description, row.images, row.active,
    row.discountPercent, row.featured, row.sku, row.highlights, row.compatibility,
    row.payload, row.ts, row.ts,
  );

  return db.prepare('SELECT * FROM products WHERE id = ?').get(row.id) as CatalogueRow;
}

export function getCatalogueRow(id: string): CatalogueRow | null {
  return (db.prepare('SELECT * FROM products WHERE id = ?').get(id) as CatalogueRow) ?? null;
}

export function deleteCatalogueItem(id: string): boolean {
  return db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0;
}

/** Flat rows for the admin table, newest first. */
export function listForAdmin(kind?: Kind): CatalogueRow[] {
  ensureCatalogueSeeded();
  return kind ? allRows().filter((r) => r.kind === kind) : allRows();
}

export function updateCatalogueItem(id: string, patch: Partial<CatalogueInput>) {
  const current = getCatalogueRow(id);
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
    images: patch.images ?? parseList(current.images),
    highlights: patch.highlights ?? parseList(current.highlights),
    compatibility: patch.compatibility ?? parseList(current.compatibility),
    active: patch.active ?? current.active === 1,
    featured: patch.featured ?? current.featured === 1,
    sku: patch.sku ?? current.sku,
    payload: patch.payload ?? safeJson(current.payload) ?? {},
  };

  db.prepare(
    `UPDATE products SET
       name = ?, brand = ?, category = ?, pricePaise = ?, mrpPaise = ?,
       stock = ?, description = ?, images = ?, active = ?, discountPercent = ?,
       featured = ?, sku = ?, highlights = ?, compatibility = ?, payload = ?,
       updatedAt = ?
     WHERE id = ?`,
  ).run(
    sanitizeText(merged.name).slice(0, 120),
    merged.brand,
    merged.category,
    Math.round(merged.pricePaise),
    Math.round(merged.mrpPaise ?? merged.pricePaise),
    merged.stock ?? 0,
    sanitizeText(merged.description ?? '').slice(0, 4000),
    JSON.stringify((merged.images ?? []).slice(0, 8)),
    merged.active === false ? 0 : 1,
    Math.max(0, Math.round(merged.discountPercent ?? 0)),
    merged.featured ? 1 : 0,
    merged.sku ?? '',
    JSON.stringify(merged.highlights ?? []),
    JSON.stringify(merged.compatibility ?? []),
    JSON.stringify(merged.payload ?? {}),
    now(),
    id,
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
