import { startTransition, useEffect, useEffectEvent, useId, useRef, useState } from 'react';
import { getSearchSummary, localeCopy, type SupportedLocale } from '@/config/site';

export interface SearchToolbarEntry {
  slug: string;
  title: string;
  summary: string;
  searchText: string;
}

interface Props {
  entries: SearchToolbarEntry[];
  totalCount: number;
  locale?: SupportedLocale;
}

export function normalizeSearchQuery(value: string): string {
  return value.trim().toLocaleLowerCase('en');
}

export function filterDesignEntries(
  entries: SearchToolbarEntry[],
  query: string,
): SearchToolbarEntry[] {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return entries;
  }

  return entries.filter((entry) => entry.searchText.includes(normalizedQuery));
}

const REFLOW_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * Applies a card visibility change and lets the cards that stay slide to their new grid cell
 * (FLIP, transform only); cards that appear fade up. Falls back to a plain toggle without the
 * Web Animations API or when the visitor prefers reduced motion.
 */
function applyCardVisibility(cards: HTMLElement[], visible: Set<string>) {
  const toggle = () => {
    cards.forEach((card) => {
      const slug = card.dataset.slug;
      card.hidden = slug ? !visible.has(slug) : false;
    });
  };
  const canAnimate =
    typeof cards[0]?.animate === 'function' &&
    !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (!canAnimate) {
    toggle();
    return;
  }

  const before = new Map(
    cards.filter((card) => !card.hidden).map((card) => [card, card.getBoundingClientRect()]),
  );
  toggle();

  let entering = 0;
  cards.forEach((card) => {
    if (card.hidden) {
      return;
    }

    const next = card.getBoundingClientRect();
    const previous = before.get(card);

    if (previous) {
      const dx = previous.left - next.left;
      const dy = previous.top - next.top;

      if (Math.abs(dx) >= 1 || Math.abs(dy) >= 1) {
        card.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
          { duration: 420, easing: REFLOW_EASING },
        );
      }
      return;
    }

    // Off-screen arrivals are not seen, so only animate cards that land in the viewport.
    if (next.bottom > 0 && next.top < window.innerHeight) {
      card.animate(
        [
          { opacity: 0, transform: 'translateY(14px) scale(0.98)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 320, delay: Math.min(entering * 18, 160), easing: REFLOW_EASING, fill: 'backwards' },
      );
      entering += 1;
    }
  });
}

export function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

export default function SearchToolbar({ entries, totalCount, locale = 'en' }: Props) {
  const [query, setQuery] = useState('');
  const [ready, setReady] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const copy = localeCopy[locale].search;
  const normalizedQuery = normalizeSearchQuery(query);
  const visibleEntries = filterDesignEntries(entries, normalizedQuery);
  const resultCount = visibleEntries.length;

  const syncCards = useEffectEvent((slugs: string[]) => {
    applyCardVisibility(
      Array.from(document.querySelectorAll<HTMLElement>('[data-design-card]')),
      new Set(slugs),
    );
  });

  const syncUrl = useEffectEvent((nextQuery: string) => {
    const url = new URL(window.location.href);

    if (nextQuery) {
      url.searchParams.set('q', nextQuery);
    } else {
      url.searchParams.delete('q');
    }

    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  });

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get('q') ?? '';
    startTransition(() => {
      setQuery(initialQuery);
      setReady(true);
    });
  }, []);

  // "/" jumps to the search box from anywhere on the page, the way most catalogs do.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== '/' ||
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    syncCards(visibleEntries.map((entry) => entry.slug));
    syncUrl(normalizedQuery);
  }, [normalizedQuery, ready, syncCards, syncUrl, visibleEntries]);

  const summary = getSearchSummary(
    locale,
    query,
    normalizedQuery.length > 0 ? resultCount : totalCount,
  );

  const shortcutHint = query ? (focused ? 'Esc' : null) : focused ? null : '/';

  return (
    <section className="gallery-toolbar shell-panel" aria-label={copy.ariaLabel}>
      <div className="gallery-toolbar-head">
        <div>
          <p className="gallery-toolbar-label">{copy.searchCatalog}</p>
          <p className="gallery-toolbar-summary" role="status">
            {summary}
          </p>
        </div>
        <p className="gallery-toolbar-note">{copy.note}</p>
      </div>

      <div className="gallery-search-field">
        <label className="gallery-search-label" htmlFor={inputId}>
          {copy.keywordLabel}
        </label>
        <span className="gallery-search-control">
          <input
            id={inputId}
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            placeholder={copy.placeholder}
            className="gallery-search-input"
            aria-keyshortcuts="/"
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && query) {
                event.preventDefault();
                setQuery('');
              }
            }}
          />
          {shortcutHint ? (
            <kbd aria-hidden="true" className={query ? 'is-beside-clear' : undefined}>
              {shortcutHint}
            </kbd>
          ) : null}
        </span>
      </div>

      {ready && normalizedQuery && resultCount === 0 ? (
        <div className="gallery-no-results" role="status">
          <div>
            <p className="gallery-no-results-title">{copy.noMatchingTitle}</p>
            <p className="gallery-no-results-copy">{copy.noMatchingCopy}</p>
          </div>
          <button type="button" className="gallery-clear-button" onClick={() => setQuery('')}>
            {copy.clearSearch}
          </button>
        </div>
      ) : null}
    </section>
  );
}
