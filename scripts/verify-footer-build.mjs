import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const siteOrigin = new URL(process.env.SITE_URL ?? 'https://design.hagicode.com').origin;
const hagilightFaviconUrl = 'https://cdn.jsdelivr.net/npm/@hagicode/hagilight-core@0.4.0/favicon.ico';
const pages = [
  new URL('../dist/index.html', import.meta.url),
  new URL('../dist/zh-CN/index.html', import.meta.url),
];

for (const page of pages) {
  const html = await readFile(page, 'utf8');

  assert.equal([...html.matchAll(/<footer\b[^>]*class="[^"]*\bhagilight-footer\b[^"]*"/gu)].length, 1);
  const icons = [...html.matchAll(/<link\b[^>]*\brel="icon"[^>]*>/gu)];
  assert.equal(icons.length, 1);
  assert.ok(icons[0][0].includes(`href="${hagilightFaviconUrl}"`));
  assert.doesNotMatch(html, /application\/rss\+xml|\/rss(?:\.xml|\.zh-CN\.xml)/u);
}

const robots = await readFile(new URL('../dist/robots.txt', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../dist/sitemap-index.xml', import.meta.url), 'utf8');
assert.ok(robots.includes(`Sitemap: ${siteOrigin}/sitemap-index.xml`));
assert.ok(sitemap.includes(`${siteOrigin}/sitemap-0.xml`));
