import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  listLocaleDirectories,
  readYamlLocaleFile,
  resolveHagi18nConfig,
  walkYamlFiles,
} from '@hagicode/hagi18n';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDirectory, '..');
const defaultConfigPath = path.join(siteRoot, 'hagi18n.yaml');
const defaultGeneratedPath = path.join(siteRoot, 'src/i18n/generated/site-locale-resources.ts');
const expectedNamespaceFiles = [
  'chrome.yml',
  'common.yml',
  'gallery.yml',
  'metadata.yml',
  'promotion.yml',
];

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeNames(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function relativeToSiteRoot(filePath) {
  return toPosixPath(path.relative(siteRoot, filePath));
}

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function extractPlaceholders(value) {
  if (typeof value !== 'string') return [];

  return normalizeNames(
    [...value.matchAll(/\{\{\s*([A-Za-z0-9_$.-]+)(?:\s*,[^}]*)?\s*\}\}/gu)].map(
      (match) => match[1],
    ),
  );
}

function collectScalarEntries(value, prefix = []) {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectScalarEntries(entry, [...prefix, String(index)]));
  }

  if (isPlainObject(value)) {
    return Object.entries(value).flatMap(([key, entry]) => collectScalarEntries(entry, [...prefix, key]));
  }

  return [{ path: prefix.join('.'), value }];
}

function getScalarPathMap(namespaceData) {
  return new Map(collectScalarEntries(namespaceData).map((entry) => [entry.path, entry.value]));
}

function validateTargetNamespaceShape(baseLocale, targetLocale, namespace, baseData, targetData) {
  const baseScalars = getScalarPathMap(baseData);
  const targetScalars = getScalarPathMap(targetData);
  const basePaths = normalizeNames(baseScalars.keys());
  const targetPaths = normalizeNames(targetScalars.keys());

  assert.deepEqual(
    targetPaths,
    basePaths,
    `${targetLocale}/${namespace}.yml scalar key paths must match ${baseLocale}/${namespace}.yml`,
  );

  const placeholderErrors = [];
  for (const scalarPath of basePaths) {
    const basePlaceholders = extractPlaceholders(baseScalars.get(scalarPath));
    const targetPlaceholders = extractPlaceholders(targetScalars.get(scalarPath));

    if (formatJson(targetPlaceholders) !== formatJson(basePlaceholders)) {
      placeholderErrors.push(
        `${targetLocale}/${namespace}.yml:${scalarPath} placeholders ${formatJson(
          targetPlaceholders,
        )} do not match ${baseLocale} placeholders ${formatJson(basePlaceholders)}`,
      );
    }
  }

  assert.equal(placeholderErrors.length, 0, placeholderErrors.join('\n'));
}

async function resolveMetadata(options = {}) {
  const resolvedConfig = await resolveHagi18nConfig({
    cwd: siteRoot,
    configPath: options.configPath ?? defaultConfigPath,
  });
  const expectedSourceLocales = [resolvedConfig.baseLocale, ...resolvedConfig.targetLocales];

  return {
    configPath: resolvedConfig.configPath,
    localesRoot: path.resolve(options.localesRoot ?? resolvedConfig.localesRoot),
    generatedPath: path.resolve(options.generatedPath ?? defaultGeneratedPath),
    baseLocale: resolvedConfig.baseLocale,
    targetLocales: resolvedConfig.targetLocales,
    expectedSourceLocales,
    expectedNamespaceFiles,
  };
}

function validateRouteMetadata(resources, metadata) {
  const routeLocales = resources[metadata.baseLocale].metadata.locales;
  assert(isPlainObject(routeLocales), 'metadata.locales must be a top-level mapping');
  assert(routeLocales.en, 'metadata.locales.en is required for the unprefixed default route');
  assert.equal(routeLocales.en.sourceLocale, metadata.baseLocale, 'metadata.locales.en must map to en-US');

  const routeSourceLocales = [];
  for (const [routeLocale, localeMetadata] of Object.entries(routeLocales)) {
    assert(isPlainObject(localeMetadata), `metadata.locales.${routeLocale} must be a mapping`);
    assert.equal(localeMetadata.routeLocale, routeLocale, `metadata.locales.${routeLocale}.routeLocale mismatch`);
    assert.equal(typeof localeMetadata.sourceLocale, 'string', `metadata.locales.${routeLocale}.sourceLocale is required`);
    assert.equal(typeof localeMetadata.label, 'string', `metadata.locales.${routeLocale}.label is required`);
    assert.equal(typeof localeMetadata.compactLabel, 'string', `metadata.locales.${routeLocale}.compactLabel is required`);
    assert.equal(typeof localeMetadata.hreflang, 'string', `metadata.locales.${routeLocale}.hreflang is required`);
    assert.equal(typeof localeMetadata.ogLocale, 'string', `metadata.locales.${routeLocale}.ogLocale is required`);
    assert.equal(typeof localeMetadata.htmlLang, 'string', `metadata.locales.${routeLocale}.htmlLang is required`);
    assert.equal(typeof localeMetadata.direction, 'string', `metadata.locales.${routeLocale}.direction is required`);
    routeSourceLocales.push(localeMetadata.sourceLocale);
  }

  assert.deepEqual(
    normalizeNames(routeSourceLocales),
    normalizeNames(metadata.expectedSourceLocales),
    'Route/source locale metadata must cover the same source locales as hagi18n.yaml',
  );

  return routeLocales;
}

