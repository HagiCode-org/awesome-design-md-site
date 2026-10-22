export type DetailLayout = 'split' | 'preview' | 'docs';

export const DETAIL_LAYOUT_STORAGE_KEY = 'adms-detail-layout';

export function parseDetailLayout(value: string | null | undefined): DetailLayout {
  return value === 'preview' || value === 'docs' ? value : 'split';
}

function readStoredLayout(): DetailLayout {
  try {
    return parseDetailLayout(window.localStorage.getItem(DETAIL_LAYOUT_STORAGE_KEY));
  } catch {
    return 'split';
  }
}

function storeLayout(layout: DetailLayout) {
  try {
    window.localStorage.setItem(DETAIL_LAYOUT_STORAGE_KEY, layout);
  } catch {
    // Storage can be blocked; the layout simply is not remembered.
  }
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Wires the workbench and returns a function that detaches everything it attached. */
export function initializeDetailWorkbench(rootDocument: Document = document): () => void {
  const grid = rootDocument.querySelector<HTMLElement>('[data-detail-grid]');
  const layoutButtons = Array.from(rootDocument.querySelectorAll<HTMLElement>('[data-detail-layout]'));
  const header = rootDocument.querySelector<HTMLElement>('.site-header');

  // Sticky panels sit just under the sticky site header, whose height changes with its wrapping.
  const headerObserver =
    header && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          rootDocument.documentElement.style.setProperty('--site-header-height', `${header.offsetHeight}px`);
        })
      : undefined;
  headerObserver?.observe(header as HTMLElement);

  if (grid && layoutButtons.length > 0) {
    const apply = (layout: DetailLayout) => {
      grid.dataset.layout = layout;
      layoutButtons.forEach((button) => {
        const active = button.dataset.detailLayout === layout;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    };

    layoutButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const layout = parseDetailLayout(button.dataset.detailLayout);
        apply(layout);
        storeLayout(layout);
      });
    });

    apply(readStoredLayout());
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      isTypingTarget(event.target)
    ) {
      return;
    }

    const direction = event.key === 'ArrowLeft' ? 'previous' : event.key === 'ArrowRight' ? 'next' : null;
    const link = direction
      ? rootDocument.querySelector<HTMLAnchorElement>(`[data-adjacent-link="${direction}"]`)
      : null;

    if (link) {
      event.preventDefault();
      link.click();
    }
  };

  rootDocument.addEventListener('keydown', onKeyDown);

  return () => {
    headerObserver?.disconnect();
    rootDocument.removeEventListener('keydown', onKeyDown);
  };
}
