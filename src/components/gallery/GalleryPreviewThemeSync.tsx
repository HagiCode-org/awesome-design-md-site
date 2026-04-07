import { useEffect, useEffectEvent } from 'react';

type ThemeName = 'light' | 'dark';
const PREVIEW_FRAME_SELECTOR = '[data-preview-frame][data-light-src][data-dark-src]';

function resolveTheme(): ThemeName {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function getTargetSrc(frame: HTMLIFrameElement, theme: ThemeName): string | undefined {
  return theme === 'dark' ? frame.dataset.darkSrc : frame.dataset.lightSrc;
}

export default function GalleryPreviewThemeSync() {
  const loadFrame = useEffectEvent((frame: HTMLIFrameElement) => {
    const theme = resolveTheme();
    const targetSrc = getTargetSrc(frame, theme);

    if (!targetSrc || frame.dataset.activeSrc === targetSrc) {
      return;
    }

    frame.src = targetSrc;
    frame.dataset.activeSrc = targetSrc;
    frame.dataset.hasEnteredViewport = 'true';
  });

  const syncFrames = useEffectEvent(() => {
    document
      .querySelectorAll<HTMLIFrameElement>(PREVIEW_FRAME_SELECTOR)
      .forEach((frame) => {
        if (frame.dataset.hasEnteredViewport !== 'true') {
          return;
        }

        loadFrame(frame);
      });
  });

  useEffect(() => {
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!(entry.target instanceof HTMLIFrameElement) || !entry.isIntersecting) {
            return;
          }

          loadFrame(entry.target);
        });
      },
      {
        threshold: 0.1,
      },
    );

    document
      .querySelectorAll<HTMLIFrameElement>(PREVIEW_FRAME_SELECTOR)
      .forEach((frame) => intersectionObserver.observe(frame));

    const observer = new MutationObserver(() => {
      syncFrames();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      intersectionObserver.disconnect();
      observer.disconnect();
    };
  }, [loadFrame, syncFrames]);

  return null;
}
