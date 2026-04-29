import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import {
  generateI18nResources,
  loadYamlLocaleTree,
  verifyGeneratedI18nResources,
} from './generate-i18n-resources.mjs';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceLocalesRoot = path.join(siteRoot, 'src/i18n/locales');

const tempDirectories: string[] = [];

async function createTempLocaleFixture() {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'awesome-design-i18n-'));
  const localesRoot = path.join(tempRoot, 'locales');
  const generatedPath = path.join(tempRoot, 'site-locale-resources.ts');

  await fs.cp(sourceLocalesRoot, localesRoot, { recursive: true });
  tempDirectories.push(tempRoot);

  return {
    tempRoot,
    localesRoot,
    generatedPath,
  };
}

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) =>
      fs.rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe('generate-i18n-resources', () => {
  it('loads the YAML locale tree and emits a synchronous runtime module', async () => {
    const fixture = await createTempLocaleFixture();

    const tree = await loadYamlLocaleTree({ localesRoot: fixture.localesRoot });
    const result = await generateI18nResources({
      localesRoot: fixture.localesRoot,
      generatedPath: fixture.generatedPath,
    });
    const generatedModule = await fs.readFile(fixture.generatedPath, 'utf8');

    expect(tree.expectedSourceLocales).toHaveLength(10);
    expect(tree.routeLocales['ja-JP']).toMatchObject({
      sourceLocale: 'ja-JP',
      compactLabel: '日',
      ogLocale: 'ja_JP',
    });
    expect(result).toMatchObject({ localeCount: 10, namespaceCount: 5 });
    expect(generatedModule).toContain('export const SITE_LOCALE_RESOURCES');
    expect(generatedModule).toContain('"defaultRouteLocale": "en"');
  });

  it('fails when a target locale loses a scalar key path from the base namespace', async () => {
    const fixture = await createTempLocaleFixture();
    const targetFile = path.join(fixture.localesRoot, 'de-DE', 'gallery.yml');
    const parsed = JSON.parse(await fs.readFile(targetFile, 'utf8'));

    delete parsed.search.clearSearch;
    await fs.writeFile(targetFile, JSON.stringify(parsed), 'utf8');

    await expect(loadYamlLocaleTree({ localesRoot: fixture.localesRoot })).rejects.toThrow(
      'de-DE/gallery.yml scalar key paths must match en-US/gallery.yml',
    );
  });

  it('fails when placeholder sets drift between the base and target locale trees', async () => {
    const fixture = await createTempLocaleFixture();
    const targetFile = path.join(fixture.localesRoot, 'fr-FR', 'gallery.yml');
    const parsed = JSON.parse(await fs.readFile(targetFile, 'utf8'));

    parsed.search.summaryResults = '{{count}} {{noun}}';
    await fs.writeFile(targetFile, JSON.stringify(parsed), 'utf8');

    await expect(loadYamlLocaleTree({ localesRoot: fixture.localesRoot })).rejects.toThrow(
      'placeholders',
    );
  });

  it('detects stale generated runtime resources in check mode', async () => {
    const fixture = await createTempLocaleFixture();

    await generateI18nResources({
      localesRoot: fixture.localesRoot,
      generatedPath: fixture.generatedPath,
    });
    await fs.appendFile(fixture.generatedPath, '\n// stale\n', 'utf8');

    await expect(
      verifyGeneratedI18nResources({
        localesRoot: fixture.localesRoot,
        generatedPath: fixture.generatedPath,
      }),
    ).rejects.toThrow('is stale; rerun npm run i18n:generate');
  });
});
