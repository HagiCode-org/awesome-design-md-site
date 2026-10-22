export type PreviewVariant = 'light' | 'dark';
export type PreviewViewport = 'fit' | 'tablet' | 'mobile';

const LOAD_FALLBACK_MS = 8000;

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

export function initializePreviewSwitchers(rootDocument: Document = document) {
  rootDocument.querySelectorAll<HTMLElement>('[data-preview-switcher]').forEach((root) => {
    const frame = root.querySelector<HTMLIFrameElement>('[data-preview-frame]');
    const stage = root.querySelector<HTMLElement>('[data-preview-stage]');
    const variantButtons = Array.from(root.querySelectorAll<HTMLElement>('[data-preview-variant]'));
    const viewportButtons = Array.from(root.querySelectorAll<HTMLElement>('[data-preview-viewport]'));
    const openLink = root.querySelector<HTMLAnchorElement>('[data-preview-open]');
    const readout = root.querySelector<HTMLElement>('[data-preview-width]');
    const lightUrl = root.dataset.lightUrl ?? '';
    const darkUrl = root.dataset.darkUrl || lightUrl;
    let loadTimer: number | undefined;

    if (!frame || variantButtons.length === 0) {
      return;
    }

    const markReady = () => {
      window.clearTimeout(loadTimer);
      if (stage) {
        stage.dataset.state = 'ready';
        stage.removeAttribute('aria-busy');
      }
    };

    const markLoading = () => {
      if (!stage) {
        return;
      }

      stage.dataset.state = 'loading';
      stage.setAttribute('aria-busy', 'true');
      window.clearTimeout(loadTimer);
      loadTimer = window.setTimeout(markReady, LOAD_FALLBACK_MS);
    };

    const activateVariant = (variant: PreviewVariant) => {
      const nextUrl = variant === 'dark' ? darkUrl : lightUrl;

      // Dark falls back to the light asset for entries without a dedicated dark preview;
      // skipping an identical src avoids reloading the same page.
      if (frame.getAttribute('src') !== nextUrl) {
        markLoading();
        frame.setAttribute('src', nextUrl);
      }

      if (openLink) {
        openLink.href = nextUrl;
      }

      setPressed(variantButtons, 'data-preview-variant', variant);
    };

    const activateViewport = (viewport: PreviewViewport) => {
      root.dataset.viewport = viewport;
      setPressed(viewportButtons, 'data-preview-viewport', viewport);
    };

    frame.addEventListener('load', markReady);

    if (readout && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(([entry]) => {
        if (entry) {
          readout.textContent = formatWidth(entry.contentRect.width);
        }
      }).observe(frame);
    }

    variantButtons.forEach((button) => {
      button.addEventListener('click', () => {
        activateVariant(button.dataset.previewVariant === 'dark' ? 'dark' : 'light');
      });
    });

    viewportButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const value = button.dataset.previewViewport;
        activateViewport(value === 'tablet' || value === 'mobile' ? value : 'fit');
      });
    });

    activateViewport('fit');
    activateVariant(rootDocument.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  });
}
