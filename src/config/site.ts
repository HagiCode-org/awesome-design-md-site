import {
  defaultLocale,
  getLocaleResources,
  getRouteLocaleMetadata,
  interpolate,
  isSupportedLocale,
  supportedLocales,
  type SupportedLocale,
} from '@/i18n';
import { resolveAwesomeDesignFooterSiteLinks } from '@/lib/footer-site-links';

export { defaultLocale, supportedLocales };
export type { SupportedLocale };

export interface NavItem {
  label: string;
  href: string;
  description?: string;
  shortLabel?: string;
  group?: 'primary' | 'repo';
}

export interface MetricItem {
  value: string;
  label: string;
}

export interface HomeContent {
  lang: SupportedLocale;
  title: string;
  description: string;
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroNote: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  nav: NavItem[];
  metrics: MetricItem[];
}

export interface LanguageLink extends NavItem {
  locale: SupportedLocale;
  hreflang: string;
  htmlLang: string;
}

export interface ShowcaseSlide {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}

export interface HeroReadmeExcerpt {
  excerpt: string;
  translation: string;
}

export interface LocaleCopy {
  chrome: ReturnType<typeof getLocaleResources>['chrome'];
  common: ReturnType<typeof getLocaleResources>['common'];
  home: ReturnType<typeof getLocaleResources>['gallery']['home'];
  card: ReturnType<typeof getLocaleResources>['gallery']['card'];
  search: ReturnType<typeof getLocaleResources>['gallery']['search'];
  detail: ReturnType<typeof getLocaleResources>['gallery']['detail'];
  preview: ReturnType<typeof getLocaleResources>['gallery']['preview'];
  documents: ReturnType<typeof getLocaleResources>['gallery']['documents'];
  adjacent: ReturnType<typeof getLocaleResources>['gallery']['adjacent'];
  promotion: ReturnType<typeof getLocaleResources>['promotion'];
}

function buildLocaleCopy(locale: SupportedLocale): LocaleCopy {
  const resources = getLocaleResources(locale);

  return {
    chrome: resources.chrome,
    common: resources.common,
    home: resources.gallery.home,
    card: resources.gallery.card,
    search: resources.gallery.search,
    detail: resources.gallery.detail,
    preview: resources.gallery.preview,
    documents: resources.gallery.documents,
    adjacent: resources.gallery.adjacent,
    promotion: resources.promotion,
  };
}

export const localeCopy = Object.fromEntries(
  supportedLocales.map((locale) => [locale, buildLocaleCopy(locale)]),
) as Record<SupportedLocale, LocaleCopy>;

export function getSiteMeta(locale: SupportedLocale) {
  return getLocaleResources(locale).common.site;
}

export const siteMeta = getSiteMeta(defaultLocale);

export function resolveSupportedLocale(locale: string | null | undefined): SupportedLocale {
  if (locale && isSupportedLocale(locale)) {
    return locale;
  }

  const normalized = locale?.toLowerCase() ?? '';
  if (normalized.startsWith('zh-hant') || normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk')) {
    return 'zh-Hant';
  }

  if (normalized.startsWith('zh')) {
    return 'zh-CN';
  }

  if (normalized.startsWith('ja')) return 'ja-JP';
  if (normalized.startsWith('ko')) return 'ko-KR';
  if (normalized.startsWith('de')) return 'de-DE';
  if (normalized.startsWith('fr')) return 'fr-FR';
  if (normalized.startsWith('es')) return 'es-ES';
  if (normalized.startsWith('pt')) return 'pt-BR';
  if (normalized.startsWith('ru')) return 'ru-RU';

  return defaultLocale;
}

export function getGalleryNav(locale: SupportedLocale): NavItem[] {
  const chrome = localeCopy[locale].chrome;

  return [
    {
      label: chrome.galleryLabel,
      shortLabel: chrome.galleryCompactLabel,
      href: getLocaleHomePath(locale),
      group: 'primary',
    },
    {
      label: chrome.siteRepoLabel,
      href: siteMeta.repository,
      group: 'repo',
    },
    {
      label: chrome.sourceRepoLabel,
      href: siteMeta.sourceRepository,
      group: 'repo',
    },
  ];
}

