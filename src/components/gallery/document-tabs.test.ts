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
        data-design-slug="linear.app"
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

  it('rebuilds the section strip for the active document', () => {
    document.body.innerHTML = `
      <section data-document-tabs>
        <div data-doc-bar></div>
        <nav data-doc-outline hidden></nav>
        <button type="button" data-doc-tab="readme" aria-selected="true">README</button>
        <button type="button" data-doc-tab="design" aria-selected="false">DESIGN</button>
        <section data-doc-panel="readme"><h2>Files</h2><h2>Preview</h2></section>
        <section data-doc-panel="design" hidden><h2>Colors</h2><h2>Type</h2><h2>Layout</h2></section>
      </section>
    `;
    initializeDocumentTabs();

    const nav = document.querySelector<HTMLElement>('[data-doc-outline]');
    const labels = () => Array.from(nav?.querySelectorAll('button') ?? []).map((button) => button.textContent);

    expect(labels()).toEqual(['Files', 'Preview']);

    document.querySelector<HTMLElement>('[data-doc-tab="design"]')?.click();

    expect(labels()).toEqual(['Colors', 'Type', 'Layout']);
    expect(nav?.hidden).toBe(false);
  });
});

describe('initializeDocumentTabs PostHog events', () => {
  const writeText = vi.fn();

  type FakePostHog = { __loaded: boolean; capture: ReturnType<typeof vi.fn>; has_opted_out_capturing: () => boolean };

  let posthog: FakePostHog;

  const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  beforeEach(() => {
    writeText.mockReset();
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    posthog = { __loaded: true, capture: vi.fn(), has_opted_out_capturing: () => false };
    (window as unknown as { posthog: FakePostHog }).posthog = posthog;
    document.body.innerHTML = `
      <section data-document-tabs data-design-slug="linear.app" data-copy-design-label="Copy DESIGN.md" data-copied-label="Copied" data-copy-failed-label="Copy failed">
        <button type="button" data-doc-tab="readme" aria-selected="true">README</button>
        <button type="button" data-doc-tab="design" aria-selected="false">DESIGN</button>
        <button type="button" class="detail-copy-button" data-copy-design disabled aria-disabled="true">Copy DESIGN.md</button>
        <a class="detail-copy-button" data-download-design href="/designs/linear.app/DESIGN.md" aria-hidden="true" tabindex="-1">
          <span class="label">Download DESIGN.md</span>
        </a>
        <section data-doc-panel="readme"></section>
        <section data-doc-panel="design" hidden></section>
        <textarea data-design-markdown>Raw markdown</textarea>
      </section>
    `;
  });

  afterEach(() => {
    delete (window as unknown as { posthog?: unknown }).posthog;
    document.body.innerHTML = '';
  });

  it('sends one tab change event when the active tab actually changes', () => {
    initializeDocumentTabs();

    document.querySelector<HTMLElement>('[data-doc-tab="design"]')?.click();

    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith('design_doc_tab_changed', { tab: 'design' });
  });

  it('sends nothing when the already active tab is selected again', () => {
    initializeDocumentTabs();

    document.querySelector<HTMLElement>('[data-doc-tab="readme"]')?.click();

    expect(posthog.capture).not.toHaveBeenCalled();
    expect(document.querySelector('[data-doc-tab="readme"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('sends a tab change again after switching back, but not for a repeat selection', () => {
    initializeDocumentTabs();

    document.querySelector<HTMLElement>('[data-doc-tab="design"]')?.click();
    document.querySelector<HTMLElement>('[data-doc-tab="design"]')?.click();
    document.querySelector<HTMLElement>('[data-doc-tab="readme"]')?.click();

    expect(posthog.capture.mock.calls).toEqual([
      ['design_doc_tab_changed', { tab: 'design' }],
      ['design_doc_tab_changed', { tab: 'readme' }],
    ]);
  });

  it('sends design_md_copied with the entry slug after a successful copy', async () => {
    writeText.mockResolvedValue(undefined);
    initializeDocumentTabs();

    document.querySelector<HTMLElement>('[data-doc-tab="design"]')?.click();
    document.querySelector<HTMLButtonElement>('[data-copy-design]')?.click();
    await flush();

    expect(posthog.capture).toHaveBeenLastCalledWith('design_md_copied', { slug: 'linear.app' });
    expect(posthog.capture.mock.calls.filter(([name]) => name === 'design_md_copied')).toHaveLength(1);
  });

  it('sends nothing when the clipboard write fails', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    initializeDocumentTabs();

    document.querySelector<HTMLElement>('[data-doc-tab="design"]')?.click();
    posthog.capture.mockClear();
    document.querySelector<HTMLButtonElement>('[data-copy-design]')?.click();
    await flush();

    expect(document.querySelector('[data-copy-design]')?.textContent?.trim()).toBe('Copy failed');
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it('sends one download event with the slug when a nested element inside the link is clicked', () => {
    initializeDocumentTabs();
    // jsdom cannot navigate to the download URL; stop the default action after the handlers run.
    document.querySelector('[data-download-design]')?.addEventListener('click', (event) => event.preventDefault());

    document.querySelector<HTMLElement>('[data-doc-tab="design"]')?.click();
    posthog.capture.mockClear();
    document.querySelector<HTMLElement>('[data-download-design] .label')?.click();

    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith('design_md_downloaded', { slug: 'linear.app' });
  });

  it('keeps every interaction working without PostHog', () => {
    delete (window as unknown as { posthog?: unknown }).posthog;
    initializeDocumentTabs();

    document.querySelector<HTMLElement>('[data-doc-tab="design"]')?.click();

    expect(document.querySelector('[data-doc-tab="design"]')?.getAttribute('aria-selected')).toBe('true');
    expect(document.querySelector('[data-copy-design]')?.hasAttribute('disabled')).toBe(false);
  });
});
