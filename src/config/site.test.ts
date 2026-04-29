import { describe, expect, it } from 'vitest';

import {
  getAlternateOgLocales,
  getFooterLinks,
  getGalleryNav,
  getLanguageLinks,
  getLocaleHomePath,
  getSeoLocaleMetadata,
  getSiteMeta,
  localeCopy,
  supportedLocales,
  toLocalePath,
} from '@/config/site';

describe('header navigation config', () => {
  it('groups gallery and repository actions for the English shell', () => {
    const nav = getGalleryNav('en');

    expect(nav.find((item) => item.group === 'primary')).toMatchObject({
      label: 'Gallery',
      shortLabel: 'Gallery',
      href: '/',
    });
    expect(nav.filter((item) => item.group === 'repo')).toHaveLength(2);
    expect(localeCopy.en.chrome.mobileBrandLabel).toBe('ADMG');
  });

  it('exposes the full Desktop locale catalog through language links and route helpers', () => {
    const links = getLanguageLinks('/ja-JP/designs/stripe');

    expect(supportedLocales).toEqual([
      'en',
      'zh-CN',
      'zh-Hant',
      'ja-JP',
      'ko-KR',
      'de-DE',
      'fr-FR',
      'es-ES',
      'pt-BR',
      'ru-RU',
    ]);
    expect(links).toHaveLength(supportedLocales.length);
    expect(links.find((item) => item.locale === 'en')).toMatchObject({
      href: '/designs/stripe',
      shortLabel: 'EN',
      hreflang: 'en',
      htmlLang: 'en',
    });
    expect(links.find((item) => item.locale === 'ja-JP')).toMatchObject({
      href: '/ja-JP/designs/stripe',
      shortLabel: '日',
      hreflang: 'ja-JP',
      htmlLang: 'ja-JP',
    });
    expect(toLocalePath('/designs/stripe', 'fr-FR')).toBe('/fr-FR/designs/stripe');
    expect(getLocaleHomePath('ru-RU')).toBe('/ru-RU/');
  });

  it('keeps SEO locale metadata and alternate og locales aligned across the full catalog', () => {
    const metadata = getSeoLocaleMetadata('de-DE');

    expect(metadata).toMatchObject({
      routeLocale: 'de-DE',
      sourceLocale: 'de-DE',
      compactLabel: 'DE',
      hreflang: 'de-DE',
      ogLocale: 'de_DE',
      htmlLang: 'de-DE',
    });
    expect(getAlternateOgLocales('de-DE')).toContain('ja_JP');
    expect(getAlternateOgLocales('de-DE')).not.toContain('de_DE');
    expect(getSiteMeta('ja-JP').name).toBe('Awesome Design MD ギャラリー');
  });

  it('keeps footer links and localized gallery labels available for representative locales', () => {
    const germanNav = getGalleryNav('de-DE');
    const footerLinks = getFooterLinks('de-DE');

    expect(germanNav[0]).toMatchObject({
      label: 'Galerie',
      shortLabel: 'Galerie',
      href: '/de-DE/',
    });
    expect(footerLinks.find((link) => link.href === 'https://docs.hagicode.com/')).toMatchObject({
      label: 'HagiCode Docs',
      description: '使用指南',
    });
  });
});
