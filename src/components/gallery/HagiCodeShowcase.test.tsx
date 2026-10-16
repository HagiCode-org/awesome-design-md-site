import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import HagiCodeShowcase from '@/components/gallery/HagiCodeShowcase';
import { getHomepageFallbackProvider } from '@/components/gallery/video-promo-model';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('HagiCodeShowcase', () => {
  it('renders generated showcase copy and localized controls', () => {
    render(<HagiCodeShowcase locale="ja-JP" />);

    expect(screen.getByText('Hagicode')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'HagiCode を見る' })).toHaveAttribute('href', 'https://www.hagicode.com');
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('target', '_blank');
    expect(screen.getByTitle('HagiCode overview')).toHaveAttribute('src', expect.stringContaining('youtube.com/embed'));
    expect(screen.getByRole('link', { name: 'Watch on YouTube' })).toHaveAttribute('target', '_blank');
  });

  it('tags the HagiCode links with stable GA click attributes', () => {
    const { container } = render(<HagiCodeShowcase locale="en" />);
    const tagged = Array.from(container.querySelectorAll('[data-ga-category]')).map((el) => [
      el.getAttribute('data-ga-category'),
      el.getAttribute('data-ga-label'),
      el.getAttribute('data-ga-location'),
    ]);

    expect(tagged).toEqual([
      ['navigation', 'showcasePrimary', 'design_showcase'],
      ['navigation', 'showcaseLearnMore', 'design_showcase'],
      ['download', 'microsoftStore', 'design_showcase'],
    ]);
  });

  it('selects Bilibili for Chinese locales and YouTube otherwise', () => {
    expect(getHomepageFallbackProvider('zh-CN')).toBe('bilibili');
    expect(getHomepageFallbackProvider('zh-Hant')).toBe('bilibili');
    expect(getHomepageFallbackProvider('ja-JP')).toBe('youtube');
  });
});