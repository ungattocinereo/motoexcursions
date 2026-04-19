import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '@/i18n/utils';

export type Tour = CollectionEntry<'tours'>;

const IMAGE_EXTENSIONS = /\.(webp|jpe?g|png|avif)$/i;
const MAIN_SUFFIX = /-main\.[^.]+$/i;

/**
 * Auto-discover gallery images for a tour by reading
 * `public/images/tours/<slug>/`. Files whose name ends with `-main.<ext>`
 * are treated as the hero/cover image and excluded from the gallery.
 * Sorted numerically so zero-padded filenames preserve order. Runs at
 * build time only — safe because Astro's output is static.
 */
export function getTourGallery(slug: string): string[] {
  const dir = resolve(process.cwd(), 'public', 'images', 'tours', slug);
  try {
    return readdirSync(dir)
      .filter((name) => IMAGE_EXTENSIONS.test(name) && !MAIN_SUFFIX.test(name))
      .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
      .map((name) => `/images/tours/${slug}/${name}`);
  } catch {
    return [];
  }
}

/**
 * Content collection entries live at content/tours/<locale>/<slug>.md so
 * `entry.slug` looks like "en/amalfi". Filter by the leading segment and
 * return the entries sorted by frontmatter `order`.
 */
export async function getTours(locale: Locale): Promise<Tour[]> {
  const all = await getCollection('tours', (entry) =>
    entry.slug.startsWith(`${locale}/`)
  );
  return all.sort((a, b) => a.data.order - b.data.order);
}

/**
 * Strip the locale prefix from an entry's slug.
 * "en/amalfi" -> "amalfi"
 */
export function tourSlug(tour: Tour): string {
  const parts = tour.slug.split('/');
  return parts[parts.length - 1] ?? tour.slug;
}

export async function getTourBySlug(slug: string, locale: Locale): Promise<Tour | undefined> {
  const all = await getTours(locale);
  return all.find((t) => tourSlug(t) === slug);
}
