export type PreviewVariant = 'light' | 'dark';
export type PreviewViewport = 'fit' | 'tablet' | 'mobile';

export interface PreviewImageFile {
  url: string;
  width: number;
  height: number;
}

export type PreviewImageSet = Record<PreviewViewport | 'thumb', PreviewImageFile>;
export type PreviewImages = Record<PreviewVariant, PreviewImageSet>;

function setPressed(buttons: HTMLElement[], attribute: string, value: string) {
  buttons.forEach((button) => {
    const active = button.getAttribute(attribute) === value;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function formatWidth(width: number): string {
  return `${Math.round(width)} px`;
}

function parseImages(raw: string | undefined): PreviewImages | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as PreviewImages;
  } catch {
    return undefined;
  }
}

// Dark falls back to the light set through the catalog, so both variants resolve here.
export function selectPreviewImage(
  images: PreviewImages,
  variant: PreviewVariant,
  viewport: PreviewViewport,
): PreviewImageFile {
  return images[variant][viewport];
}

export function formatPreviewAlt(template: string, variant: string, viewport: string): string {
  return template.replace('{{variant}}', variant).replace('{{viewport}}', viewport);
}

export function initializePreviewSwitchers(rootDocument: Document = document) {
  rootDocument.querySelectorAll<HTMLElement>('[data-preview-switcher]').forEach((root) => {
    const image = root.querySelector<HTMLImageElement>('[data-preview-image]');
    const stage = root.querySelector<HTMLElement>('[data-preview-stage]');
    const errorMessage = root.querySelector<HTMLElement>('[data-preview-error]');
    const liveLink = root.querySelector<HTMLAnchorElement>('[data-preview-live]');
    const variantButtons = Array.from(root.querySelectorAll<HTMLElement>('[data-preview-variant]'));
    const viewportButtons = Array.from(root.querySelectorAll<HTMLElement>('[data-preview-viewport]'));
    const openLink = root.querySelector<HTMLAnchorElement>('[data-preview-open]');
    const readout = root.querySelector<HTMLElement>('[data-preview-width]');
    const images = parseImages(root.dataset.images);
    const lightUrl = root.dataset.lightUrl ?? '';
    const darkUrl = root.dataset.darkUrl || lightUrl;
    const altTemplate = root.dataset.altTemplate ?? '';
    const labels = JSON.parse(root.dataset.labels ?? '{}') as Record<string, string>;
    let variant: PreviewVariant = 'light';
    let viewport: PreviewViewport = 'fit';

    if (!image || !stage || !images || variantButtons.length === 0) {
      return;
    }

    const markReady = () => {
      image.hidden = false;
      stage.dataset.state = 'ready';
      stage.removeAttribute('aria-busy');
      if (errorMessage) {
        errorMessage.hidden = true;
      }
    };

    const markLoading = () => {
      stage.dataset.state = 'loading';
      stage.setAttribute('aria-busy', 'true');
    };

    const markFailed = () => {
      image.hidden = true;
      stage.dataset.state = 'error';
      stage.removeAttribute('aria-busy');
      if (errorMessage) {
        errorMessage.hidden = false;
      }
    };

    const showImage = () => {
      const file = selectPreviewImage(images, variant, viewport);
      const alt = formatPreviewAlt(
        altTemplate,
        labels[variant] ?? variant,
        labels[viewport] ?? viewport,
      );

      image.alt = alt;
      image.width = file.width;
      image.height = file.height;

      // Dark and light can share one set (no dedicated dark render), and the server-rendered
      // image may already have loaded before this script attached its listeners.
      if (image.getAttribute('src') !== file.url) {
        markLoading();
        image.src = file.url;
      } else if (image.complete) {
        if (image.naturalWidth > 0) {
          markReady();
        } else {
          markFailed();
        }
      }
    };

    const applySelection = () => {
      const liveUrl = variant === 'dark' ? darkUrl : lightUrl;

      if (openLink) {
        openLink.href = liveUrl;
      }

      if (liveLink) {
        liveLink.href = liveUrl;
      }

      root.dataset.viewport = viewport;
      setPressed(variantButtons, 'data-preview-variant', variant);
      setPressed(viewportButtons, 'data-preview-viewport', viewport);
      showImage();
    };

    image.addEventListener('load', markReady);
    image.addEventListener('error', markFailed);

    if (readout && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(([entry]) => {
        if (entry) {
          readout.textContent = formatWidth(entry.contentRect.width);
        }
      }).observe(stage);
    }

    variantButtons.forEach((button) => {
      button.addEventListener('click', () => {
        variant = button.dataset.previewVariant === 'dark' ? 'dark' : 'light';
        applySelection();
      });
    });

    viewportButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const value = button.dataset.previewViewport;
        viewport = value === 'tablet' || value === 'mobile' ? value : 'fit';
        applySelection();
      });
    });

    variant = rootDocument.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    applySelection();
  });
}
