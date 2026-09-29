import { Logo } from '@/components/ui/Logo';

/**
 * Route-level loading UI.
 *
 * Next.js streams this in while a server component is still rendering, so it
 * mirrors the real layout (header block + skeleton grid) to avoid a jarring
 * shift. The branded preloader covers the first paint of the whole app; this
 * handles per-route navigation.
 */
export default function Loading() {
  return (
    <div className="container py-10" role="status" aria-label="Loading page">
      <div className="h-4 w-48 animate-pulse rounded bg-surface-200" />
      <div className="mt-5 h-10 w-2/3 max-w-xl animate-pulse rounded bg-surface-200" />
      <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-surface-100" />
      <div className="mt-3 h-4 w-4/5 max-w-xl animate-pulse rounded bg-surface-100" />

      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-3xl border border-surface-200">
            <div className="aspect-[4/5] animate-pulse bg-surface-100" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-20 animate-pulse rounded bg-surface-200" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-surface-200" />
              <div className="h-6 w-24 animate-pulse rounded bg-surface-200" />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Loading…</span>
      <div className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 opacity-0">
        <Logo showWordmark={false} href={null} />
      </div>
    </div>
  );
}
