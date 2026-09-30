import 'server-only';
import { put } from '@vercel/blob';
import { randomBytes } from 'node:crypto';

/**
 * Image uploads, backed by Vercel Blob.
 *
 * ── Why Blob and not the local disk ──────────────────────────────────────────
 * The previous implementation wrote to `public/uploads` and returned
 * `/uploads/<name>`. On Vercel the production filesystem is read-only and
 * ephemeral, so that could not work: the write would fail outright, and even
 * if it succeeded the file would be gone after the next deploy, leaving dead
 * image URLs in the database. Blob stores the bytes outside the function
 * entirely and hands back a permanent public HTTPS URL, so an uploaded
 * product photo survives every redeploy.
 *
 * Blob is also the lower-friction choice here: it needs a single env var
 * rather than three Cloudinary credentials, it is served from the same
 * provider as the app, and `put()` takes the exact `Buffer` this module
 * already builds.
 *
 * All of the original hardening is preserved, and it still runs BEFORE any
 * bytes leave the server:
 *  - the extension comes from a MIME allow-list, never from the filename, so
 *    `evil.php` or `x.svg` cannot be stored;
 *  - bytes are sniffed, so a renamed `.exe` is rejected;
 *  - the filename is generated, so traversal and overwrite are impossible.
 */

export const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const MAX_PER_LISTING = 6;
const PREFIX = 'uploads';

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const SIGNATURES: Array<{ mime: string; test: (b: Buffer) => boolean }> = [
  { mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    test: (b) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  {
    mime: 'image/webp',
    test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  {
    mime: 'image/avif',
    test: (b) => b.subarray(4, 8).toString('ascii') === 'ftyp',
  },
];

function sniff(bytes: Buffer): string | null {
  return SIGNATURES.find((s) => s.test(bytes))?.mime ?? null;
}

export class UploadError extends Error {}

export async function storeImage(file: File): Promise<string> {
  if (!ALLOWED[file.type]) {
    throw new UploadError('Only JPEG, PNG, WebP or AVIF images are allowed.');
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError('Each image must be 4 MB or smaller.');
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Trust the bytes, not the declared Content-Type.
  const actual = sniff(bytes);
  if (!actual || !ALLOWED[actual]) {
    throw new UploadError('That file is not a valid image.');
  }

  const name = `${Date.now().toString(36)}-${randomBytes(6).toString('hex')}.${ALLOWED[actual]}`;

  try {
    const blob = await put(`${PREFIX}/${name}`, bytes, {
      access: 'public',
      contentType: actual,
      // Uploads are immutable and content-addressed by name, so they can be
      // cached hard at the edge.
      addRandomSuffix: false,
    });
    return blob.url;
  } catch (error) {
    // A missing token is a deployment mistake, not a user error, so it says so
    // plainly instead of surfacing as a generic "upload failed".
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new UploadError(
        'Image uploads are not configured. Set BLOB_READ_WRITE_TOKEN and redeploy.',
      );
    }
    console.error('[upload] blob put failed:', error);
    throw new UploadError('The image could not be uploaded. Please try again.');
  }
}

export async function storeImages(files: File[]): Promise<string[]> {
  if (files.length > MAX_PER_LISTING) {
    throw new UploadError(`You can upload up to ${MAX_PER_LISTING} images per item.`);
  }
  return Promise.all(files.map(storeImage));
}

/**
 * Guards against accepting a path this app did not produce.
 *
 * Both the JSON and multipart API paths call this on client-supplied values,
 * so it must reject anything that is not a URL from our own Blob store —
 * otherwise a client could point a product row at an arbitrary remote host.
 */
export function isStoredUpload(path: string): boolean {
  if (typeof path !== 'string' || !path.startsWith('https://')) return false;

  let url: URL;
  try {
    url = new URL(path);
  } catch {
    return false;
  }

  // Vercel Blob serves from *.public.blob.vercel-storage.com. Matching the
  // suffix (rather than an exact hostname) keeps working across the store
  // hostname Vercel assigns to this project.
  const host = url.hostname.toLowerCase();
  if (!host.endsWith('.public.blob.vercel-storage.com')) return false;

  // Must sit under our prefix and end in an image extension.
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length !== 2 || segments[0] !== PREFIX) return false;

  const ext = segments[1].split('.').pop()?.toLowerCase() ?? '';
  return Object.values(ALLOWED).includes(ext);
}

