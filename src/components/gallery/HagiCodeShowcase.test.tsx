import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import HagiCodeShowcase from '@/components/gallery/HagiCodeShowcase';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('HagiCodeShowcase', () => {
  it('renders generated showcase copy and localized controls', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );

    render(<HagiCodeShowcase locale="ja-JP" />);

    expect(screen.getByText('Hagicode')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '前のスライド' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '次のスライド' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'HagiCode を見る' })).toHaveAttribute(
      'href',
      'https://hagicode.com',
    );

    fireEvent.click(screen.getByRole('button', { name: '次のスライド' }));

    expect(screen.getByText('マルチエージェントワークスペース')).toBeInTheDocument();
  });
});
