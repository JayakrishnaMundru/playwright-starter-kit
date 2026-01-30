import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Page } from 'playwright';
import { projectPaths } from '../project/paths';
import { readSpec } from '../project/spec';

export type Inventory = {
  baseUrl: string;
  crawledAt: string;
  pages: Array<{
    url: string;
    title?: string;
    screenshotPath?: string;
    links: string[];
    forms: Array<{ action?: string; method?: string; fields: Array<{ name?: string; type?: string; label?: string; placeholder?: string }> }>;
  }>;
  notes: string[];
};

function sameOrigin(u: URL, base: URL) {
  return u.origin === base.origin;
}

async function detectForms(page: Page) {
  const forms = await page.evaluate(() => {
    const out: any[] = [];
    document.querySelectorAll('form').forEach((f) => {
      const fields: any[] = [];
      f.querySelectorAll('input,select,textarea').forEach((el: any) => {
        const name = el.getAttribute('name') || undefined;
        const type = el.getAttribute('type') || el.tagName.toLowerCase();
        const placeholder = el.getAttribute('placeholder') || undefined;
        let label: string | undefined;
        const id = el.getAttribute('id');
        if (id) {
          const l = document.querySelector(`label[for="${CSS.escape(id)}"]`);
          if (l) label = (l.textContent || '').trim() || undefined;
        }
        fields.push({ name, type, placeholder, label });
      });
      out.push({ action: f.getAttribute('action') || undefined, method: f.getAttribute('method') || undefined, fields });
    });
    return out;
  });
  return forms as Inventory['pages'][number]['forms'];
}

async function collectLinks(page: Page, base: URL) {
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]'))
      .map((a) => (a as HTMLAnchorElement).href)
      .filter(Boolean),
  );
  const out: string[] = [];
  for (const h of hrefs) {
    try {
      const u = new URL(h);
      if (!sameOrigin(u, base)) continue;
      // keep it fairly stable: ignore logout links and anchors
      if (u.hash) u.hash = '';
      out.push(u.toString());
    } catch {
      // ignore
    }
  }
  return Array.from(new Set(out)).slice(0, 200);
}

async function bestEffortLogin(page: Page, user: string, pass: string, notes: string[]) {
  // This is intentionally heuristic. For enterprise apps you will replace with a project-specific login script.
  // Try to find a password field; then a likely username/email field.
  const password = page.locator('input[type="password"]');
  await password.first().waitFor({ timeout: 15000 });

  const username = page.locator('input[type="email"], input[name*="user" i], input[name*="email" i], input[id*="user" i], input[id*="email" i], input[type="text"]');

  await username.first().fill(user);
  await password.first().fill(pass);

  // Submit by pressing Enter in password field.
  await password.first().press('Enter');

  // Wait for navigation or network idle (some apps are SPA).
  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch {
    notes.push('Login: networkidle timeout (SPA or slow). Continuing.');
  }
}

export async function exploreProject(params: {
  projectDir: string;
  maxPages?: number;
  userEnv?: string;
  passEnv?: string;
}) {
  const projectDir = params.projectDir;
  const p = projectPaths(projectDir);
  const spec = await readSpec(p.specPath);

  const userVar = params.userEnv ?? 'QA_GENIE_USER';
  const passVar = params.passEnv ?? 'QA_GENIE_PASS';

  const user = process.env[userVar];
  const pass = process.env[passVar];

  const notes: string[] = [];

  const baseUrl = new URL(spec.baseUrl);
  const maxPages = params.maxPages ?? 15;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  const inv: Inventory = {
    baseUrl: spec.baseUrl,
    crawledAt: new Date().toISOString(),
    pages: [],
    notes,
  };

  try {
    await page.goto(spec.baseUrl, { waitUntil: 'domcontentloaded' });

    if (spec.auth.mode === 'credentials') {
      if (!user || !pass) {
        notes.push(`Auth mode is credentials, but env vars ${userVar}/${passVar} are not set. Exploring as anonymous.`);
      } else {
        notes.push(`Attempting best-effort login using env vars ${userVar}/${passVar}.`);
        await bestEffortLogin(page, user, pass, notes);
      }
    }

    const queue: string[] = [page.url()];
    const seen = new Set<string>();

    while (queue.length && inv.pages.length < maxPages) {
      const url = queue.shift()!;
      if (seen.has(url)) continue;
      seen.add(url);

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
      } catch (e: any) {
        notes.push(`Failed to navigate: ${url} :: ${e?.message || e}`);
        continue;
      }

      const title = await page.title().catch(() => undefined);
      const links = await collectLinks(page, baseUrl);
      const forms = await detectForms(page);

      const safeName = `page-${inv.pages.length + 1}.png`;
      const screenshotPath = path.join(p.screenshotsDir, safeName);
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {
        notes.push(`Screenshot failed for ${url}`);
      });

      inv.pages.push({
        url,
        title,
        screenshotPath: path.relative(p.projectDir, screenshotPath),
        links,
        forms,
      });

      for (const l of links) {
        if (!seen.has(l) && queue.length < maxPages * 4) queue.push(l);
      }
    }

    await fs.writeFile(p.inventoryPath, JSON.stringify(inv, null, 2), 'utf-8');
    return inv;
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}
