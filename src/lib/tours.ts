import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '@/i18n/utils';

export type Tour = CollectionEntry<'tours'>;

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
