import type { APIRoute } from 'astro';
import { defaultLocale } from '@/i18n';
import { generateGalleryRss } from '@/lib/gallery-rss';

export const GET: APIRoute = ({ site }) => generateGalleryRss(defaultLocale, site, '/rss.xml');
