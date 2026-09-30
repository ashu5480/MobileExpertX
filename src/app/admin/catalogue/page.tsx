import { requireAdmin } from '@/lib/guards';
import { ensureCatalogueSeeded, listForAdmin } from '@/lib/catalogue';
import { CatalogueTable } from '@/components/admin/CatalogueTable';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Catalogue', robots: { index: false, follow: false } };

/**
 * Admin catalogue: every phone and accessory, with inline price / discount /
 * stock editing.
 */
export default async function AdminCataloguePage() {
  await requireAdmin();
  await ensureCatalogueSeeded();

  const rows = (await listForAdmin()).map((r) => ({
    id: r.id,
    kind: r.kind,
    slug: r.slug,
    name: r.name,
    brand: r.brand,
    category: r.category,
    pricePaise: r.pricePaise,
    mrpPaise: r.mrpPaise,
    stock: r.stock,
    active: r.active,
    discountPercent: r.discountPercent,
    images: r.images,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
        Catalogue
      </h1>
      <p className="mt-1 text-sm text-ink-600">
        Add accessories and phones, and change prices, discounts and stock. Changes
        show on the storefront immediately.
      </p>

      <div className="mt-6">
        <CatalogueTable rows={rows} />
      </div>
    </div>
  );
}
