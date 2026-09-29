import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const siteOrigin = new URL(process.env.SITE_URL ?? 'https://design.hagicode.com').origin;
const hagilightFaviconUrl = 'https://cdn.jsdelivr.net/npm/@hagicode/hagilight@0.2.5/favicon.ico';
const pages = [
  {
    path: new URL('../dist/index.html', import.meta.url),
    href: '/rss.xml',
    feedUrl: new URL('/rss.xml', siteOrigin).href,
    label: 'RSS Feed',
  },
  {
    path: new URL('../dist/zh-CN/index.html', import.meta.url),
    href: '/rss.zh-CN.xml',
    feedUrl: new URL('/rss.zh-CN.xml', siteOrigin).href,
    label: '当前语言 RSS',
  },
];

for (const page of pages) {
  const html = await readFile(page.path, 'utf8');
  const rssLink = [...html.matchAll(/<a\b([^>]*)>(.*?)<\/a>/gs)].find(([, attributes]) =>
    attributes.includes(`href="${page.href}"`),
  );

  assert.equal([...html.matchAll(/<footer\b[^>]*class="[^"]*\bhagilight-footer\b[^"]*"/gu)].length, 1);
  const icons = [...html.matchAll(/<link\b[^>]*\brel="icon"[^>]*>/gu)];
  assert.equal(icons.length, 1);
  assert.ok(icons[0][0].includes(`href="${hagilightFaviconUrl}"`));
  assert.ok(rssLink, `Expected ${page.href} in ${page.path.pathname}`);
  assert.equal(rssLink[2].trim(), page.label);
  const feedHeadLink = [...html.matchAll(/<link\b([^>]*)>/gu)].find(([, attributes]) =>
    attributes.includes(`href="${page.feedUrl}"`),
  );
  assert.ok(feedHeadLink);
  assert.match(feedHeadLink[1], /\brel="alternate"/u);
  assert.match(feedHeadLink[1], /\btype="application\/rss\+xml"/u);
}

const locales = ['en', 'zh-CN', 'zh-Hant', 'ja-JP', 'ko-KR', 'de-DE', 'fr-FR', 'es-ES', 'pt-BR', 'ru-RU'];
const designEntries = await readdir(new URL('../vendor/awesome-design-md/design-md/', import.meta.url), {
  withFileTypes: true,
});
const expectedItemCount = Math.min(50, designEntries.filter((entry) => entry.isDirectory()).length);

for (const locale of locales) {
  const filename = locale === 'en' ? 'rss.xml' : `rss.${locale}.xml`;
  const xml = await readFile(new URL(`../dist/${filename}`, import.meta.url), 'utf8');
  const feedUrl = new URL(`/${filename}`, siteOrigin).href;
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gu)].map(([, item]) => item);
  const dates = items.map((item) => Date.parse(item.match(/<pubDate>([^<]+)<\/pubDate>/u)?.[1] ?? ''));
  const expectedPath = locale === 'en' ? '/designs/' : `/${locale}/designs/`;

  assert.match(xml, /<rss version="2\.0" xmlns:atom="http:\/\/www\.w3\.org\/2005\/Atom">/u);
  assert.match(xml, new RegExp(`<language>${locale}</language>`, 'u'));
  assert.ok(xml.includes(`<atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>`));
  assert.equal(items.length, expectedItemCount, `${filename} contains the newest gallery entries`);
  assert.ok(items.every((item) => item.includes(`${siteOrigin}${expectedPath}`)));
  assert.ok(dates.every(Number.isFinite));
  assert.deepEqual(dates, [...dates].sort((left, right) => right - left));
}
