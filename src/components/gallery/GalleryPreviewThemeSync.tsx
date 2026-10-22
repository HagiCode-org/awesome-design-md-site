import { useEffect, useEffectEvent } from 'react';

type ThemeName = 'light' | 'dark';
const PREVIEW_THUMB_SELECTOR = 'img[data-preview-thumb][data-light-src][data-dark-src]';

function resolveTheme(): ThemeName {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

// Native lazy loading decides when a card thumbnail is fetched; this only follows the theme.
export default function GalleryPreviewThemeSync() {
  const syncThumbs = useEffectEvent(() => {
    const theme = resolveTheme();

    document.querySelectorAll<HTMLImageElement>(PREVIEW_THUMB_SELECTOR).forEach((image) => {
      const targetSrc = theme === 'dark' ? image.dataset.darkSrc : image.dataset.lightSrc;

      if (targetSrc && image.getAttribute('src') !== targetSrc) {
        image.src = targetSrc;
      }
    });
  });

  useEffect(() => {
    syncThumbs();

    const observer = new MutationObserver(() => {
      syncThumbs();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, [syncThumbs]);

  return null;
}
