import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { collectOutline, createDocOutline, pickActiveIndex } from '@/components/gallery/doc-outline';

describe('pickActiveIndex', () => {
  it('returns the last heading that has passed the threshold', () => {
    expect(pickActiveIndex([-300, -40, 220, 640], 100)).toBe(1);
    expect(pickActiveIndex([-300, -40, 90, 640], 100)).toBe(2);
  });

  it('returns -1 before the first heading is reached', () => {
    expect(pickActiveIndex([240, 600], 100)).toBe(-1);
    expect(pickActiveIndex([], 100)).toBe(-1);
  });
});

describe('document outline', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-doc-bar></div>
      <nav data-doc-outline hidden></nav>
      <section data-panel="many">
        <h2>Colors</h2><p>text</p><h2>  Typography  </h2><h3>Nested</h3><h2></h2>
      </section>
      <section data-panel="single"><h2>Only one</h2></section>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('collects trimmed, non-empty h2 headings only', () => {
    const panel = document.querySelector<HTMLElement>('[data-panel="many"]');
    expect(collectOutline(panel as HTMLElement).map((item) => item.label)).toEqual(['Colors', 'Typography']);
  });

  it('renders one button per section and reveals the strip', () => {
    const nav = document.querySelector<HTMLElement>('[data-doc-outline]') as HTMLElement;
    const bar = document.querySelector<HTMLElement>('[data-doc-bar]') as HTMLElement;
    const outline = createDocOutline(nav, bar);

    outline.show(document.querySelector<HTMLElement>('[data-panel="many"]'));

    expect(nav.hidden).toBe(false);
    expect(Array.from(nav.querySelectorAll('button')).map((button) => button.textContent)).toEqual([
      'Colors',
      'Typography',
    ]);
  });

  it('hides the strip when a document has fewer than two sections', () => {
    const nav = document.querySelector<HTMLElement>('[data-doc-outline]') as HTMLElement;
    const bar = document.querySelector<HTMLElement>('[data-doc-bar]') as HTMLElement;
    const outline = createDocOutline(nav, bar);

    outline.show(document.querySelector<HTMLElement>('[data-panel="many"]'));
    outline.show(document.querySelector<HTMLElement>('[data-panel="single"]'));

    expect(nav.hidden).toBe(true);
    expect(nav.children).toHaveLength(0);

    outline.show(null);
    expect(nav.hidden).toBe(true);
  });
});
