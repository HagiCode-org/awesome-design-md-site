import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SearchToolbar from '@/components/gallery/SearchToolbar';

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  window.history.replaceState({}, '', '/');
});

const entries = [
  {
    slug: 'stripe',
    title: 'Stripe',
    summary: 'Fintech landing pages and premium data surfaces.',
    searchText: 'stripe fintech landing pages premium data surfaces',
  },
  {
    slug: 'airbnb',
    title: 'Airbnb',
    summary: 'Travel cards and hospitality storytelling.',
    searchText: 'airbnb travel cards hospitality storytelling',
  },
];

describe('SearchToolbar', () => {
  it('hydrates from the q query parameter and filters visible cards', async () => {
    document.body.innerHTML = `
      <div data-design-card data-slug="stripe"></div>
      <div data-design-card data-slug="airbnb"></div>
    `;
    window.history.replaceState({}, '', '/?q=stripe');

    render(<SearchToolbar entries={entries} totalCount={entries.length} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('stripe')).toBeInTheDocument();
      expect(screen.getByText('1 result for "stripe"')).toBeInTheDocument();
      expect(document.querySelector('[data-slug="stripe"]')).not.toHaveAttribute('hidden');
      expect(document.querySelector('[data-slug="airbnb"]')).toHaveAttribute('hidden');
    });
  });

  it('shows a no-results state and clears the search back to the full gallery', async () => {
    document.body.innerHTML = `
      <div data-design-card data-slug="stripe"></div>
      <div data-design-card data-slug="airbnb"></div>
    `;

    render(<SearchToolbar entries={entries} totalCount={entries.length} />);

    const input = screen.getByLabelText('Keyword');
    fireEvent.change(input, { target: { value: 'unknown' } });

    await waitFor(() => {
      expect(screen.getByText('No matching designs')).toBeInTheDocument();
      expect(document.querySelector('[data-slug="stripe"]')).toHaveAttribute('hidden');
      expect(document.querySelector('[data-slug="airbnb"]')).toHaveAttribute('hidden');
      expect(window.location.search).toBe('?q=unknown');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    await waitFor(() => {
      expect(screen.getByText('2 designs indexed')).toBeInTheDocument();
      expect(document.querySelector('[data-slug="stripe"]')).not.toHaveAttribute('hidden');
      expect(document.querySelector('[data-slug="airbnb"]')).not.toHaveAttribute('hidden');
      expect(window.location.search).toBe('');
    });
  });
});
