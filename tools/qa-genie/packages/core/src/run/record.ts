import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, type BrowserContext, type Page } from 'playwright';
import { aiNamePage } from './ai';
import { pageSnapshotScript, type PageSnapshot } from './dom-capture';
import { writePageObject } from './pom-generate';

export type RecordOptions = {
  outDir: string; // output root
  baseUrl: string;
  headed?: boolean;
  maxPages?: number;
};

function normalizeUrl(u: string) {
  try {
    const url = new URL(u);
    url.hash = '';
    return url.toString();
  } catch {
    return u;
  }
}

async function captureSnapshot(page: Page): Promise<PageSnapshot> {
  return (await page.evaluate(pageSnapshotScript as any)) as any;
}

export async function recordAndGeneratePOM(opts: RecordOptions) {
  const headed = opts.headed ?? true;
  const maxPages = opts.maxPages ?? 25;

  const root = path.resolve(opts.outDir);
  const frameworkDir = path.join(root, 'playwright');
  const pagesDir = path.join(frameworkDir, 'pages');
  const testsDir = path.join(frameworkDir, 'tests');
  const utilsDir = path.join(frameworkDir, 'utils');
  const fixturesDir = path.join(frameworkDir, 'fixtures');

  await fs.mkdir(pagesDir, { recursive: true });
  await fs.mkdir(testsDir, { recursive: true });
  await fs.mkdir(utilsDir, { recursive: true });
  await fs.mkdir(fixturesDir, { recursive: true });

  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });

  const visited = new Map<string, { name: string; snapshot: PageSnapshot; filePath: string }>();
  const navEdges: Array<{ from: string; to: string; ts: string }> = [];
  const lastUrlByPage = new WeakMap<Page, string>();

  const attachPage = (page: Page) => {
    page.on('framenavigated', async (frame) => {
      if (frame !== page.mainFrame()) return;
      if (visited.size >= maxPages) return;

      const url = normalizeUrl(frame.url());
      if (!url.startsWith('http')) return;

      // give SPAs a beat to render; no hard waits, just a short render loadstate
      try {
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      } catch {
        // ignore
      }

      const prev = lastUrlByPage.get(page);
      const snap = await captureSnapshot(page);
      const key = normalizeUrl(snap.url);
      // record navigation edge regardless of new/duplicate page
      if (prev && prev !== key) navEdges.push({ from: prev, to: key, ts: new Date().toISOString() });
      lastUrlByPage.set(page, key);
      if (visited.has(key)) return;

      const pageName = await aiNamePage({ url: snap.url, title: snap.title, headers: snap.headers });
      console.log(`Detected page: ${pageName}`);
      console.log(`Generated ${snap.elements.length} elements`);

      const filePath = await writePageObject({ outDir: pagesDir, className: pageName, snapshot: snap });
      visited.set(key, { name: pageName, snapshot: snap, filePath });
      console.log(`Wrote: ${filePath}`);
    });

    page.on('popup', (popup) => {
      console.log('Detected new tab/window');
      attachPage(popup);
    });
  };

  context.on('page', (p) => attachPage(p));

  const page = await context.newPage();
  attachPage(page);

  console.log('Launching browser...');
  console.log(`Navigating to: ${opts.baseUrl}`);
  await page.goto(opts.baseUrl, { waitUntil: 'domcontentloaded' });

  console.log('Manual navigation enabled. Navigate through the app now.');
  console.log('When finished, close the browser window to end recording.');

  // Wait until user closes
  await new Promise<void>((resolve) => {
    browser.on('disconnected', () => resolve());
  });

  // Summaries
  const summary = {
    baseUrl: opts.baseUrl,
    generatedAt: new Date().toISOString(),
    pages: Array.from(visited.values()).map((v) => ({ name: v.name, filePath: path.relative(root, v.filePath), url: v.snapshot.url })),
  };

  await fs.writeFile(path.join(frameworkDir, 'qa-genie.summary.json'), JSON.stringify(summary, null, 2), 'utf-8');
  await fs.writeFile(path.join(frameworkDir, 'qa-genie.nav.json'), JSON.stringify(navEdges, null, 2), 'utf-8');

  // Minimal Playwright config + package.json
  const pkg = {
    name: 'qa-genie-pom',
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
      typescript: '^5.5.4',
    },
  };

  await fs.writeFile(path.join(frameworkDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf-8');

  await fs.writeFile(
    path.join(frameworkDir, 'playwright.config.ts'),
    `import { defineConfig, devices } from '@playwright/test';\n\nexport default defineConfig({\n  testDir: './tests',\n  timeout: 60_000,\n  use: {\n    baseURL: '${opts.baseUrl.replace(/'/g, "\\'")}',\n    screenshot: 'on',\n    video: 'on',\n    trace: 'on-first-retry',\n    ignoreHTTPSErrors: true\n  },\n  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],\n  reporter: [['html', { open: 'never' }]],\n});\n`,
    'utf-8',
  );

  await fs.writeFile(
    path.join(frameworkDir, 'README.md'),
    `# QA-Genie Generated Playwright POM\n\nThis framework was generated by observing real browser navigation.\n\n## Install & Run\n\n\`\`\`bash\ncd playwright\nnpm install\nnpx playwright install\n# write tests using pages/* methods\nnpm test\n\`\`\`\n\n## Output\n- pages/: Page Object classes (one page = one class)\n- qa-genie.summary.json: generation summary\n`,
    'utf-8',
  );

  return summary;
}
