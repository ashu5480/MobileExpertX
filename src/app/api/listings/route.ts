import { apiUser, isAdmin } from '@/lib/guards';
import {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  createListing,
  deleteListing,
  getOwned,
  listAll,
  listForUser,
  updateListing,
} from '@/lib/listings';
import { isStoredUpload, storeImages, UploadError } from '@/lib/upload';
import { toPaise, validateListing } from '@/lib/listing-shared';
import { jsonError, readJson } from '@/lib/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 10;

/**
 * GET /api/listings?page=1
 * A customer sees only their own rows. An admin sees everything.
 */
export async function GET(request: Request) {
  const user = apiUser();
  if (!user) return jsonError('Please sign in.', undefined, 401);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  return Response.json(isAdmin(user) ? listAll(page, PAGE_SIZE * 2) : listForUser(user.id, page, PAGE_SIZE));
}

/**
 * POST /api/listings
 * Accepts either JSON or multipart. Photos are optional; when present they
 * are written to disk and only the resulting public paths are stored.
 */
export async function POST(request: Request) {
  const user = apiUser();
  if (!user) return jsonError('Please sign in.', undefined, 401);

  try {
    const contentType = request.headers.get('content-type') ?? '';
    let input: {
      title: string;
      description: string;
      pricePaise: number;
      category: string;
      condition: string;
      photos: string[];
    };

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const files = form.getAll('photos').filter((f): f is File => f instanceof File);
      const uploaded = await storeImages(files);

      input = {
        title: String(form.get('title') ?? ''),
        description: String(form.get('description') ?? ''),
        pricePaise: toPaise(form.get('price')),
        category: String(form.get('category') ?? 'phone'),
        condition: String(form.get('condition') ?? 'used'),
        photos: uploaded,
      };
    } else {
      const body = await readJson(request);
      if (!body) return jsonError('Invalid request body.');
      const photos = Array.isArray(body.photos) ? body.photos.map(String) : [];
      // Only paths this app actually produced are accepted -- a client cannot
      // make the database point at an arbitrary URL.
      if (!photos.every(isStoredUpload)) {
        return jsonError('One of the photos is not a valid upload.');
      }
      input = {
        title: String(body.title ?? ''),
        description: String(body.description ?? ''),
        pricePaise: toPaise(body.price),
        category: String(body.category ?? 'phone'),
        condition: String(body.condition ?? 'used'),
        photos,
      };
    }

    const problem = validateListing(input);
    if (problem) return jsonError(problem);

    return Response.json({ listing: createListing(user.id, input) }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.message);
    console.error('[listings] create failed:', error);
    return jsonError('Could not save your item.', undefined, 500);
  }
}
