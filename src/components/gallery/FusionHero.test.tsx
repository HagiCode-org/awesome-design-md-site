import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import FusionHero from '@/components/gallery/FusionHero';
import type { FusionStage } from '@/lib/content/fusionHeroData';

afterEach(() => {
  cleanup();
});

const stages: FusionStage[] = ['stripe', 'linear.app', 'spotify'].map((slug) => ({
  slug,
  title: slug.split('.')[0].toUpperCase(),
  href: `/designs/${slug}/`,
  lightImageUrl: `/preview-images/${slug}/light-tablet.avif`,
  darkImageUrl: `/preview-images/${slug}/dark-tablet.avif`,
  lines: [
    { kind: 'h1', text: `# Design System Inspiration of ${slug}` },
    { kind: 'h2', text: '## 1. Visual Theme & Atmosphere' },
  ],
  palette: ['#533afd', '#061b31'],
}));

describe('FusionHero', () => {
  it('leads with the fused headline, the catalog count and both calls to action', () => {
    render(<FusionHero locale="en" stages={stages} entryCount={58} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('DESIGN.md in.Shipped UI out.');
    expect(screen.getByText(/Awesome Design MD: 58 real design systems/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse 58 design systems/ })).toHaveAttribute('href', '#gallery-catalog');
    expect(screen.getByRole('link', { name: /Build it with HagiCode/ })).toHaveAttribute('target', '_blank');
  });

  it('tags both calls to action with stable GA attributes', () => {
    const { container } = render(<FusionHero locale="en" stages={stages} entryCount={58} />);
    const tagged = Array.from(container.querySelectorAll('[data-ga-category]')).map((el) => [
      el.getAttribute('data-ga-label'),
      el.getAttribute('data-ga-location'),
    ]);

    expect(tagged).toEqual([
      ['heroBrowse', 'design_hero'],
      ['heroHagicode', 'design_hero'],
    ]);
  });

  it('quotes the DESIGN.md and shows the rendered preview image for the selected design', () => {
    render(<FusionHero locale="en" stages={stages} entryCount={58} />);

    expect(screen.getByText('# Design System Inspiration of stripe')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'STRIPE preview image' })).toHaveAttribute(
      'src',
      '/preview-images/stripe/dark-tablet.avif',
    );
    expect(screen.getByRole('link', { name: 'Open the STRIPE design' })).toHaveAttribute('href', '/designs/stripe/');
  });

  it('switches design from the tabs, by click and by arrow keys', () => {
    render(<FusionHero locale="en" stages={stages} entryCount={58} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(tabs[2]);
    expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('img', { name: 'SPOTIFY preview image' })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('lets the visitor stop and resume the animation', () => {
    const { container } = render(<FusionHero locale="en" stages={stages} entryCount={58} />);
    const stage = container.querySelector('.fx-stage');

    expect(stage).toHaveAttribute('data-playing', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Stop animation' }));
    expect(stage).toHaveAttribute('data-playing', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Play animation' }));
    expect(stage).toHaveAttribute('data-playing', 'true');
  });

  it('renders copy only when the catalog is empty', () => {
    render(<FusionHero locale="zh-CN" stages={[]} entryCount={0} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('放入 DESIGN.md。取回成品界面。');
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });
});
