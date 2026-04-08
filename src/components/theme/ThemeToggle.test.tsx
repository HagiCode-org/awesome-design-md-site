import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ThemeToggle from '@/components/theme/ThemeToggle';

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.dataset.theme = 'dark';
});

describe('ThemeToggle', () => {
  it('keeps compact mobile labels while preserving theme persistence', () => {
    document.documentElement.dataset.theme = 'dark';

    const { container } = render(<ThemeToggle locale="zh-CN" />);
    const button = screen.getByRole('button', { name: '切换到浅色模式' });

    expect(container.querySelector('.theme-toggle-label-full')).toHaveTextContent('深色');
    expect(container.querySelector('.theme-toggle-label-compact')).toHaveTextContent('深');

    fireEvent.click(button);

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('adms-theme')).toBe('light');
    expect(container.querySelector('.theme-toggle-label-full')).toHaveTextContent('浅色');
    expect(container.querySelector('.theme-toggle-label-compact')).toHaveTextContent('浅');
  });
});