export function getFooterLinks(locale: SupportedLocale): NavItem[] {
  return resolveAwesomeDesignFooterSiteLinks(locale);
}

export function getFooterMetaLinks(locale: SupportedLocale): NavItem[] {
  const chrome = localeCopy[locale].chrome;

  return [
    { label: chrome.galleryLabel, href: getLocaleHomePath(locale) },
    { label: chrome.siteRepoLabel, href: siteMeta.repository },
    { label: chrome.sourceRepoLabel, href: siteMeta.sourceRepository },
  ];
}

export function getLanguageLinks(currentPath: string): LanguageLink[] {
  return supportedLocales.map((locale) => {
    const metadata = getRouteLocaleMetadata(locale);

    return {
      label: metadata.label,
      shortLabel: metadata.compactLabel,
      href: toLocalePath(currentPath, locale),
      locale,
      hreflang: metadata.hreflang,
      htmlLang: metadata.htmlLang,
    };
  });
}

export function getLocaleHomePath(locale: SupportedLocale): string {
  return locale === defaultLocale ? '/' : `/${locale}/`;
}

export function toLocalePath(currentPath: string, locale: SupportedLocale): string {
  const basePath = stripLocalePrefix(normalizeInternalPath(currentPath));

  if (locale === defaultLocale) {
    return basePath;
  }

  return basePath === '/' ? `/${locale}/` : `/${locale}${basePath}`;
}

export function stripLocalePrefix(path: string): string {
  const normalized = normalizeInternalPath(path);

  if (normalized === `/${defaultLocale}` || normalized.startsWith(`/${defaultLocale}/`)) {
    return normalized === `/${defaultLocale}` ? '/' : normalized.slice(`/${defaultLocale}`.length) || '/';
  }

  for (const locale of supportedLocales) {
    if (locale === defaultLocale) continue;
    const prefix = `/${locale}`;

    if (normalized === prefix) {
      return '/';
    }

    if (normalized.startsWith(`${prefix}/`)) {
      return normalized.slice(prefix.length) || '/';
    }
  }

  return normalized;
}

export function getHomeDescription(locale: SupportedLocale, count: number): string {
  const templates = getLocaleResources(locale).common.homeDescription;
  const template = count > 0 ? templates.indexed : templates.empty;

  return interpolate(template, { count });
}

export function getDetailDescription(locale: SupportedLocale, title: string): string {
  return interpolate(getLocaleResources(locale).common.detailDescription, { title });
}

export function getSearchSummary(locale: SupportedLocale, query: string, count: number): string {
  const searchCopy = getLocaleResources(locale).gallery.search;
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const noun = hasQuery
    ? count === 1
      ? searchCopy.resultNounSingular
      : searchCopy.resultNounPlural
    : count === 1
      ? searchCopy.indexedNounSingular
      : searchCopy.indexedNounPlural;
  const template = hasQuery ? searchCopy.summaryResults : searchCopy.summaryIndexed;

  return interpolate(template, {
    count,
    noun,
    query: trimmedQuery,
  });
}

export function getPromotionCopy(locale: string | null | undefined) {
  return getLocaleResources(resolveSupportedLocale(locale)).promotion;
}

export function getSeoLocaleMetadata(locale: SupportedLocale) {
  return getRouteLocaleMetadata(locale);
}

export function getAlternateOgLocales(locale: SupportedLocale): string[] {
  const currentOgLocale = getRouteLocaleMetadata(locale).ogLocale;

  return supportedLocales
    .map((item) => getRouteLocaleMetadata(item).ogLocale)
    .filter((ogLocale) => ogLocale !== currentOgLocale);
}

export function toAbsoluteSiteUrl(path: string, site?: URL | string): string {
  const siteUrl =
    typeof site === 'string' ? new URL(site) : site ?? new URL('https://design.hagicode.com');
  return new URL(path, siteUrl).toString();
}

function normalizeInternalPath(path: string): string {
  if (!path) {
    return '/';
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return new URL(path).pathname || '/';
  }

  return path.startsWith('/') ? path : `/${path}`;
}
