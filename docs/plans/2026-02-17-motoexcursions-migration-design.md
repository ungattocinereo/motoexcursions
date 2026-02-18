# Motoexcursions Migration Design (Astro + Telegram + Social Feed)

## Scope

- Migrate three live tours (`vesuvius`, `napoli`, `amalfi`) from WordPress to Astro SSG.
- Keep WP uploads as local source archive (`wp-old-uploads`) and copy only production assets into `/public/images/tours/*`.
- Implement form leads delivery to Telegram via `/api/lead`.
- Implement social feed aggregator via `/api/social-feed` for Instagram, Facebook Page, and YouTube.

## Architecture

- Framework: Astro + TypeScript + Tailwind (via `@tailwindcss/vite`).
- Content model: Astro Content Collections (`src/content/tours/*.md`) with strict frontmatter schema.
- Reviews: per-tour JSON file (`src/content/tours/{slug}.reviews.json`).
- API routes:
  - `src/pages/api/lead.ts`: validation, honeypot, IP rate limit, Telegram Bot API.
  - `src/pages/api/social-feed.ts`: unified feed response and cache headers.
- Social fetchers: plugin-style modules in `src/lib/social/fetchers/`.

## Data Flow

- Tours rendered statically at build from content collection.
- Social sections rendered on homepage and populated client-side from `/api/social-feed?limit=8`.
- API fetchers normalize all feed items to one `FeedItem` shape and enforce date sorting.

## Image Migration

- Script: `scripts/sync-tour-images.mjs`.
- Behavior:
  - Tries to fetch live WP tour pages and parse gallery links (`pretty_photo`).
  - Falls back to curated per-tour gallery lists when network access is unavailable.
  - Copies originals from `wp-old-uploads` to `public/images/tours/{slug}`.
  - Writes manifest to `scripts/tour-images.manifest.json`.

## Routing and SEO

- Canonical and OpenGraph metadata from layout and per-tour frontmatter.
- Sitemap generated via `@astrojs/sitemap`.
- `robots.txt` in `public/robots.txt`.
- Trailing slash policy set to `always`.
- Redirect path mapping for `/excursions/[slug]/` to `/tours/[slug]/`.

## Safety and Resilience

- All secrets are env-based (`.env.example`).
- Social feed uses in-memory cache with TTL and stale fallback.
- Lead endpoint includes basic anti-spam measures:
  - Honeypot
  - Sliding-window IP rate limit

## Follow-up

- Replace draft body text in tour Markdown with final copy.
- Add production Telegram and Meta/YouTube credentials.
- Run Lighthouse and tune media/layout as needed.
