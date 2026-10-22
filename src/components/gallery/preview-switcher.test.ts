import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  initializePreviewSwitchers,
  selectPreviewImage,
  type PreviewImages,
} from '@/components/gallery/preview-switcher';

function imageSet(name: string) {
  return {
    fit: { url: `/preview-images/x/${name}-fit.avif`, width: 1440, height: 5000 },
    tablet: { url: `/preview-images/x/${name}-tablet.avif`, width: 820, height: 6000 },
    mobile: { url: `/preview-images/x/${name}-mobile.avif`, width: 390, height: 8000 },
    thumb: { url: `/preview-images/x/${name}-thumb.avif`, width: 780, height: 1131 },
  };
}

function imagesFor(dedicatedDark: boolean): PreviewImages {
  const light = imageSet('light');

  return { light, dark: dedicatedDark ? imageSet('dark') : light };
}

const labels = JSON.stringify({ light: 'Light', dark: 'Dark', fit: 'Fit', tablet: 'Tablet', mobile: 'Mobile' });

function mount(theme: 'light' | 'dark', dedicatedDark = true) {
  document.documentElement.dataset.theme = theme;
  const images = imagesFor(dedicatedDark);
  document.body.innerHTML = `
    <section data-preview-switcher data-light-url="/previews/x/light.html" data-dark-url="/previews/x/dark.html"
      data-images='${JSON.stringify(images)}' data-alt-template="X {{variant}} preview, {{viewport}}" data-labels='${labels}'>
      <button type="button" data-preview-variant="light" aria-pressed="true">Light</button>
      <button type="button" data-preview-variant="dark" aria-pressed="false">Dark</button>
      <button type="button" data-preview-viewport="fit" aria-pressed="true">Fit</button>
      <button type="button" data-preview-viewport="tablet" aria-pressed="false">Tablet</button>
      <button type="button" data-preview-viewport="mobile" aria-pressed="false">Mobile</button>
      <a data-preview-open href="/previews/x/light.html">Open</a>
      <div data-preview-stage data-state="loading" aria-busy="true">
        <img data-preview-image alt="" src="${images.light.fit.url}" width="1440" height="5000">
        <p data-preview-error hidden>Failed <a data-preview-live href="/previews/x/light.html">Open live</a></p>
      </div>
      <output data-preview-width></output>
    </section>
  `;
}

function image() {
  return document.querySelector<HTMLImageElement>('[data-preview-image]');
}

function stage() {
  return document.querySelector<HTMLElement>('[data-preview-stage]');
}

describe('selectPreviewImage', () => {
  it('chooses the image by theme and viewport, without any URL building', () => {
    const images = imagesFor(true);

    expect(selectPreviewImage(images, 'dark', 'tablet').url).toBe('/preview-images/x/dark-tablet.avif');
    expect(selectPreviewImage(images, 'light', 'mobile').width).toBe(390);
  });
});

describe('initializePreviewSwitchers', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'light';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('loads the image that matches the site theme and points the open link at the live page', () => {
    mount('dark');
    initializePreviewSwitchers();

    expect(image()?.getAttribute('src')).toBe('/preview-images/x/dark-fit.avif');
    expect(document.querySelector<HTMLAnchorElement>('[data-preview-open]')?.getAttribute('href')).toBe(
      '/previews/x/dark.html',
    );
    expect(document.querySelector<HTMLAnchorElement>('[data-preview-live]')?.getAttribute('href')).toBe(
      '/previews/x/dark.html',
    );
    expect(document.querySelector('[data-preview-variant="dark"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-preview-variant="light"]')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('marks the stage loading until the image reports it has loaded', () => {
    mount('light');
    initializePreviewSwitchers();

    expect(stage()?.dataset.state).toBe('loading');
    expect(stage()?.getAttribute('aria-busy')).toBe('true');

    image()?.dispatchEvent(new Event('load'));

    expect(stage()?.dataset.state).toBe('ready');
    expect(stage()?.hasAttribute('aria-busy')).toBe(false);
  });

  it('shows the message and the live link when the image fails to load', () => {
    mount('light');
    initializePreviewSwitchers();

    image()?.dispatchEvent(new Event('error'));

    expect(stage()?.dataset.state).toBe('error');
    expect(image()?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('[data-preview-error]')?.hidden).toBe(false);
  });

  it('switches the viewport to the matching render and width, without leaving the variant', () => {
    mount('light');
    initializePreviewSwitchers();
    image()?.dispatchEvent(new Event('load'));

    const root = document.querySelector<HTMLElement>('[data-preview-switcher]');
    expect(root?.dataset.viewport).toBe('fit');

    document.querySelector<HTMLElement>('[data-preview-viewport="mobile"]')?.click();

    expect(root?.dataset.viewport).toBe('mobile');
    expect(image()?.getAttribute('src')).toBe('/preview-images/x/light-mobile.avif');
    expect(image()?.getAttribute('width')).toBe('390');
    expect(image()?.alt).toBe('X Light preview, Mobile');
    expect(stage()?.dataset.state).toBe('loading');
    expect(document.querySelector('[data-preview-viewport="mobile"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-preview-viewport="fit"]')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('switches to the dark image in place when the variant changes', () => {
    mount('light');
    initializePreviewSwitchers();

    document.querySelector<HTMLElement>('[data-preview-variant="dark"]')?.click();

    expect(image()?.getAttribute('src')).toBe('/preview-images/x/dark-fit.avif');
    expect(document.querySelector<HTMLAnchorElement>('[data-preview-open]')?.getAttribute('href')).toBe(
      '/previews/x/dark.html',
    );
  });

  it('keeps the loaded image when dark falls back to the light set', () => {
    mount('light', false);
    initializePreviewSwitchers();
    image()?.dispatchEvent(new Event('load'));

    document.querySelector<HTMLElement>('[data-preview-variant="dark"]')?.click();

    expect(image()?.getAttribute('src')).toBe('/preview-images/x/light-fit.avif');
    expect(stage()?.dataset.state).toBe('ready');
    expect(document.querySelector('[data-preview-variant="dark"]')?.getAttribute('aria-pressed')).toBe('true');
  });
});
