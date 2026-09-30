import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/guards';
import { getCatalogueRow } from '@/lib/catalogue';
import { CatalogueForm } from '@/components/admin/CatalogueForm';

export const metadata = { title: 'Edit item', robots: { index: false, follow: false } };

export const dynamic = 'force-dynamic';

export default async function EditCatalogueItemPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const row = await getCatalogueRow(params.id);
  if (!row) notFound();

  // `row.images` is a native array now, not a JSON string.
  const images: string[] = row.images ?? [];

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/catalogue"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-brand-600"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Catalogue
      </Link>

      <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink-900">
        Edit item
      </h1>
      <p className="mt-1 text-sm text-ink-600">{row.name}</p>

      <div className="mt-6">
        <CatalogueForm
          item={{
            id: row.id,
            kind: row.kind,
            name: row.name,
            brand: row.brand,
            category: row.category,
            pricePaise: row.pricePaise,
            mrpPaise: row.mrpPaise,
            stock: row.stock,
            description: row.description,
            discountPercent: row.discountPercent,
            images,
          }}
        />
      </div>
    </div>
  );
}
