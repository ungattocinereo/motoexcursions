import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://motoexcursions.it',
  adapter: vercel(),
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: [
      'en',
      'it',
      { path: 'ua', codes: ['uk', 'uk-UA'] },
    ],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    icon({ iconDir: 'src/icons' }),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', it: 'it', ua: 'uk' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
