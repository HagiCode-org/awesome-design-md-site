import { describe, expect, it } from 'vitest';

import { resolveAwesomeDesignFooterSiteLinks } from './footer-site-links';

describe('awesome design footer site links', () => {
  it('uses the bundled snapshot, excludes the current gallery site, and keeps canonical destinations', () => {
    const links = resolveAwesomeDesignFooterSiteLinks('en');

    expect(links.some((link) => link.href === 'https://design.hagicode.com/')).toBe(false);
    expect(links.some((link) => link.href === 'https://builder.hagicode.com/')).toBe(true);
    expect(links.find((link) => link.siteId === 'hagicode-docs')).toMatchObject({
      label: 'HagiCode Docs',
      description: 'Official guides and references.',
    });
  });

  it('maps route locales to multilingual footer metadata', () => {
    const links = resolveAwesomeDesignFooterSiteLinks('de-DE');

    expect(links.find((link) => link.siteId === 'hagicode-docs')).toMatchObject({
      label: 'HagiCode Docs',
      description: 'Offizielle Anleitungen und Referenzen.',
    });
  });
});
