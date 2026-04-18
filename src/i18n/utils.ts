import { ui, defaultLocale, locales, htmlLang, dateLocale, type Locale, type UIKey } from './ui';

export { defaultLocale, locales, htmlLang, dateLocale };
export type { Locale, UIKey };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getLocaleFromUrl(url: URL): Locale {
  const seg = url.pathname.split('/').filter(Boolean)[0];
  return seg && isLocale(seg) ? seg : defaultLocale;
}

export function useTranslations(locale: Locale) {
  return function t(key: UIKey): string {
    return ui[locale][key] ?? ui[defaultLocale][key];
  };
}

/**
 * Strip a leading locale segment from a path, returning the canonical path
 * (always with leading slash, preserving trailing slash).
 */
export function stripLocale(path: string): string {
  const match = path.match(/^\/(it|ua)(?:\/|$)(.*)$/);
  if (!match) return path.startsWith('/') ? path : `/${path}`;
  const rest = match[2] ?? '';
  return `/${rest}`;
}

/**
 * Given any path (with or without locale prefix), return the equivalent
 * path in the target locale. Trailing-slash aware.
 */
export function localizedPath(path: string, target: Locale): string {
  const canonical = stripLocale(path);
  const clean = canonical.replace(/\/+$/, '') || '/';
  if (target === defaultLocale) {
    return clean === '/' ? '/' : `${clean}/`;
  }
  if (clean === '/') return `/${target}/`;
  return `/${target}${clean}/`;
}

/**
 * Produce a tour route honoring locale (e.g. /tours/amalfi/ or /it/tours/amalfi/).
 */
export function tourPath(slug: string, locale: Locale): string {
  return localizedPath(`/tours/${slug}/`, locale);
}

/**
 * Format a date string using the locale's preferred format.
 */
export function formatDate(value: string | Date, locale: Locale): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(dateLocale[locale]);
}
