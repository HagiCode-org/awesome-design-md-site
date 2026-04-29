import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import robotsTxt from 'astro-robots-txt';

const siteUrl = process.env.SITE_URL ?? 'https://design.hagicode.com';

export default defineConfig({
  site: siteUrl,
  base: '/',
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-CN', 'zh-Hant', 'ja-JP', 'ko-KR', 'de-DE', 'fr-FR', 'es-ES', 'pt-BR', 'ru-RU'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },
  integrations: [
    robotsTxt({
      sitemap: `${siteUrl.replace(/\/$/, '')}/sitemap-index.xml`,
    }),
    sitemap(),
    react(),
    mdx(),
  ],
  scopedStyleStrategy: 'where',
});
