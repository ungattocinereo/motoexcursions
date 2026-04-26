# motoexcursions.it migration (Astro)

Astro-based migration of motoexcursions.it from WordPress to a fast, mostly-static site with dynamic serverless APIs for leads and social feed.

## Stack

- Astro + TypeScript
- Tailwind CSS (via `@tailwindcss/vite`)
- Node standalone adapter (`@astrojs/node`) — runs under PM2 on the Sweden VPS
- Astro Content Collections for tour content

## Routes

- `/` homepage (hero + tours + social feed)
- `/tours` tours listing
- `/tours/[slug]` tour detail page
- `/contact`
- `/privacy`
- `/terms`
- `/api/social-feed` GET normalized social feed (Instagram/Facebook/YouTube, in-memory cache)

## Redirects

- `301 /excursions/{slug}/ -> /tours/{slug}/` — configured in `astro.config.mjs`.

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

## Deploy to Sweden VPS

The site runs at `/home/greg/motoexcursions/` on the `sweden` host (`64.112.127.163`), behind Caddy on port `127.0.0.1:30015`, supervised by PM2 (`pm2 list` → `motoexcursions`). Site config is in `/etc/caddy/Caddyfile`; SNI ACL in `/etc/haproxy/haproxy.cfg`. Read `/home/greg/runbook/INDEX.md` before any server-side change.

### Auto deploy (default)

Push to `main` triggers a GitHub webhook → `https://motoexcursions.it/hooks/redeploy-motoexcursions` → server runs `scripts/deploy.sh`:

```bash
git pull --ff-only origin main
npm ci
npm run build
pm2 restart motoexcursions
```

Tail the deploy log:

```bash
ssh sweden 'tail -f /tmp/deploy-motoexcursions.log'
```

### Manual deploy (escape hatch)

When the webhook is disabled or you want to ship without a commit:

```bash
npm run build
rsync -az --delete \
  --exclude='.git' --exclude='node_modules' --exclude='.env*' \
  ./dist ./package.json ./package-lock.json ./ecosystem.config.cjs \
  sweden:/home/greg/motoexcursions/

ssh sweden 'cd /home/greg/motoexcursions && npm ci --omit=dev && pm2 restart motoexcursions'
```

### Server-side env

Secrets live in `/home/greg/motoexcursions/.env` (chmod 600, never committed). PM2 loads them via `--env-file` (see `ecosystem.config.cjs`). To rotate a key, edit the `.env` and `pm2 restart motoexcursions`.
