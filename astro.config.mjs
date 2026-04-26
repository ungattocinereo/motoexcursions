import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://motoexcursions.it',
  adapter: node({ mode: 'standalone' }),
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: [
      'en',
      'it',
      { path: 'ua', codes: ['uk', 'uk-UA'] },
      { path: 'ru', codes: ['ru', 'ru-RU'] },
    ],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    icon({ iconDir: 'src/icons' }),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', it: 'it', ua: 'uk', ru: 'ru' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
