'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ImagePlus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { accessoryCategories } from '@/data/catalog';

/**
 * Add / edit form for a catalogue item.
 *
 * Shows the discounted selling price live while the admin types, because the
 * relationship between MRP, discount and final price is the easiest thing to
 * get wrong.
 */

const inputClass =
  'w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100';

export interface CatalogueFormItem {
  id: string;
  kind: string;
  name: string;
  brand: string;
  category: string;
  pricePaise: number;
  mrpPaise: number;
  stock: number;
  description: string;
  discountPercent: number;
  images: string[];
}

interface Props {
  item?: CatalogueFormItem;
}

export function CatalogueForm({ item }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [kind, setKind] = useState<'phone' | 'accessory'>(
    (item?.kind as 'phone' | 'accessory') ?? 'accessory',
  );
  const [existing, setExisting] = useState<string[]>(item?.images ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(item?.images ?? []);

  // Live preview of what the customer will actually pay.
  const [price, setPrice] = useState(item ? item.pricePaise / 100 : 0);
  const [mrp, setMrp] = useState(item ? item.mrpPaise / 100 : 0);
  const [discount, setDiscount] = useState(item?.discountPercent ?? 0);

  const finalPrice =
    discount > 0 && mrp > 0 ? Math.round((mrp * (100 - discount)) / 100) : price;
  const saving = mrp > 0 && discount > 0 ? Math.round((mrp * (100 - discount)) / 100) : price;

  function addFiles(files: FileList | null) {
    if (!files) return;
    const picked = Array.from(files).slice(0, 6 - previews.length);
    setNewFiles((prev) => [...prev, ...picked]);
    setPreviews((prev) => [...prev, ...picked.map((f) => URL.createObjectURL(f))]);
  }

  function removeAt(index: number) {
    setPreviews((prev) => {
      const target = prev[index];
      if (target?.startsWith('blob:')) URL.revokeObjectURL(target);
      return prev.filter((_, i) => i !== index);
    });
    const removedExisting = index < existing.length;
    if (removedExisting) setExisting((prev) => prev.filter((_, i) => i !== index));
    else setNewFiles((prev) => prev.slice(0, -1));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    const form = new FormData(event.currentTarget);

    try {
      const url = item ? '/api/admin/catalogue' : '/api/admin/catalogue';
      let res: Response;

      if (newFiles.length > 0) {
        newFiles.forEach((f) => form.append('photos', f));
        form.append('id', item?.id ?? '');
        res = await fetch(url, { method: 'POST', body: form });
      } else {
        res = await fetch(url, {
          method: item ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item?.id,
            kind,
            name: form.get('name'),
            brand: form.get('brand'),
            category: form.get('category'),
            description: form.get('description'),
            price,
            mrp,
            discount,
            stock: form.get('stock'),
            images: existing,
          }),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not save the item.');
        return;
      }

      router.push('/admin/catalogue');
      router.refresh();
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-3xl border border-surface-200 bg-white p-6 shadow-soft"
      noValidate
    >
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </p>
      )}

      {!item && (
        <fieldset>
          <legend className="text-sm font-semibold text-ink-800">
            What are you adding?
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(['accessory', 'phone'] as const).map((k) => (
              <label
                key={k}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  kind === k
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-surface-300 hover:border-surface-400'
                }`}
              >
                <input
                  type="radio"
                  name="kind"
                  value={k}
                  checked={kind === k}
                  onChange={() => setKind(k)}
                  className="sr-only"
                />
                <span className="block text-sm font-bold text-ink-900">
                  {k === 'accessory' ? 'An accessory' : 'A phone'}
                </span>
                <span className="mt-0.5 block text-xs text-ink-500">
                  {k === 'accessory'
                    ? 'Charger, cable, case, earbuds...'
                    : 'A handset in the main catalogue'}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <Field label="Name" htmlFor="name" required>
        <input
          id="name"
          name="name"
          defaultValue={item?.name}
          className={inputClass}
          placeholder="100W GaN Dual-Port Charger"
          required
          maxLength={120}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand" htmlFor="brand">
          <input
            id="brand"
            name="brand"
            defaultValue={item?.brand ?? 'MobilExpertX'}
            className={inputClass}
            placeholder="MobilExpertX"
          />
        </Field>
        <Field label="Category" htmlFor="category">
          <select
            id="category"
            name="category"
            defaultValue={item?.category ?? 'chargers'}
            className={inputClass}
          >
            {accessoryCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>


      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="MRP (₹)" htmlFor="mrp" hint="The 'was' price">
          <input
            id="mrp"
            name="mrp"
            type="number"
            min="0"
            step="1"
            value={mrp}
            onChange={(e) => setMrp(Number(e.target.value))}
            className={inputClass}
            placeholder="3999"
          />
        </Field>
        <Field label="Discount %" htmlFor="discount">
          <input
            id="discount"
            name="discount"
            type="number"
            min="0"
            max="95"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className={inputClass}
            placeholder="0"
          />
        </Field>
        <Field label="Stock" htmlFor="stock">
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            defaultValue={item?.stock ?? 0}
            className={inputClass}
            placeholder="25"
          />
        </Field>
      </div>

      <Field
        label="Selling price (₹)"
        htmlFor="price"
        hint={
          discount > 0 && mrp > 0
            ? 'Calculated from the MRP and discount.'
            : 'Used directly when no discount is set.'
        }
      >
        <input
          id="price"
          name="price"
          type="number"
          min="0"
          step="1"
          value={discount > 0 && mrp > 0 ? saving : price}
          onChange={(e) => setPrice(Number(e.target.value))}
          disabled={discount > 0 && mrp > 0}
          className={`${inputClass} disabled:bg-surface-50 disabled:text-ink-500`}
          placeholder="2499"
        />
      </Field>

      {discount > 0 && mrp > 0 && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Customers will see{' '}
          <strong>₹{saving.toLocaleString('en-IN')}</strong> with a{' '}
          <strong>{discount}% OFF</strong> badge (MRP ₹{mrp.toLocaleString('en-IN')}).
        </p>
      )}

      <Field label="Description" htmlFor="description">
        <textarea
          id="description"
          name="description"
          defaultValue={item?.description}
          rows={5}
          maxLength={4000}
          className={inputClass}
          placeholder="Palm-sized, charges a 5,000 mAh phone to 50% in 15 minutes."
        />
      </Field>


      <div>
        <p className="text-sm font-semibold text-ink-800">Photos</p>
        <p className="mt-0.5 text-xs text-ink-500">
          Up to 6 images, 4 MB each. The first one is used on the listing.
        </p>

        <div className="mt-3 flex flex-wrap gap-3">
          {previews.map((src, i) => (
            <div key={src} className="relative">
              <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-surface-200">
                <Image src={src} alt="" fill className="object-cover" sizes="96px" />
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink-900 text-white shadow"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}

          {previews.length < 6 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="grid h-24 w-24 place-items-center rounded-xl border-2 border-dashed border-surface-300 text-ink-400 transition hover:border-brand-400 hover:text-brand-600"
              aria-label="Add photos"
            >
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      <Button type="submit" variant="primary" size="lg" loading={busy}>
        <Save className="h-4 w-4" aria-hidden="true" />
        {item ? 'Save changes' : 'Add to catalogue'}
      </Button>
    </form>
  );
}
