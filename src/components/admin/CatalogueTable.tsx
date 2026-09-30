'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

/**
 * Admin catalogue table.
 *
 * Price, MRP, discount, stock and visibility are edited inline, because those
 * are the fields changed daily. Name, description and photo use the full form.
 */

export interface AdminCatalogueRow {
  id: string;
  kind: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  pricePaise: number;
  mrpPaise: number;
  stock: number;
  active: number;
  discountPercent: number;
  images: string;
}

/** Paise -> a plain rupee string the number input accepts. */
export const rupees = (paise: number) => (paise / 100).toFixed(2).replace(/\.00$/, '');

export function photosOf(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

type Drafts = Record<string, Partial<AdminCatalogueRow>>;

export function CatalogueTable({ rows }: { rows: AdminCatalogueRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | 'phone' | 'accessory'>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Drafts>({});

  const visible = rows
    .filter((r) => (kind === 'all' ? true : r.kind === kind))
    .filter((r) =>
      query
        ? r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.brand.toLowerCase().includes(query.toLowerCase()) ||
          r.slug.toLowerCase().includes(query.toLowerCase())
        : true,
    );

  function setField(id: string, patch: Partial<AdminCatalogueRow>) {
    setDrafts((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  }

  async function save(id: string) {
    const draft = drafts[id];
    if (!draft) return;

    setBusy(id);
    try {
      const body: Record<string, unknown> = { id };
      if (draft.pricePaise !== undefined) body.price = rupees(draft.pricePaise);
      if (draft.mrpPaise !== undefined) body.mrp = rupees(draft.mrpPaise);
      if (draft.discountPercent !== undefined) body.discount = draft.discountPercent;
      if (draft.stock !== undefined) body.stock = draft.stock;
      if (draft.active !== undefined) body.active = draft.active === 1;

      const res = await fetch('/api/admin/catalogue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) window.alert(data.error ?? 'Could not save.');
      else setDrafts((s) => ({ ...s, [id]: {} }));
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function remove(row: AdminCatalogueRow) {
    if (!window.confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
    setBusy(row.id);
    try {
      await fetch(`/api/admin/catalogue?id=${encodeURIComponent(row.id)}`, {
        method: 'DELETE',
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, brand or slug"
            aria-label="Search catalogue"
            className="w-full rounded-xl border border-surface-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-400"
          />
        </div>

        <div className="flex gap-1 rounded-xl bg-surface-100 p-1">
          {(['all', 'phone', 'accessory'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                kind === k ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-600'
              }`}
            >
              {k === 'all' ? 'All' : k === 'phone' ? 'Phones' : 'Accessories'}
            </button>
          ))}
        </div>

        <ButtonLink href="/admin/catalogue/new" variant="primary">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add item
        </ButtonLink>
      </div>

      <p className="text-sm text-ink-600">
        {visible.length} item{visible.length === 1 ? '' : 's'}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-surface-300 bg-white p-10 text-center text-sm text-ink-500">
          Nothing matches that search.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((row) => (
            <CatalogueRowCard
              key={row.id}
              row={row}
              draft={drafts[row.id] ?? {}}
              dirty={Boolean(drafts[row.id]) && Object.keys(drafts[row.id]!).length > 0}
              busy={busy === row.id}
              onField={(patch) => setField(row.id, patch)}
              onSave={() => save(row.id)}
              onDelete={() => remove(row)}
            />
          ))}
        </div>
      )}
    </div>
  );
}


function CatalogueRowCard({
  row,
  draft,
  dirty,
  busy,
  onField,
  onSave,
  onDelete,
}: {
  row: AdminCatalogueRow;
  draft: Partial<AdminCatalogueRow>;
  dirty: boolean;
  busy: boolean;
  onField: (patch: Partial<AdminCatalogueRow>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const price = draft.pricePaise ?? row.pricePaise;
  const mrp = draft.mrpPaise ?? row.mrpPaise;
  const discount = draft.discountPercent ?? row.discountPercent;
  const stock = draft.stock ?? row.stock;
  const active = draft.active ?? row.active;
  const pic = photosOf(row.images)[0];

  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-start gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-100">
          {pic ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pic} alt="" className="h-full w-full object-cover" />
          ) : (
            <Package className="h-6 w-6 text-ink-300" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-[180px] flex-1">
          <p className="text-sm font-bold text-ink-900">{row.name}</p>
          <p className="text-xs text-ink-500">
            {row.brand} · {row.category || row.kind}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-ink-400">{row.slug}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href={`/admin/catalogue/${row.id}`} variant="outline" size="sm">
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </ButtonLink>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={busy}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-surface-100 pt-4 sm:grid-cols-2 lg:grid-cols-5">
        <Mini
          label="Selling price (₹)"
          value={rupees(price)}
          onChange={(v) => onField({ pricePaise: Math.round(Number(v) * 100) })}
        />
        <Mini
          label="MRP (₹)"
          value={rupees(mrp)}
          onChange={(v) => onField({ mrpPaise: Math.round(Number(v) * 100) })}
        />
        <Mini
          label="Discount %"
          type="number"
          value={String(discount)}
          onChange={(v) => onField({ discountPercent: Number(v) })}
        />
        <Mini
          label="Stock"
          type="number"
          value={String(stock)}
          onChange={(v) => onField({ stock: Number(v) })}
        />

        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant={active === 1 ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => onField({ active: active === 1 ? 0 : 1 })}
          >
            {active === 1 ? 'Live' : 'Hidden'}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onSave}
            loading={busy}
            disabled={!dirty}
          >
            Save
          </Button>
        </div>
      </div>

      {discount > 0 && (
        <p className="mt-2 text-xs text-ink-500">
          Shown at{' '}
          <strong className="text-emerald-600">
            {formatPrice(Math.round((mrp * (100 - discount)) / 100))}
          </strong>{' '}
          with a {discount}% OFF badge.
        </p>
      )}
    </div>
  );
}

function Mini({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-surface-300 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
    </label>
  );
}
