import {
  DEFAULT_ROUTE_LOCALE,
  SITE_LOCALE_RESOURCES,
  SITE_ROUTE_LOCALES,
  SUPPORTED_ROUTE_LOCALES,
} from '@/i18n/generated/site-locale-resources';

export type SupportedLocale = keyof typeof SITE_ROUTE_LOCALES;
export type SourceLocale = (typeof SITE_ROUTE_LOCALES)[SupportedLocale]['sourceLocale'];
export type LocaleResources = (typeof SITE_LOCALE_RESOURCES)[SourceLocale];
export type RouteLocaleMetadata = (typeof SITE_ROUTE_LOCALES)[SupportedLocale];

export const supportedLocales = SUPPORTED_ROUTE_LOCALES as readonly SupportedLocale[];
export const defaultLocale = DEFAULT_ROUTE_LOCALE as SupportedLocale;

export function getRouteLocaleMetadata(locale: SupportedLocale): RouteLocaleMetadata {
  return SITE_ROUTE_LOCALES[locale];
}

export function getLocaleResources(locale: SupportedLocale): LocaleResources {
  const sourceLocale = getRouteLocaleMetadata(locale).sourceLocale;
  return SITE_LOCALE_RESOURCES[sourceLocale];
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{\s*([A-Za-z0-9_$.-]+)(?:\s*,[^}]*)?\s*\}\}/gu, (match, key) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return (supportedLocales as readonly string[]).includes(locale);
}
