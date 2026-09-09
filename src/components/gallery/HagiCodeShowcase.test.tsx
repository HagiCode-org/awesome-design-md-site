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

  it('selects Bilibili for Chinese locales and YouTube otherwise', () => {
    expect(getHomepageFallbackProvider('zh-CN')).toBe('bilibili');
    expect(getHomepageFallbackProvider('zh-Hant')).toBe('bilibili');
    expect(getHomepageFallbackProvider('ja-JP')).toBe('youtube');
  });
});