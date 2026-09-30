import { revalidatePath } from 'next/cache';
import { apiUser, isAdmin } from '@/lib/guards';
import {
  createCatalogueItem,
  deleteCatalogueItem,
  getCatalogueRow,
  listForAdmin,
  updateCatalogueItem,
  validateCatalogue,
  type CatalogueInput,
  type Kind,
} from '@/lib/catalogue';
import { isStoredUpload, storeImages, UploadError } from '@/lib/upload';
import { toPaise } from '@/lib/listing-shared';
import { invalidateCatalogueCache } from '@/services/catalogService';
import { jsonError, readJson } from '@/lib/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function guard(): Promise<Response | null> {
  const user = await apiUser();
  if (!user) return jsonError('Please sign in.', undefined, 401);
  if (!isAdmin(user)) return jsonError('Admin access required.', undefined, 403);
  return null;
}

/** Photos are stored as a native array of public URLs on the document. */

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * The storefront is statically generated, so an admin edit would otherwise be
 * invisible until the next build. Regenerating the affected paths makes the
 * change appear on the very next request, which is what an admin expects after
 * clicking Save.
 */
function revalidateCatalogue(slugs: string[]): void {
  for (const path of [
    '/',
    '/shop',
    '/accessories',
    '/sitemap.xml',
    '/api/products',
  ]) {
    revalidatePath(path);
  }
  for (const slug of slugs) {
    if (slug) revalidatePath(`/accessories/${slug}`);
    if (slug) revalidatePath(`/shop/${slug}`);
  }
}

/**
 * Builds the input from either the JSON or the multipart form.
 *
 * When a discount is set and no price is typed, the selling price is derived
 * from the MRP. That is what the form shows the admin, so the API has to agree
 * rather than rejecting a submission the form happily produced.
 */
function readInput(source: Record<string, unknown>, images: string[]): CatalogueInput {
  const mrp = toPaise(source.mrp);
  const discount = num(source.discount);
  const typed = toPaise(source.price);

  const pricePaise =
    typed > 0
      ? typed
      : mrp > 0
        ? Math.round((mrp * (100 - discount)) / 100)
        : 0;

  return {
    kind: String(source.kind ?? 'accessory') as Kind,
    name: String(source.name ?? ''),
    brand: String(source.brand ?? '') || undefined,
    category: String(source.category ?? '') || undefined,
    pricePaise,
    mrpPaise: mrp || undefined,
    discountPercent: discount || undefined,
    stock: num(source.stock) || undefined,
    description: String(source.description ?? ''),
    images,
    active: source.active !== 'false' && source.active !== false,
  };
}

/** GET /api/admin/catalogue?public=1 — public read for the storefront grid. */
export async function GET(request: Request) {
  const url = new URL(request.url);

  // A `public=1` request is unauthenticated and read-only: it is how the
  // accessories grid picks up admin edits without being able to write.
  if (url.searchParams.get('public') === '1') {
    const kind = url.searchParams.get('kind');
    const rows =
      kind === 'phone' || kind === 'accessory'
        ? await listForAdmin(kind)
        : await listForAdmin();

    const items = rows
      .filter((r) => r.active === 1)
      .map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        brand: r.brand,
        category: r.category,
        pricePaise: r.pricePaise,
        mrpPaise: r.mrpPaise,
        discountPercent: r.discountPercent,
        stock: r.stock,
        images: r.images,
      }));

    return Response.json(
      { items },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    );
  }

  const denied = await guard();
  if (denied) return denied;

  const id = url.searchParams.get('id');
  if (!id) return jsonError('An id is required.');

  const row = await getCatalogueRow(id);
  if (!row) return jsonError('Item not found.', undefined, 404);
  return Response.json({ item: row });
}

/** POST /api/admin/catalogue — add a phone or an accessory. */
export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const contentType = request.headers.get('content-type') ?? '';
    let input: CatalogueInput;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const files = form.getAll('photos').filter((f): f is File => f instanceof File);
      const images = await storeImages(files);
      const fields = Object.fromEntries(
        [...form.entries()].filter(([, v]) => typeof v === 'string'),
      ) as Record<string, unknown>;
      input = readInput(fields, images);
    } else {
      const body = await readJson(request);
      if (!body) return jsonError('Invalid request body.');

      const images = Array.isArray(body.images) ? body.images.map(String) : [];
      if (!images.every(isStoredUpload)) {
        return jsonError('One of the photos is not a valid upload.');
      }
      input = readInput(body, images);
    }

    const problem = validateCatalogue(input);
    if (problem) return jsonError(problem);

    const item = await createCatalogueItem(input);
    invalidateCatalogueCache();
    revalidateCatalogue([item.slug]);
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.message);
    console.error('[catalogue] create failed:', error);
    return jsonError('Could not save the item.', undefined, 500);
  }
}

/** PATCH /api/admin/catalogue — update price, discount, stock, photo, etc. */
export async function PATCH(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  const id = String(body.id ?? '');
  if (!id) return jsonError('An id is required.');

  const current = await getCatalogueRow(id);
  if (!current) return jsonError('Item not found.', undefined, 404);

  const images = Array.isArray(body.images) ? body.images.map(String) : undefined;
  if (images && !images.every(isStoredUpload)) {
    return jsonError('One of the photos is not a valid upload.');
  }

  const patch: Partial<CatalogueInput> = {};
  if (body.name !== undefined) patch.name = String(body.name);
  if (body.brand !== undefined) patch.brand = String(body.brand);
  if (body.category !== undefined) patch.category = String(body.category);
  if (body.description !== undefined) patch.description = String(body.description);
  if (body.price !== undefined) patch.pricePaise = toPaise(body.price);
  if (body.mrp !== undefined) patch.mrpPaise = toPaise(body.mrp);
  if (body.discount !== undefined) patch.discountPercent = num(body.discount);
  if (body.stock !== undefined) patch.stock = num(body.stock);
  if (body.active !== undefined) patch.active = Boolean(body.active);
  if (images !== undefined) patch.images = images;

  // Validate against the stored values merged with the patch, so clearing the
  // MRP on an item that has one is caught rather than silently accepted.
  const problem = validateCatalogue({
    kind: current.kind as Kind,
    name: patch.name ?? current.name,
    pricePaise: patch.pricePaise ?? current.pricePaise,
    mrpPaise: patch.mrpPaise ?? current.mrpPaise,
    discountPercent: patch.discountPercent ?? current.discountPercent,
    stock: patch.stock ?? current.stock,
  });
  if (problem) return jsonError(problem);

  const item = await updateCatalogueItem(id, patch);
  invalidateCatalogueCache();
  // The slug can change when the name is edited, so refresh both the old and
  // the new address.
  revalidateCatalogue([current.slug, item?.slug ?? '']);
  return Response.json({ item });
}

/** DELETE /api/admin/catalogue?id=… */
export async function DELETE(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return jsonError('An id is required.');

  const existing = await getCatalogueRow(id);
  if (!await deleteCatalogueItem(id)) return jsonError('Item not found.', undefined, 404);

  invalidateCatalogueCache();
  revalidateCatalogue([existing?.slug ?? '']);
  return Response.json({ ok: true });
}
