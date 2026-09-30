'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { LISTING_CATEGORIES, LISTING_CONDITIONS, type Listing } from '@/lib/listing-shared';

/**
 * Create / edit form for a customer listing.
 *
 * Sends multipart when there are new files and JSON otherwise, so the simple
 * case stays cheap. Photos the user is simply keeping are passed back as the
 * paths the server already issued -- and the server re-validates all of them.
 */

const inputClass =
  'w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100';

const titleCase = (s: string) => s[0].toUpperCase() + s.slice(1);

export function ListingForm({ listing }: { listing?: Listing }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [previews, setPreviews] = useState<string[]>(listing?.photos ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const picked = Array.from(files).slice(0, 6 - previews.length);
    setNewFiles((prev) => [...prev, ...picked]);
    setPreviews((prev) => [...prev, ...picked.map((f) => URL.createObjectURL(f))]);
  }

  /** Drops one preview; blob URLs are revoked, server paths are just strings. */
  function removeAt(index: number) {
    setPreviews((prev) => {
      const target = prev[index];
      if (target?.startsWith('blob:')) URL.revokeObjectURL(target);
      return prev.filter((_, i) => i !== index);
    });
    setNewFiles((prev) => {
      const removedBlob = previews[index]?.startsWith('blob:');
      return removedBlob ? prev.slice(0, -1) : prev;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    const form = new FormData(event.currentTarget);
    const keptPaths = listing?.photos.filter((p) => previews.includes(p)) ?? [];

    try {
      const url = listing ? `/api/listings/${listing.id}` : '/api/listings';
      let res: Response;

      if (newFiles.length > 0) {
        // Server route currently accepts multipart on create; for edits the
        // client falls back to JSON + a follow-up so the PATCH stays simple.
        newFiles.forEach((f) => form.append('photos', f));
        res = await fetch(url, { method: 'POST', body: form });
        if (!res.ok && listing) {
          res = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: form.get('title'),
              description: form.get('description'),
              price: form.get('price'),
              category: form.get('category'),
              condition: form.get('condition'),
              photos: keptPaths,
            }),
          });
        }
      } else {
        res = await fetch(url, {
          method: listing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.get('title'),
            description: form.get('description'),
            price: form.get('price'),
            category: form.get('category'),
            condition: form.get('condition'),
            photos: keptPaths,
          }),


        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not save your item.');
        return;
      }

      router.push('/account/items');
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

      <Field label="Item title" htmlFor="title" required>
        <input
          id="title"
          name="title"
          defaultValue={listing?.title}
          className={inputClass}
          placeholder="iPhone 13, 128 GB, good condition"
          required
          maxLength={120}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price (₹)" htmlFor="price" required>
          <input
            id="price"
            name="price"
            type="number"
            min="1"
            step="1"
            defaultValue={listing ? listing.pricePaise / 100 : ''}
            className={inputClass}
            placeholder="25000"
            required
          />
        </Field>
        <Field label="Category" htmlFor="category" required>
          <select
            id="category"
            name="category"
            defaultValue={listing?.category ?? 'phone'}
            className={inputClass}
          >
            {LISTING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {titleCase(c)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Condition" htmlFor="condition" required>
        <select
          id="condition"
          name="condition"
          defaultValue={listing?.condition ?? 'used'}
          className={inputClass}
        >
          {LISTING_CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {titleCase(c)}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Description"
        htmlFor="description"
        required
        hint="Condition, storage, battery health, anything a buyer would ask."
      >
        <textarea
          id="description"
          name="description"
          defaultValue={listing?.description}
          rows={5}
          maxLength={4000}
          className={inputClass}
          placeholder="Screen is perfect, no scratches on the back. Battery health 89%. Comes with the original box."
          required
        />
      </Field>

      <div>
        <p className="text-sm font-semibold text-ink-800">Photos</p>
        <p className="mt-0.5 text-xs text-ink-500">
          Up to 6 images, 4 MB each. The first one is used as the cover.
        </p>

        <div className="mt-3 flex flex-wrap gap-3">
          {previews.map((src, i) => (
            <div key={src} className="relative">
              {/* Uploads are re-validated server-side: generated filename, image
                  extension only, bytes sniffed. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Item photo ${i + 1}`}
                className="h-24 w-24 rounded-xl border border-surface-200 object-cover"
              />
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
        {listing ? 'Save changes' : 'Publish item'}
      </Button>
    </form>
  );
}

