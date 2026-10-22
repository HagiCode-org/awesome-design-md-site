import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DETAIL_LAYOUT_STORAGE_KEY,
  initializeDetailWorkbench,
  isTypingTarget,
  parseDetailLayout,
} from '@/components/gallery/detail-workbench';

describe('parseDetailLayout', () => {
  it('accepts the three layouts and falls back to split', () => {
    expect(parseDetailLayout('preview')).toBe('preview');
    expect(parseDetailLayout('docs')).toBe('docs');
    expect(parseDetailLayout('split')).toBe('split');
    expect(parseDetailLayout('wide')).toBe('split');
    expect(parseDetailLayout(null)).toBe('split');
  });
});

describe('initializeDetailWorkbench', () => {
  let dispose: (() => void) | undefined;
  const start = () => {
    dispose = initializeDetailWorkbench();
  };

  beforeEach(() => {
    window.localStorage.clear();
    document.body.innerHTML = `
      <div data-detail-grid data-layout="split"></div>
      <button type="button" data-detail-layout="split" aria-pressed="true">Split</button>
      <button type="button" data-detail-layout="preview" aria-pressed="false">Preview</button>
      <button type="button" data-detail-layout="docs" aria-pressed="false">Docs</button>
      <input data-test-input />
      <a data-adjacent-link="previous" href="#previous">Previous</a>
      <a data-adjacent-link="next" href="#next">Next</a>
    `;
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    document.body.innerHTML = '';
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('switches the layout, marks the pressed button and remembers the choice', () => {
    start();

    const grid = document.querySelector<HTMLElement>('[data-detail-grid]');
    const docs = document.querySelector<HTMLElement>('[data-detail-layout="docs"]');
    docs?.click();

    expect(grid?.dataset.layout).toBe('docs');
    expect(docs?.getAttribute('aria-pressed')).toBe('true');
    expect(docs?.classList.contains('is-active')).toBe(true);
    expect(document.querySelector('[data-detail-layout="split"]')?.getAttribute('aria-pressed')).toBe('false');
    expect(window.localStorage.getItem(DETAIL_LAYOUT_STORAGE_KEY)).toBe('docs');
  });

  it('restores the stored layout on load', () => {
    window.localStorage.setItem(DETAIL_LAYOUT_STORAGE_KEY, 'preview');

    start();

    expect(document.querySelector<HTMLElement>('[data-detail-grid]')?.dataset.layout).toBe('preview');
    expect(document.querySelector('[data-detail-layout="preview"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps working when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    start();
    document.querySelector<HTMLElement>('[data-detail-layout="preview"]')?.click();

    expect(document.querySelector<HTMLElement>('[data-detail-grid]')?.dataset.layout).toBe('preview');
  });

  it('moves between designs with the arrow keys', () => {
    start();
    const next = document.querySelector<HTMLAnchorElement>('[data-adjacent-link="next"]');
    const previous = document.querySelector<HTMLAnchorElement>('[data-adjacent-link="previous"]');
    const nextClick = vi.spyOn(next as HTMLAnchorElement, 'click').mockImplementation(() => {});
    const previousClick = vi.spyOn(previous as HTMLAnchorElement, 'click').mockImplementation(() => {});

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

    expect(nextClick).toHaveBeenCalledTimes(1);
    expect(previousClick).toHaveBeenCalledTimes(1);
  });

  it('leaves arrow keys alone while typing or with a modifier held', () => {
    start();
    const next = document.querySelector<HTMLAnchorElement>('[data-adjacent-link="next"]');
    const nextClick = vi.spyOn(next as HTMLAnchorElement, 'click').mockImplementation(() => {});
    const input = document.querySelector<HTMLInputElement>('[data-test-input]');

    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true }));

    expect(isTypingTarget(input ?? null)).toBe(true);
    expect(isTypingTarget(document.body)).toBe(false);
    expect(nextClick).not.toHaveBeenCalled();
  });
});
