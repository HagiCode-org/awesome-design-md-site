import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = [
  {
    path: new URL('../dist/index.html', import.meta.url),
    locale: 'en',
  },
  {
    path: new URL('../dist/zh-CN/index.html', import.meta.url),
    locale: 'zh-CN',
  },
];

for (const page of pages) {
  const html = await readFile(page.path, 'utf8');
  const banner = html.match(/<hagilight-promoto-banner\b([^>]*)>/u)?.[1];

  assert.ok(banner, `Expected hagilight banner markup in ${page.path.pathname}`);
  assert.match(banner, /\bclass="[^"]*\bhagilight-promoto\b/u);
  assert.match(banner, new RegExp(`\\bdata-locale="${page.locale}"`, 'u'));
  assert.doesNotMatch(html, /\bdata-promote-card\b/u);
}
