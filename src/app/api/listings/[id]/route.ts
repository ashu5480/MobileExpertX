import { apiUser } from '@/lib/guards';
import { deleteListing, getOwned, updateListing } from '@/lib/listings';
import { isStoredUpload } from '@/lib/upload';
import { toPaise, validateListing } from '@/lib/listing-input';
import { jsonError, readJson } from '@/lib/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

/**
 * GET /api/listings/:id
 *
 * Scoped to the owner. A customer requesting someone else's id gets a 404,
 * not a 403 -- a 403 would confirm the row exists.
 */
export async function GET(_request: Request, { params }: Params) {
  const user = apiUser();
  if (!user) return jsonError('Please sign in.', undefined, 401);

  const listing = getOwned(user.id, params.id);
  if (!listing) return jsonError('Item not found.', undefined, 404);
  return Response.json({ listing });
}

/** PATCH /api/listings/:id -- partial update, owner only. */
export async function PATCH(request: Request, { params }: Params) {
  const user = apiUser();
  if (!user) return jsonError('Please sign in.', undefined, 401);

  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  const current = getOwned(user.id, params.id);
  if (!current) return jsonError('Item not found.', undefined, 404);

  const photos = Array.isArray(body.photos) ? body.photos.map(String) : undefined;
  if (photos && !photos.every(isStoredUpload)) {
    return jsonError('One of the photos is not a valid upload.');
  }

  const next = {
    title: body.title !== undefined ? String(body.title) : current.title,
    description: body.description !== undefined ? String(body.description) : current.description,
    pricePaise: body.price !== undefined ? toPaise(body.price) : current.pricePaise,
    category: body.category !== undefined ? String(body.category) : current.category,
    condition: body.condition !== undefined ? String(body.condition) : current.condition,
    photos: photos ?? current.photos,
  };

  const problem = validateListing(next);
  if (problem) return jsonError(problem);

  return Response.json({ listing: updateListing(user.id, params.id, next) });
}

/** DELETE /api/listings/:id -- owner only. */
export async function DELETE(_request: Request, { params }: Params) {
  const user = apiUser();
  if (!user) return jsonError('Please sign in.', undefined, 401);

  if (!deleteListing(user.id, params.id)) {
    return jsonError('Item not found.', undefined, 404);
  }
  return Response.json({ ok: true });
}
