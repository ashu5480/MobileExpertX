'use client';

import { ArrowLeft } from 'lucide-react';

/** "Go back" needs an onClick, so it lives in its own client island. */
export function BackButton() {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-ink-500 transition-colors hover:bg-surface-100 hover:text-ink-800"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Go back
    </button>
  );
}
