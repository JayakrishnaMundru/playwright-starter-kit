import fs from 'node:fs/promises';
import path from 'node:path';
import { projectPaths } from '../project/paths';
import { readSpec } from '../project/spec';
import type { Inventory } from './explore';

function csvEscape(v: string) {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

export async function generateManualCsv(projectDir: string, inv: Inventory) {
  const p = projectPaths(projectDir);
  const lines: string[] = [];
  lines.push(['TC_ID', 'Title', 'Action', 'Data', 'Expected'].map(csvEscape).join(','));

  let i = 1;
  for (const page of inv.pages) {
    const id = `TC-${String(i).padStart(3, '0')}`;
    lines.push(
      [
        id,
        `Open page: ${page.title || page.url}`,
        `Navigate to ${page.url}`,
        '',
        'Page loads without errors; key content is visible.',
      ]
        .map((x) => csvEscape(x))
        .join(','),
    );
    i++;

    // If forms exist, add one basic field presence test.
    if (page.forms.length) {
      const id2 = `TC-${String(i).padStart(3, '0')}`;
      const fieldSummary = page.forms
        .flatMap((f) => f.fields)
        .slice(0, 8)
        .map((f) => f.label || f.name || f.placeholder || f.type || 'field')
        .join('; ');
      lines.push(
        [
          id2,
          `Form fields visible: ${page.title || page.url}`,
          'Open the page and verify form inputs are present',
          `Fields: ${fieldSummary}`,
          'All expected form fields are visible/enabled.',
        ]
          .map((x) => csvEscape(x))
          .join(','),
      );
      i++;
    }
  }

  await fs.writeFile(p.manualCsvPath, lines.join('\n'), 'utf-8');
}

async function writePlaywrightProject(projectDir: string, specBaseUrl: string, inv: Inventory) {
  const p = projectPaths(projectDir);
  const outDir = p.playwrightDir;
  await fs.mkdir(path.join(outDir, 'tests'), { recursive: true });

  const pkg = {
    name: 'qa-genie-generated',
    private: true,
    version: '0.0.1',
    type: 'module',
    scripts: {
      test: 'playwright test',
      'test:ui': 'playwright test --ui',
      report: 'playwright show-report',
    },
    devDependencies: {
      '@playwright/test': '^1.58.0',
      dotenv: '^16.4.0',
      typescript: '^5.5.4',
    },
  };

  await fs.writeFile(path.join(outDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf-8');
  await fs.writeFile(
    path.join(outDir, 'playwright.config.ts'),
    `import { defineConfig, devices } from '@playwright/test';\n\nexport default defineConfig({\n  testDir: './tests',\n  timeout: 60_000,\n  use: {\n    baseURL: '${specBaseUrl.replace(/'/g, "\\'")}',\n    screenshot: 'on',\n    video: 'on',\n    trace: 'on-first-retry',\n    ignoreHTTPSErrors: true\n  },\n  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],\n  reporter: [['html', { open: 'never' }]],\n});\n`,
    'utf-8',
  );

  // Generate a very basic smoke test that visits discovered pages.
  const urls = inv.pages.map((x) => x.url).slice(0, 10);
  const testBody = `import { test, expect } from '@playwright/test';\n\nconst urls = ${JSON.stringify(urls, null, 2)};\n\nfor (const url of urls) {\n  test('smoke: ' + url, async ({ page }) => {\n    await page.goto(url, { waitUntil: 'domcontentloaded' });\n    await expect(page).toHaveURL(url);\n  });\n}\n`;

  await fs.writeFile(path.join(outDir, 'tests', 'smoke.generated.spec.ts'), testBody, 'utf-8');

  // README
  await fs.writeFile(
    path.join(outDir, 'README.md'),
    `# QA-Genie Generated Playwright Suite\n\nThis folder is generated from QA-Genie inventory.\n\n## Run\n\n\`\`\`bash\nnpm install\nnpx playwright install\nnpm test\n\`\`\`\n`,
    'utf-8',
  );
}

export async function generateProject(params: { projectDir: string; target: 'manual' | 'playwright' | 'both' }) {
  const p = projectPaths(params.projectDir);
  const spec = await readSpec(p.specPath);
  const raw = await fs.readFile(p.inventoryPath, 'utf-8');
  const inv = JSON.parse(raw) as Inventory;

  if (params.target === 'manual' || params.target === 'both') {
    await generateManualCsv(params.projectDir, inv);
  }
  if (params.target === 'playwright' || params.target === 'both') {
    await writePlaywrightProject(params.projectDir, spec.baseUrl, inv);
  }

  return { manualCsv: p.manualCsvPath, playwrightDir: p.playwrightDir };
}
