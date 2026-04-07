import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { updateFooterSitesSnapshot } from '../../../scripts/footer-sites-snapshot-workflow.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(repoRoot, 'src', 'data', 'footer-sites.snapshot.json');

try {
  await updateFooterSitesSnapshot({ outputPath });
  console.log(`Footer sites snapshot updated at ${path.relative(repoRoot, outputPath)}`);
} catch (error) {
  try {
    await stat(outputPath);
  } catch {
    throw error;
  }

  console.warn(
    `Footer sites snapshot refresh failed, reusing existing snapshot at ${path.relative(repoRoot, outputPath)}: ${error instanceof Error ? error.message : String(error)}`,
  );
}
