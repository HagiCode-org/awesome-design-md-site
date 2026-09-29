import { resolveSiteLinks } from '@hagicode/hagilight/site-links';
import { describe, expect, it } from 'vitest';
import { defaultLocale, supportedLocales } from '@/i18n';
import { getHagilightFooterLinks } from './hagilight-footer';

const rssLabels: Record<(typeof supportedLocales)[number], string> = {
  en: 'RSS Feed',
  'zh-CN': '当前语言 RSS',
  'zh-Hant': '目前語言 RSS',
  'ja-JP': '現在の言語 RSS',
  'ko-KR': '현재 언어 RSS',
  'de-DE': 'RSS der aktuellen Sprache',
  'fr-FR': 'Flux RSS de la langue actuelle',
  'es-ES': 'RSS del idioma actual',
  'pt-BR': 'Feed RSS do idioma atual',
  'ru-RU': 'RSS для текущего языка',
};

describe('hagilight footer RSS links', () => {
  it.each(supportedLocales)('uses hagilight localized RSS link for %s', (locale) => {
    const defaultFeed = locale === defaultLocale;
    const linkKey = defaultFeed ? 'rss' : 'rssLocale';
    const expectedHref = defaultFeed ? '/rss.xml' : `/rss.${locale}.xml`;
    const links = resolveSiteLinks(locale, getHagilightFooterLinks(locale));
    const rssLinks = links.quick.filter(({ id }) => id === 'rss' || id === 'rssLocale');

    expect(rssLinks).toHaveLength(1);
    expect(rssLinks[0]).toMatchObject({
      id: linkKey,
      label: rssLabels[locale],
      href: expectedHref,
    });
    expect(rssLinks[0].href).not.toContain('hagilight.hagicode.com');
  });
});
