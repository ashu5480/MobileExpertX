import 'server-only';
import { db, id, now, rows } from '@/lib/db';
import { sanitizeText } from '@/lib/utils';

/**
 * Customer listings -- the "my items" area.
 *
 * Every read and write is scoped by `userId`, so one customer can never see
 * or edit another customer's item by guessing an id.
 */

export const LISTING_CATEGORIES = ['phone', 'tablet', 'laptop', 'accessory'] as const;
export const LISTING_CONDITIONS = ['new', 'used', 'refurbished'] as const;

export interface Listing {
  id: string;
  userId: string;
  title: string;
  description: string;
  pricePaise: number;
  category: string;
  condition: string;
  photos: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ListingRow {
  id: string;
  userId: string;
  title: string;
  description: string;
  pricePaise: number;
  category: string;
  condition: string;
  photos: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function safeParse(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : [];
  } catch {
    return [];
  }
}

function hydrate(r: ListingRow): Listing {
  return { ...r, photos: safeParse(r.photos) };
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ── Reads ────────────────────────────────────────────────────────────────── */

export function listForUser(userId: string, page = 1, pageSize = 10): Page<Listing> {
  const total = (
    db.prepare('SELECT COUNT(*) AS n FROM listings WHERE userId = ?').get(userId) as {
      n: number;
    }
  ).n;

  // LIMIT/OFFSET bound the read, so "10 items" means 10 rows touched --
  // not the whole table loaded into memory and sliced in JavaScript.
  const data = rows<ListingRow>(
    db
      .prepare(
        `SELECT * FROM listings WHERE userId = ?
          ORDER BY createdAt DESC, id DESC
          LIMIT ? OFFSET ?`,
      )
      .all(userId, pageSize, (Math.max(1, page) - 1) * pageSize),
  );

  return {
    items: data.map(hydrate),
    total,
    page: Math.max(1, page),
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function getOwned(userId: string, listingId: string): Listing | null {
  const found = db
    .prepare('SELECT * FROM listings WHERE id = ? AND userId = ?')
    .get(listingId, userId) as ListingRow | undefined;
  return found ? hydrate(found) : null;
}

export function listAll(page = 1, pageSize = 20): Page<Listing & { ownerName: string; ownerEmail: string }> {
  const total = (db.prepare('SELECT COUNT(*) AS n FROM listings').get() as { n: number }).n;
  const data = db
    .prepare(
      `SELECT l.*, u.name AS ownerName, u.email AS ownerEmail
         FROM listings l JOIN users u ON u.id = l.userId
        ORDER BY l.createdAt DESC
        LIMIT ? OFFSET ?`,
    )
    .all(pageSize, (Math.max(1, page) - 1) * pageSize) as Array<
    ListingRow & { ownerName: string; ownerEmail: string }
  >;

  return {
    items: data.map((r) => ({ ...hydrate(r), ownerName: r.ownerName, ownerEmail: r.ownerEmail })),
    total,
    page: Math.max(1, page),
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}


/* ── Writes ───────────────────────────────────────────────────────────────── */

export interface ListingInput {
  title: string;
  description: string;
  pricePaise: number;
  category: string;
  condition: string;
  photos: string[];
}

export function createListing(userId: string, input: ListingInput): Listing {
  const record = {
    id: id('lst'),
    userId,
    title: sanitizeText(input.title).slice(0, 120),
    description: sanitizeText(input.description).slice(0, 4000),
    pricePaise: Math.max(0, Math.round(input.pricePaise)),
    category: LISTING_CATEGORIES.includes(input.category as never) ? input.category : 'phone',
    condition: LISTING_CONDITIONS.includes(input.condition as never)
      ? input.condition
      : 'used',
    photos: JSON.stringify(input.photos.slice(0, 6)),
    status: 'active',
    createdAt: now(),
    updatedAt: now(),
  };

  db.prepare(
    `INSERT INTO listings
       (id, userId, title, description, pricePaise, category, condition,
        photos, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.userId,
    record.title,
    record.description,
    record.pricePaise,
    record.category,
    record.condition,
    record.photos,
    record.status,
    record.createdAt,
    record.updatedAt,
  );
  return hydrate(record as ListingRow);
}

export function updateListing(
  userId: string,
  listingId: string,
  input: Partial<ListingInput> & { status?: string },
): Listing | null {
  const current = getOwned(userId, listingId);
  if (!current) return null;

  const next = {
    title: input.title ? sanitizeText(input.title).slice(0, 120) : current.title,
    description:
      input.description !== undefined
        ? sanitizeText(input.description).slice(0, 4000)
        : current.description,
    pricePaise:
      input.pricePaise !== undefined
        ? Math.max(0, Math.round(input.pricePaise))
        : current.pricePaise,
    category: input.category ?? current.category,
    condition: input.condition ?? current.condition,
    photos: JSON.stringify((input.photos ?? current.photos).slice(0, 6)),
    status: input.status ?? current.status,
  };

  db.prepare(
    `UPDATE listings
        SET title = ?, description = ?, pricePaise = ?, category = ?,
            condition = ?, photos = ?, status = ?, updatedAt = ?
      WHERE id = ? AND userId = ?`,
  ).run(
    next.title,
    next.description,
    next.pricePaise,
    next.category,
    next.condition,
    next.photos,
    next.status,
    now(),
    listingId,
    userId,
  );
  return getOwned(userId, listingId);
}

export function deleteListing(userId: string, listingId: string): boolean {
  return (
    db.prepare('DELETE FROM listings WHERE id = ? AND userId = ?').run(listingId, userId)
      .changes > 0
  );
}

/** Admin path -- deliberately not scoped to an owner. */
export function setListingStatus(listingId: string, status: string): boolean {
  return (
    db
      .prepare('UPDATE listings SET status = ?, updatedAt = ? WHERE id = ?')
      .run(status, now(), listingId).changes > 0
  );
}
