import { startTransition, useEffect, useEffectEvent, useState } from 'react';
import { localeCopy, type SupportedLocale } from '@/config/site';

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

export default function SearchToolbar({ entries, totalCount, locale = 'en' }: Props) {
  const [query, setQuery] = useState('');
  const [ready, setReady] = useState(false);
  const copy = localeCopy[locale].search;
  const normalizedQuery = normalizeSearchQuery(query);
  const visibleEntries = filterDesignEntries(entries, normalizedQuery);
  const resultCount = visibleEntries.length;

  const syncCards = useEffectEvent((slugs: string[]) => {
    const visible = new Set(slugs);

    document.querySelectorAll<HTMLElement>('[data-design-card]').forEach((card) => {
      const slug = card.dataset.slug;
      card.hidden = slug ? !visible.has(slug) : false;
    });
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

  useEffect(() => {
    if (!ready) {
      return;
    }

    syncCards(visibleEntries.map((entry) => entry.slug));
    syncUrl(normalizedQuery);
  }, [normalizedQuery, ready, syncCards, syncUrl, visibleEntries]);

  const summary =
    normalizedQuery.length > 0
      ? locale === 'en'
        ? `${resultCount} ${resultCount === 1 ? copy.resultNounSingular : copy.resultNounPlural} ${copy.resultPrefix} "${query.trim()}"`
        : `${copy.resultPrefix} "${query.trim()}"，共 ${resultCount} ${copy.resultNounPlural}`
      : locale === 'en'
        ? `${totalCount} ${totalCount === 1 ? copy.indexedNounSingular : copy.indexedNounPlural} ${copy.indexedSuffix}`
        : `${totalCount} ${copy.indexedNounPlural}${copy.indexedSuffix}`;

  return (
    <section className="gallery-toolbar shell-panel" aria-label="Gallery search">
      <div className="gallery-toolbar-head">
        <div>
          <p className="gallery-toolbar-label">{copy.searchCatalog}</p>
          <p className="gallery-toolbar-summary">{summary}</p>
        </div>
        <p className="gallery-toolbar-note">{copy.note}</p>
      </div>

      <label className="gallery-search-field">
        <span className="gallery-search-label">{copy.keywordLabel}</span>
        <input
          type="search"
          name="q"
          value={query}
          placeholder={copy.placeholder}
          className="gallery-search-input"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

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
