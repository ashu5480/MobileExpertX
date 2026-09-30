import 'server-only';
import { id, listings as listingsCollection, now } from '@/lib/mongo';
import { sanitizeText } from '@/lib/utils';
import {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  type Listing,
  type ListingCategory,
  type ListingCondition,
  type ListingInput,
} from '@/lib/listing-shared';

/**
 * Customer listings -- the "my items" area. Server-only: it queries MongoDB.
 *
 * Types and validation live in `@/lib/listing-shared` so client components
 * can import them without pulling the database into the browser bundle.
 *
 * Every read and write is scoped by `userId`, so one customer can never see
 * or edit another customer's item by guessing an id.
 */

export { LISTING_CATEGORIES, LISTING_CONDITIONS, type Listing, type ListingInput };

/** Maps a stored document onto the public shape the UI consumes. */
function hydrate(r: {
  _id: string;
  userId: string;
  title: string;
  description: string;
  pricePaise: number;
  category: string;
  condition: string;
  photos: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): Listing {
  return {
    id: r._id,
    userId: r.userId,
    title: r.title,
    description: r.description,
    pricePaise: r.pricePaise,
    category: r.category,
    condition: r.condition,
    photos: r.photos ?? [],
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ── Reads ────────────────────────────────────────────────────────────────── */

export async function listForUser(
  userId: string,
  page = 1,
  pageSize = 10,
): Promise<Page<Listing>> {
  const collection = await listingsCollection();
  const current = Math.max(1, page);

  // A real count, so the page count is always exactly right: 10 items shows
  // one page, the 11th creates a second.
  const total = await collection.countDocuments({ userId });

  // skip/limit bound the read, so "10 items" means 10 documents touched.
  const data = await collection
    .find({ userId })
    .sort({ createdAt: -1, _id: -1 })
    .skip((current - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  return {
    items: data.map(hydrate),
    total,
    page: current,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getOwned(userId: string, listingId: string): Promise<Listing | null> {
  const found = await (await listingsCollection()).findOne({ _id: listingId, userId });
  return found ? hydrate(found) : null;
}

/**
 * Every listing from every customer, with the seller's name and email joined
 * in. The old SQL did this with a JOIN; `$lookup` is the Mongo equivalent and
 * keeps it to a single round trip.
 */
export async function listAll(
  page = 1,
  pageSize = 20,
): Promise<Page<Listing & { ownerName: string; ownerEmail: string }>> {
  const collection = await listingsCollection();
  const current = Math.max(1, page);

  const total = await collection.countDocuments({});

  const data = await collection
    .aggregate<{
      _id: string;
      userId: string;
      title: string;
      description: string;
      pricePaise: number;
      category: string;
      condition: string;
      photos: string[];
      status: string;
      createdAt: Date;
      updatedAt: Date;
      owner: Array<{ name: string; email: string }>;
    }>([
      { $sort: { createdAt: -1 } },
      { $skip: (current - 1) * pageSize },
      { $limit: pageSize },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'owner',
          pipeline: [{ $project: { _id: 0, name: 1, email: 1 } }],
        },
      },
    ])
    .toArray();

  return {
    items: data.map((r) => ({
      ...hydrate(r),
      ownerName: r.owner?.[0]?.name ?? '—',
      ownerEmail: r.owner?.[0]?.email ?? '—',
    })),
    total,
    page: current,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}



/* ── Writes ───────────────────────────────────────────────────────────────── */

export async function createListing(userId: string, input: ListingInput): Promise<Listing> {
  const record = {
    _id: id('lst'),
    userId,
    title: sanitizeText(input.title).slice(0, 120),
    description: sanitizeText(input.description).slice(0, 4000),
    pricePaise: Math.max(0, Math.round(input.pricePaise)),
    category: LISTING_CATEGORIES.includes(input.category as ListingCategory)
      ? input.category
      : 'phone',
    condition: LISTING_CONDITIONS.includes(input.condition as ListingCondition)
      ? input.condition
      : 'used',
    photos: (input.photos ?? []).slice(0, 6),
    status: 'active',
    createdAt: now(),
    updatedAt: now(),
  };

  await (await listingsCollection()).insertOne(record);
  return hydrate(record);
}

export async function updateListing(
  userId: string,
  listingId: string,
  input: Partial<ListingInput> & { status?: string },
): Promise<Listing | null> {
  const current = await getOwned(userId, listingId);
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
    photos: (input.photos ?? current.photos).slice(0, 6),
    status: input.status ?? current.status,
  };

  // The userId stays in the filter, so this can only ever touch a row the
  // caller owns even if the id was guessed.
  await (await listingsCollection()).updateOne(
    { _id: listingId, userId },
    { $set: { ...next, updatedAt: now() } },
  );
  return getOwned(userId, listingId);
}

export async function deleteListing(userId: string, listingId: string): Promise<boolean> {
  const result = await (await listingsCollection()).deleteOne({ _id: listingId, userId });
  return result.deletedCount > 0;
}

/** Admin path -- deliberately not scoped to an owner. */
export async function setListingStatus(listingId: string, status: string): Promise<boolean> {
  const result = await (await listingsCollection()).updateOne(
    { _id: listingId },
    { $set: { status, updatedAt: now() } },
  );
  return result.matchedCount > 0;
}

