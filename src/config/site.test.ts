import { describe, expect, it } from 'vitest';

import { getGalleryNav, getLanguageLinks, localeCopy } from '@/config/site';

describe('header navigation config', () => {
  it('groups gallery and repository actions for the English shell', () => {
    const nav = getGalleryNav('en');

    expect(nav.find((item) => item.group === 'primary')).toMatchObject({
      label: 'Gallery',
      shortLabel: 'Gallery',
      href: '/',
    });
    expect(nav.filter((item) => item.group === 'repo')).toHaveLength(2);
    expect(localeCopy.en.chrome.mobileBrandLabel).toBe('ADMG');
  });

  it('keeps bilingual routes intact while exposing compact locale labels', () => {
    const links = getLanguageLinks('/zh-CN/designs/stripe');

    expect(links).toEqual([
      expect.objectContaining({
        locale: 'en',
        href: '/designs/stripe',
        shortLabel: 'EN',
      }),
      expect.objectContaining({
        locale: 'zh-CN',
        href: '/zh-CN/designs/stripe',
        shortLabel: '中',
      }),
    ]);
  });
});