export async function loadYamlLocaleTree(options = {}) {
  const metadata = await resolveMetadata(options);
  const actualLocales = await listLocaleDirectories(metadata.localesRoot);

  assert.deepEqual(
    actualLocales,
    normalizeNames(metadata.expectedSourceLocales),
    `Locale directories in ${relativeToSiteRoot(metadata.localesRoot)} must match hagi18n.yaml`,
  );

  const resources = {};

  for (const locale of metadata.expectedSourceLocales) {
    const localeDirectory = path.join(metadata.localesRoot, locale);
    const namespaceFiles = normalizeNames(await walkYamlFiles(localeDirectory));

    assert.deepEqual(
      namespaceFiles,
      normalizeNames(metadata.expectedNamespaceFiles),
      `${locale} YAML namespace files must match the configured site namespaces`,
    );

    resources[locale] = {};
    for (const relativePath of namespaceFiles) {
      const namespace = relativePath.replace(/\.(?:ya?ml)$/u, '');
      const document = await readYamlLocaleFile(metadata.localesRoot, locale, relativePath);
      assert(
        isPlainObject(document.data),
        `${locale}/${relativePath} must be a YAML top-level mapping`,
      );
      resources[locale][namespace] = document.data;
    }
  }

  for (const targetLocale of metadata.targetLocales) {
    for (const namespaceFile of metadata.expectedNamespaceFiles) {
      const namespace = namespaceFile.replace(/\.(?:ya?ml)$/u, '');
      validateTargetNamespaceShape(
        metadata.baseLocale,
        targetLocale,
        namespace,
        resources[metadata.baseLocale][namespace],
        resources[targetLocale][namespace],
      );
    }
  }

  const routeLocales = validateRouteMetadata(resources, metadata);

  return {
    ...metadata,
    routeLocales,
    resources,
  };
}

function buildRuntime(metadata) {
  return {
    resources: metadata.resources,
    routeLocales: metadata.routeLocales,
    supportedRouteLocales: Object.keys(metadata.routeLocales),
    supportedSourceLocales: metadata.expectedSourceLocales,
    defaultRouteLocale: 'en',
    defaultSourceLocale: metadata.baseLocale,
  };
}

function buildGeneratedModule(metadata) {
  const runtimeJson = formatJson(buildRuntime(metadata));

  return `// This file is generated by scripts/generate-i18n-resources.mjs. Do not edit manually.
const runtime = ${runtimeJson} as const;

export const SITE_LOCALE_RESOURCES = runtime.resources;
export const SITE_ROUTE_LOCALES = runtime.routeLocales;
export const SUPPORTED_ROUTE_LOCALES = runtime.supportedRouteLocales;
export const SUPPORTED_SOURCE_LOCALES = runtime.supportedSourceLocales;
export const DEFAULT_ROUTE_LOCALE = runtime.defaultRouteLocale;
export const DEFAULT_SOURCE_LOCALE = runtime.defaultSourceLocale;
export default runtime;
`;
}

export async function generateI18nResources(options = {}) {
  const metadata = await loadYamlLocaleTree(options);
  const generatedModule = buildGeneratedModule(metadata);

  await fs.mkdir(path.dirname(metadata.generatedPath), { recursive: true });
  await fs.writeFile(metadata.generatedPath, generatedModule, 'utf8');

  return {
    generatedPath: metadata.generatedPath,
    localeCount: metadata.expectedSourceLocales.length,
    namespaceCount: metadata.expectedNamespaceFiles.length,
  };
}

export async function verifyGeneratedI18nResources(options = {}) {
  const metadata = await loadYamlLocaleTree(options);
  const expectedModule = buildGeneratedModule(metadata);
  const actualModule = await fs.readFile(metadata.generatedPath, 'utf8');

  assert.equal(
    actualModule,
    expectedModule,
    `${relativeToSiteRoot(metadata.generatedPath)} is stale; rerun npm run i18n:generate`,
  );

  return {
    generatedPath: metadata.generatedPath,
    localeCount: metadata.expectedSourceLocales.length,
    namespaceCount: metadata.expectedNamespaceFiles.length,
  };
}

function parseCliArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    switch (argument) {
      case '--check':
        options.check = true;
        break;
      case '--config':
        options.configPath = argv[index + 1];
        index += 1;
        break;
      case '--generated-path':
        options.generatedPath = argv[index + 1];
        index += 1;
        break;
      case '--locales-root':
        options.localesRoot = argv[index + 1];
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const result = options.check
    ? await verifyGeneratedI18nResources(options)
    : await generateI18nResources(options);

  console.log(
    `${options.check ? 'Verified' : 'Generated'} Awesome Design i18n resources in ${relativeToSiteRoot(
      result.generatedPath,
    )} for ${result.localeCount} locales and ${result.namespaceCount} namespaces.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
