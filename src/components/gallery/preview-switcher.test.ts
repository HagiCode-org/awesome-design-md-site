import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initializePreviewSwitchers } from '@/components/gallery/preview-switcher';

function mount(theme: 'light' | 'dark', darkUrl = '/previews/x/dark.html') {
  document.documentElement.dataset.theme = theme;
  document.body.innerHTML = `
    <section data-preview-switcher data-light-url="/previews/x/light.html" data-dark-url="${darkUrl}">
      <button type="button" data-preview-variant="light" aria-pressed="true">Light</button>
      <button type="button" data-preview-variant="dark" aria-pressed="false">Dark</button>
      <button type="button" data-preview-viewport="fit" aria-pressed="true">Fit</button>
      <button type="button" data-preview-viewport="tablet" aria-pressed="false">Tablet</button>
      <button type="button" data-preview-viewport="mobile" aria-pressed="false">Mobile</button>
      <a data-preview-open href="/previews/x/light.html">Open</a>
      <div data-preview-stage data-state="loading" aria-busy="true">
        <iframe data-preview-frame></iframe>
      </div>
      <output data-preview-width></output>
    </section>
  `;
}

describe('initializePreviewSwitchers', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'light';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('loads the preview that matches the site theme and points the open link at it', () => {
    mount('dark');
    initializePreviewSwitchers();

    const frame = document.querySelector<HTMLIFrameElement>('[data-preview-frame]');
    expect(frame?.getAttribute('src')).toBe('/previews/x/dark.html');
    expect(document.querySelector<HTMLAnchorElement>('[data-preview-open]')?.getAttribute('href')).toBe(
      '/previews/x/dark.html',
    );
    expect(document.querySelector('[data-preview-variant="dark"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-preview-variant="light"]')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('marks the stage loading until the frame reports it has loaded', () => {
    mount('light');
    initializePreviewSwitchers();

    const stage = document.querySelector<HTMLElement>('[data-preview-stage]');
    expect(stage?.dataset.state).toBe('loading');
    expect(stage?.getAttribute('aria-busy')).toBe('true');

    document.querySelector('[data-preview-frame]')?.dispatchEvent(new Event('load'));

    expect(stage?.dataset.state).toBe('ready');
    expect(stage?.hasAttribute('aria-busy')).toBe(false);
  });

  it('does not reload the frame when dark falls back to the light asset', () => {
    mount('light', '/previews/x/light.html');
    initializePreviewSwitchers();

    const stage = document.querySelector<HTMLElement>('[data-preview-stage]');
    document.querySelector('[data-preview-frame]')?.dispatchEvent(new Event('load'));
    document.querySelector<HTMLElement>('[data-preview-variant="dark"]')?.click();

    expect(stage?.dataset.state).toBe('ready');
    expect(document.querySelector('[data-preview-variant="dark"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('switches the viewport width and keeps the pressed state in sync', () => {
    mount('light');
    initializePreviewSwitchers();

    const root = document.querySelector<HTMLElement>('[data-preview-switcher]');
    expect(root?.dataset.viewport).toBe('fit');

    document.querySelector<HTMLElement>('[data-preview-viewport="mobile"]')?.click();

    expect(root?.dataset.viewport).toBe('mobile');
    expect(document.querySelector('[data-preview-viewport="mobile"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-preview-viewport="fit"]')?.getAttribute('aria-pressed')).toBe('false');
  });
});
