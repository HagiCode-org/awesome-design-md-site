import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';

import GalleryPreviewThemeSync from '@/components/gallery/GalleryPreviewThemeSync';

function mountThumbs() {
  document.body.innerHTML = `
    <img
      id="dedicated"
      data-preview-thumb
      src="/preview-images/linear.app/light-thumb.avif"
      data-light-src="/preview-images/linear.app/light-thumb.avif"
      data-dark-src="/preview-images/linear.app/dark-thumb.avif"
    />
    <img
      id="light-only"
      data-preview-thumb
      src="/preview-images/beta/light-thumb.avif"
      data-light-src="/preview-images/beta/light-thumb.avif"
      data-dark-src="/preview-images/beta/light-thumb.avif"
    />
  `;
}

function thumb(id: string) {
  return document.getElementById(id);
}

describe('GalleryPreviewThemeSync', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'light';
    mountThumbs();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('follows data-theme with the dark thumbnail and back to the light one', async () => {
    render(<GalleryPreviewThemeSync />);

    document.documentElement.dataset.theme = 'dark';
    await waitFor(() => {
      expect(thumb('dedicated')?.getAttribute('src')).toBe('/preview-images/linear.app/dark-thumb.avif');
    });

    document.documentElement.dataset.theme = 'light';
    await waitFor(() => {
      expect(thumb('dedicated')?.getAttribute('src')).toBe('/preview-images/linear.app/light-thumb.avif');
    });
  });

  it('keeps a light-only entry on its light thumbnail in dark mode', async () => {
    render(<GalleryPreviewThemeSync />);

    document.documentElement.dataset.theme = 'dark';
    await waitFor(() => {
      expect(thumb('dedicated')?.getAttribute('src')).toBe('/preview-images/linear.app/dark-thumb.avif');
    });

    expect(thumb('light-only')?.getAttribute('src')).toBe('/preview-images/beta/light-thumb.avif');
  });
});
