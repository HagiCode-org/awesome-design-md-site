import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('renders generated non-English labels and summaries for Desktop-supported locales', async () => {
    document.body.innerHTML = `
      <div data-design-card data-slug="stripe"></div>
      <div data-design-card data-slug="airbnb"></div>
    `;
    window.history.replaceState({}, '', '/de-DE/?q=stripe');

    render(<SearchToolbar entries={entries} totalCount={entries.length} locale="de-DE" />);

    await waitFor(() => {
      expect(screen.getByLabelText('Suchwort')).toBeInTheDocument();
      expect(screen.getByText('1 Ergebnis für "stripe"')).toBeInTheDocument();
      expect(screen.getByText('Katalog durchsuchen')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Suchwort');
    fireEvent.change(input, { target: { value: 'unknown' } });

    await waitFor(() => {
      expect(screen.getByText('Keine passenden Designs')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Suche löschen' })).toBeInTheDocument();
    });
  });

  it('focuses the search box when / is pressed outside a text field', async () => {
    render(<SearchToolbar entries={entries} totalCount={entries.length} />);

    const input = screen.getByLabelText('Keyword');
    expect(input).not.toHaveFocus();

    fireEvent.keyDown(document.body, { key: '/' });

    await waitFor(() => expect(input).toHaveFocus());
  });

  it('clears the query with Escape while the search box is focused', async () => {
    window.history.replaceState({}, '', '/?q=stripe');
    render(<SearchToolbar entries={entries} totalCount={entries.length} />);

    const input = screen.getByLabelText('Keyword');
    await waitFor(() => expect(input).toHaveValue('stripe'));

    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(input).toHaveValue('');
      expect(screen.getByText('2 designs indexed')).toBeInTheDocument();
    });
  });
});

describe('SearchToolbar PostHog search event', () => {
  type FakePostHog = { __loaded: boolean; capture: ReturnType<typeof vi.fn>; has_opted_out_capturing: () => boolean };

  let posthog: FakePostHog;

  const searchEvents = () =>
    posthog.capture.mock.calls.filter(([name]) => name === 'design_search_used');

  beforeEach(() => {
    vi.useFakeTimers();
    posthog = { __loaded: true, capture: vi.fn(), has_opted_out_capturing: () => false };
    (window as unknown as { posthog: FakePostHog }).posthog = posthog;
    document.body.innerHTML = `
      <div data-design-card data-slug="stripe"></div>
      <div data-design-card data-slug="airbnb"></div>
    `;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as unknown as { posthog?: unknown }).posthog;
  });

  it('sends one event for a typing burst, after the query settles, with only results_count', () => {
    render(<SearchToolbar entries={entries} totalCount={entries.length} />);
    const input = screen.getByLabelText('Keyword');

    fireEvent.change(input, { target: { value: 's' } });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.change(input, { target: { value: 'st' } });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.change(input, { target: { value: 'stripe' } });

    act(() => vi.advanceTimersByTime(399));
    expect(searchEvents()).toHaveLength(0);

    act(() => vi.advanceTimersByTime(1));
    expect(searchEvents()).toHaveLength(1);
    expect(posthog.capture).toHaveBeenCalledWith('design_search_used', { results_count: 1 });
    expect(Object.keys(searchEvents()[0][1] as object)).toEqual(['results_count']);
  });

  it('does not send for the query restored from the URL on load', () => {
    window.history.replaceState({}, '', '/?q=stripe');
    render(<SearchToolbar entries={entries} totalCount={entries.length} />);

    act(() => vi.advanceTimersByTime(2000));

    expect(searchEvents()).toHaveLength(0);
  });

  it('does not send again when the settled query is unchanged', () => {
    render(<SearchToolbar entries={entries} totalCount={entries.length} />);
    const input = screen.getByLabelText('Keyword');

    fireEvent.change(input, { target: { value: 'stripe' } });
    act(() => vi.advanceTimersByTime(400));
    expect(searchEvents()).toHaveLength(1);

    // Typing away and back within the settle window leaves the settled query unchanged.
    fireEvent.change(input, { target: { value: 'stripes' } });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.change(input, { target: { value: 'stripe' } });
    act(() => vi.advanceTimersByTime(1000));

    expect(searchEvents()).toHaveLength(1);
  });

  it('does not send when the query is cleared', () => {
    window.history.replaceState({}, '', '/?q=stripe');
    render(<SearchToolbar entries={entries} totalCount={entries.length} />);
    const input = screen.getByLabelText('Keyword');

    fireEvent.change(input, { target: { value: '' } });
    act(() => vi.advanceTimersByTime(1000));

    expect(searchEvents()).toHaveLength(0);
  });
});
