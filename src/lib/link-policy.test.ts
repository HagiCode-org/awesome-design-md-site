import { describe, expect, it } from 'vitest';

import { getExternalLinkRel, isFirstPartyHref } from './link-policy';

describe('first-party link policy', () => {
  it.each([
    'https://www.hagicode.com',
    'https://hagicode.com/',
    'https://docs.hagicode.com/',
    'https://github.com/HagiCode-org/awesome-design-md-site',
    'https://github.com/hagicode-org/site/issues',
    '/design/',
  ])('classifies %s as first-party', (href) => {
    expect(isFirstPartyHref(href)).toBe(true);
    expect(getExternalLinkRel(href)).toBe('noopener');
  });

  it.each([
    'https://www.youtube.com/watch?v=AQ8oSTW6wNQ',
    'https://www.bilibili.com/video/BV1z4oWB3EpY/',
    'https://hagicode.com.evil.example/',
    'https://nothagicode.com/',
    'https://example.com/hagicode.com',
    'https://github.com/HagiCode-org-fake/site',
    '//evil.example/hagicode.com',
  ])('classifies %s as third-party', (href) => {
    expect(isFirstPartyHref(href)).toBe(false);
    expect(getExternalLinkRel(href)).toBe('noopener noreferrer');
  });

  it('treats a missing destination as third-party', () => {
    expect(getExternalLinkRel(undefined)).toBe('noopener noreferrer');
  });
});
