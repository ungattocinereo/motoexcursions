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
    defaultLocale: 'ua',
    locales: [
      { path: 'ua', codes: ['uk', 'uk-UA'] },
      'en',
      'it',
      { path: 'ru', codes: ['ru', 'ru-RU'] },
    ],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    icon({ iconDir: 'src/icons' }),
    sitemap({
      i18n: {
        defaultLocale: 'ua',
        locales: { ua: 'uk', en: 'en', it: 'it', ru: 'ru' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
