import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  captureSiteEvent,
  SITE_EVENT_STRING_MAX_LENGTH,
  SITE_POSTHOG_EVENTS,
} from '@/lib/posthog-events';

type FakePostHog = {
  __loaded?: boolean;
  capture: ReturnType<typeof vi.fn>;
  has_opted_out_capturing: ReturnType<typeof vi.fn>;
};

function fakePostHog(overrides: Partial<FakePostHog> = {}): FakePostHog {
  return {
    __loaded: true,
    capture: vi.fn(),
    has_opted_out_capturing: vi.fn(() => false),
    ...overrides,
  };
}

const FORBIDDEN_SUPER_KEYS = ['site_id', 'site_framework', 'hagilight_version', 'locale', 'page_type'];
const EVENT_NAME_PATTERN = /^[a-z]+(_[a-z]+)+$/;

describe('site PostHog event table', () => {
  it('names every event snake_case with object first and never lists a super property key', () => {
    const names = Object.keys(SITE_POSTHOG_EVENTS);

    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name).toMatch(EVENT_NAME_PATTERN);
      for (const key of Object.keys(SITE_POSTHOG_EVENTS[name])) {
        expect(FORBIDDEN_SUPER_KEYS).not.toContain(key);
      }
    }
  });

  it('is frozen', () => {
    expect(Object.isFrozen(SITE_POSTHOG_EVENTS)).toBe(true);
  });
});

describe('captureSiteEvent', () => {
  beforeEach(() => {
    delete (window as unknown as { posthog?: unknown }).posthog;
  });

  afterEach(() => {
    delete (window as unknown as { posthog?: unknown }).posthog;
    vi.restoreAllMocks();
  });

  it('sends a known event with its allowlisted properties', () => {
    const posthog = fakePostHog();

    captureSiteEvent('design_md_copied', { slug: 'acme' }, { posthog });

    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith('design_md_copied', { slug: 'acme' });
  });

  it('sends nothing for an event name that is not in the table', () => {
    const posthog = fakePostHog();

    captureSiteEvent('not_a_real_event', { slug: 'acme' }, { posthog });

    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it('drops keys that are not in the event allowlist', () => {
    const posthog = fakePostHog();

    captureSiteEvent(
      'design_md_copied',
      { slug: 'acme', search_term: 'stripe', url: 'https://example.com/designs/acme/DESIGN.md' },
      { posthog },
    );

    expect(posthog.capture).toHaveBeenCalledWith('design_md_copied', { slug: 'acme' });
  });

  it('drops values that are not primitives of the declared kind', () => {
    const posthog = fakePostHog();

    captureSiteEvent('design_md_copied', { slug: { raw: 'acme' } }, { posthog });
    captureSiteEvent('design_search_used', { results_count: -1 }, { posthog });
    captureSiteEvent('design_search_used', { results_count: 1.5 }, { posthog });
    captureSiteEvent('design_search_used', { results_count: '3' }, { posthog });
    captureSiteEvent('design_doc_tab_changed', { tab: 'settings' }, { posthog });

    expect(posthog.capture).toHaveBeenNthCalledWith(1, 'design_md_copied', {});
    expect(posthog.capture).toHaveBeenNthCalledWith(2, 'design_search_used', {});
    expect(posthog.capture).toHaveBeenNthCalledWith(3, 'design_search_used', {});
    expect(posthog.capture).toHaveBeenNthCalledWith(4, 'design_search_used', {});
    expect(posthog.capture).toHaveBeenNthCalledWith(5, 'design_doc_tab_changed', {});
  });

  it('caps string values at the maximum length', () => {
    const posthog = fakePostHog();
    const long = 'a'.repeat(SITE_EVENT_STRING_MAX_LENGTH + 40);

    captureSiteEvent('design_md_copied', { slug: long }, { posthog });

    const sent = posthog.capture.mock.calls[0][1] as { slug: string };
    expect(sent.slug).toHaveLength(SITE_EVENT_STRING_MAX_LENGTH);
  });

  it('drops super property keys even when a caller passes them', () => {
    const posthog = fakePostHog();

    captureSiteEvent(
      'design_search_used',
      { results_count: 4, site_id: 'awesome-design-gallery', locale: 'en', page_type: 'gallery' },
      { posthog },
    );

    expect(posthog.capture).toHaveBeenCalledWith('design_search_used', { results_count: 4 });
  });

  it('does nothing when window.posthog is undefined and does not throw', () => {
    expect(() => captureSiteEvent('design_md_copied', { slug: 'acme' })).not.toThrow();
  });

  it('reads window.posthog when no posthog option is passed', () => {
    const posthog = fakePostHog();
    (window as unknown as { posthog: FakePostHog }).posthog = posthog;

    captureSiteEvent('design_md_downloaded', { slug: 'acme' });

    expect(posthog.capture).toHaveBeenCalledWith('design_md_downloaded', { slug: 'acme' });
  });

  it('queues on the stub when __loaded is not true and does not call has_opted_out_capturing', () => {
    const posthog = fakePostHog({ __loaded: false });

    captureSiteEvent('design_md_copied', { slug: 'acme' }, { posthog });

    expect(posthog.capture).toHaveBeenCalledWith('design_md_copied', { slug: 'acme' });
    expect(posthog.has_opted_out_capturing).not.toHaveBeenCalled();
  });

  it('sends nothing once loaded when the visitor has opted out', () => {
    const posthog = fakePostHog({ has_opted_out_capturing: vi.fn(() => true) });

    captureSiteEvent('design_md_copied', { slug: 'acme' }, { posthog });

    expect(posthog.has_opted_out_capturing).toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it('sends nothing when isAllowed returns false', () => {
    const posthog = fakePostHog();

    captureSiteEvent('design_md_copied', { slug: 'acme' }, { posthog, isAllowed: () => false });

    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it('returns normally when capture throws', () => {
    const posthog = fakePostHog({
      capture: vi.fn(() => {
        throw new Error('network down');
      }),
    });

    expect(() => captureSiteEvent('design_md_copied', { slug: 'acme' }, { posthog })).not.toThrow();
  });
});

describe('site event representative payloads', () => {
  it('sends exactly the allowlisted key set for every event, ignoring URLs, free text and super properties', () => {
    for (const [name, table] of Object.entries(SITE_POSTHOG_EVENTS)) {
      const input: Record<string, unknown> = {
        url: 'https://example.com/designs/acme/DESIGN.md?token=secret#top',
        free_text: 'Please find my search for stripe here',
        site_id: 'awesome-design-gallery',
        site_framework: 'astro',
        hagilight_version: '0.18.0',
        locale: 'en',
        page_type: 'design',
      };
      const expectedKeys = Object.keys(table).sort();

      for (const [key, spec] of Object.entries(table)) {
        switch (spec.kind) {
          case 'string':
            input[key] = 'acme';
            break;
          case 'boolean':
            input[key] = true;
            break;
          case 'count':
            input[key] = 3;
            break;
          case 'enum':
            input[key] = spec.values[0];
            break;
        }
      }

      const posthog = {
        __loaded: true,
        capture: vi.fn(),
        has_opted_out_capturing: vi.fn(() => false),
      };

      captureSiteEvent(name, input, { posthog });

      expect(posthog.capture).toHaveBeenCalledTimes(1);
      const [sentName, sentProperties] = posthog.capture.mock.calls[0] as [string, Record<string, unknown>];
      expect(sentName).toBe(name);
      expect(Object.keys(sentProperties).sort()).toEqual(expectedKeys);
      expect(JSON.stringify(sentProperties)).not.toMatch(/https?:|secret|stripe/);
    }
  });
});
