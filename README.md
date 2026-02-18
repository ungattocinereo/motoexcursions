# motoexcursions.it migration (Astro)

Astro-based migration of motoexcursions.it from WordPress to a fast, mostly-static site with dynamic serverless APIs for leads and social feed.

## Stack

- Astro + TypeScript
- Tailwind CSS (via `@tailwindcss/vite`)
- Vercel adapter (`@astrojs/vercel`) in `hybrid` mode
- Astro Content Collections for tour content

## Routes

- `/` homepage (hero + tours + social feed)
- `/tours` tours listing
- `/tours/[slug]` tour detail page
- `/contact`
- `/privacy`
- `/terms`
- `/api/lead` POST lead submission to Telegram
- `/api/social-feed` GET normalized social feed

## Redirects

- `301 /excursions/{slug}/ -> /tours/{slug}/`
- Configured in `astro.config.mjs` and `vercel.json`.

## Tours and content

Tour content lives in `src/content/tours/*.md`.

Each tour contains:

- frontmatter metadata (SEO + pricing + gallery + order)
- markdown body (currently draft placeholders where final copy will be inserted)
- review data in `src/content/tours/{slug}.reviews.json`

## Image migration workflow

Source archive remains in `wp-old-uploads/` and is git-ignored.

To copy production images into `public/images/tours/*`:

```bash
npm run sync:images
```

The script:

- tries to parse gallery images from live WP pages
- falls back to predefined gallery lists when network access is unavailable
- copies originals only
- writes a report to `scripts/tour-images.manifest.json`

## Environment variables

See `.env.example`.

Required for production:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `YOUTUBE_API_KEY`
- `YOUTUBE_CHANNEL_ID`
- `META_ACCESS_TOKEN`
- `META_IG_USER_ID`
- `META_FB_PAGE_ID`

Optional:

- `TELEGRAM_MESSAGE_THREAD_ID`
- `SOCIAL_FEED_TTL_SECONDS` (default `1800`)

## Local run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
