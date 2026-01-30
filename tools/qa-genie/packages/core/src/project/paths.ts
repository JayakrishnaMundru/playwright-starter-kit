import path from 'node:path';

export function resolveProjectDir(outDir: string, slug: string) {
  return path.resolve(outDir, slug);
}

export function projectPaths(projectDir: string) {
  return {
    projectDir,
    specPath: path.join(projectDir, 'spec.yaml'),
    inventoryPath: path.join(projectDir, 'inventory.json'),
    screenshotsDir: path.join(projectDir, 'screenshots'),
    artifactsDir: path.join(projectDir, 'artifacts'),
    manualCsvPath: path.join(projectDir, 'manual-tests.csv'),
    playwrightDir: path.join(projectDir, 'playwright'),
  };
}
