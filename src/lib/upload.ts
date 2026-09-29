import { writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { randomBytes } from 'node:crypto';

/**
 * Image uploads.
 *
 * Stored under `public/uploads` and served as a static file. For a single
 * server this is the lightest thing that works; on serverless hosting the
 * filesystem is ephemeral, so swap `store()` for an object-store PUT.
 *
 * Hardening that actually matters here:
 *  - the extension comes from a MIME whitelist, never from the filename, so
 *    `evil.php` or `x.svg` cannot be stored;
 *  - bytes are sniffed, so a renamed `.exe` is rejected;
 *  - the filename is generated, so traversal and overwrite are impossible.
 */

export const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
export const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const MAX_PER_LISTING = 6;

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

  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString('hex')}.${ALLOWED[actual]}`;
  await writeFile(join(UPLOAD_DIR, name), bytes);
  return `/uploads/${name}`;
}

export async function storeImages(files: File[]): Promise<string[]> {
  if (files.length > MAX_PER_LISTING) {
    throw new UploadError(`You can upload up to ${MAX_PER_LISTING} images per item.`);
  }
  return Promise.all(files.map(storeImage));
}

/** Guards against accepting a path that was not produced by `storeImage`. */
export function isStoredUpload(path: string): boolean {
  return (
    typeof path === 'string' &&
    path.startsWith('/uploads/') &&
    !path.includes('..') &&
    extname(path) !== '' &&
    Object.values(ALLOWED).includes(extname(path).slice(1))
  );
}
