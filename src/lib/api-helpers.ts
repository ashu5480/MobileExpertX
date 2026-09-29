/**
 * Shared helpers for the auth route handlers: JSON parsing, uniform error
 * shapes, and a tiny in-process rate limiter for credential endpoints.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface FieldErrors {
  [field: string]: string;
}

export function jsonError(message: string, fieldErrors?: FieldErrors, status = 400) {
  return Response.json({ error: message, fieldErrors }, { status });
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Fixed-window limiter, keyed by IP.
 *
 * Per-process, so it resets on restart and is not shared across instances --
 * enough to blunt online password guessing on a single box. Behind multiple
 * instances, move the counter to Redis or the edge.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const nowMs = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt < nowMs) {
    hits.set(key, { count: 1, resetAt: nowMs + windowMs });
    return true; // allowed
  }

  entry.count += 1;
  return entry.count <= limit;
}

export function clientKey(request: Request, scope: string): string {
  const fwd = request.headers.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local';
  return `${scope}:${ip}`;
}

/** Strips characters that are never valid in an email, before validation. */
export function normalizeEmail(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().slice(0, 254);
}
