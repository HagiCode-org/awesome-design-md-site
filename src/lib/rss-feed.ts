import { getGalleryFeed } from './gallery-rss';

export default function getFeed({ route, lang }: { route: string; lang: string }) {
  return getGalleryFeed(route, lang);
}
