import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeDocumentTabs } from '@/components/gallery/document-tabs';

describe('initializeDocumentTabs', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset();
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText,
      },
    });
    document.body.innerHTML = `
      <section
        data-document-tabs
        data-copy-design-label="Copy DESIGN.md"
        data-copied-label="Copied"
        data-copy-failed-label="Copy failed"
      >
        <button type="button" data-doc-tab="readme" aria-selected="true">README</button>
        <button type="button" data-doc-tab="design" aria-selected="false">DESIGN</button>
        <button type="button" class="detail-copy-button" data-copy-design disabled aria-disabled="true">
          Copy DESIGN.md
        </button>
        <a
          class="detail-copy-button"
          data-download-design
          href="/designs/linear.app/DESIGN.md"
          aria-hidden="true"
          tabindex="-1"
        >
          Download DESIGN.md
        </a>
        <section data-doc-panel="readme"></section>
        <section data-doc-panel="design" hidden></section>
        <textarea data-design-markdown>Raw markdown</textarea>
      </section>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps the download action hidden until the DESIGN tab is selected', () => {
    initializeDocumentTabs();

    const copyButton = document.querySelector<HTMLButtonElement>('[data-copy-design]');
    const downloadLink = document.querySelector<HTMLAnchorElement>('[data-download-design]');
    const readmeTab = document.querySelector<HTMLElement>('[data-doc-tab="readme"]');
    const designTab = document.querySelector<HTMLElement>('[data-doc-tab="design"]');

    expect(copyButton?.disabled).toBe(true);
    expect(copyButton?.classList.contains('is-visible')).toBe(false);
    expect(downloadLink?.classList.contains('is-visible')).toBe(false);
    expect(downloadLink?.getAttribute('aria-hidden')).toBe('true');
    expect(downloadLink?.tabIndex).toBe(-1);

    designTab?.click();

    expect(readmeTab?.getAttribute('aria-selected')).toBe('false');
    expect(designTab?.getAttribute('aria-selected')).toBe('true');
    expect(copyButton?.disabled).toBe(false);
    expect(copyButton?.classList.contains('is-visible')).toBe(true);
    expect(downloadLink?.classList.contains('is-visible')).toBe(true);
    expect(downloadLink?.getAttribute('aria-hidden')).toBe('false');
    expect(downloadLink?.tabIndex).toBe(0);
    expect(downloadLink?.getAttribute('href')).toBe('/designs/linear.app/DESIGN.md');
  });

  it('copies the DESIGN markdown when the DESIGN tab is active', async () => {
    writeText.mockResolvedValue(undefined);
    initializeDocumentTabs();

    const designTab = document.querySelector<HTMLElement>('[data-doc-tab="design"]');
    const copyButton = document.querySelector<HTMLButtonElement>('[data-copy-design]');
    designTab?.click();
    copyButton?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('Raw markdown');
    expect(copyButton?.textContent?.trim()).toBe('Copied');
  });
});
