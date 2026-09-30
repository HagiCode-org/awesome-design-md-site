import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import { hagilight } from '@hagicode/hagilight/integration';

const siteUrl = process.env.SITE_URL ?? 'https://design.hagicode.com';
const supportedLocales = ['en', 'zh-CN', 'zh-Hant', 'ja-JP', 'ko-KR', 'de-DE', 'fr-FR', 'es-ES', 'pt-BR', 'ru-RU'];
export default defineConfig({
  site: siteUrl,
  base: '/',
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    locales: supportedLocales,
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
    hagilight(),
    react(),
    mdx(),
  ],
  scopedStyleStrategy: 'where',
});
