import type { SupportedLocale } from '@/config/site';

export type VideoProvider = 'bilibili' | 'youtube';

export interface VideoShowcaseItem {
  provider: VideoProvider;
  embedId: string;
  title: string;
  description: string;
  watchUrl: string;
  ctaLabel: string;
}

export function getVideoEmbedUrl(video: Pick<VideoShowcaseItem, 'provider' | 'embedId'>): string {
  if (video.provider === 'youtube') {
    return `https://www.youtube.com/embed/${video.embedId}?autoplay=1&mute=1&playsinline=1&rel=0`;
  }

  return `https://player.bilibili.com/player.html?bvid=${video.embedId}&page=1&high_quality=1&danmaku=0&autoplay=1&muted=1&mute=1`;
}

export function getHomepageFallbackProvider(locale: SupportedLocale | string): VideoProvider {
  return locale.toLowerCase().startsWith('zh') ? 'bilibili' : 'youtube';
}
