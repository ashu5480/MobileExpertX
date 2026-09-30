import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/guards';
import { CatalogueForm } from '@/components/admin/CatalogueForm';

export const metadata = { title: 'Add catalogue item', robots: { index: false, follow: false } };

export const dynamic = 'force-dynamic';

export default async function NewCatalogueItemPage() {
  await requireAdmin();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/catalogue"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-brand-600"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Catalogue
      </Link>

      <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink-900">
        Add an item
      </h1>
      <p className="mt-1 text-sm text-ink-600">
        It appears on the storefront as soon as you save.
      </p>

      <div className="mt-6">
        <CatalogueForm />
      </div>
    </div>
  );
}
