import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = [
  {
    path: new URL('../dist/index.html', import.meta.url),
    href: 'https://hagilight.hagicode.com/rss.xml',
    label: 'RSS Feed',
  },
  {
    path: new URL('../dist/zh-CN/index.html', import.meta.url),
    href: 'https://hagilight.hagicode.com/rss.zh-CN.xml',
    label: '当前语言 RSS',
  },
];

for (const page of pages) {
  const html = await readFile(page.path, 'utf8');
  const rssLink = [...html.matchAll(/<a\b([^>]*)>(.*?)<\/a>/gs)].find(([, attributes]) =>
    attributes.includes(`href="${page.href}"`),
  );

  assert.match(html, /<footer\b[^>]*class="[^"]*\bhagilight-footer\b/u);
  assert.ok(rssLink, `Expected ${page.href} in ${page.path.pathname}`);
  assert.equal(rssLink[2].trim(), page.label);
}
