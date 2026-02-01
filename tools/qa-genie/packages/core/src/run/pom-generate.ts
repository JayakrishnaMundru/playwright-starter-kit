import fs from 'node:fs/promises';
import path from 'node:path';
import type { CapturedElement, PageSnapshot } from './dom-capture';

function pascal(s: string) {
  return s
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function camel(s: string) {
  const p = pascal(s);
  return p ? p.charAt(0).toLowerCase() + p.slice(1) : 'value';
}

function selectorFor(e: CapturedElement): { locator: string; comment: string } {
  if (e.testId) return { locator: `page.getByTestId('${e.testId}')`, comment: 'data-testid' };
  if (e.role && (e.text || e.ariaLabel)) {
    const name = (e.ariaLabel || e.text || '').replace(/'/g, "\\'");
    return { locator: `page.getByRole('${e.role}', { name: '${name}' })`, comment: 'role+name' };
  }
  if (e.ariaLabel) {
    const l = e.ariaLabel.replace(/'/g, "\\'");
    return { locator: `page.getByLabel('${l}')`, comment: 'aria-label/label' };
  }
  if (e.id) return { locator: `page.locator('#${e.id.replace(/'/g, "\\'")}')`, comment: 'id' };
  if (e.name) return { locator: `page.locator('[name="${e.name.replace(/"/g, '\\"')}"]')`, comment: 'name' };
  if (e.text && (e.kind === 'button' || e.kind === 'link')) {
    const t = e.text.replace(/'/g, "\\'");
    const role = e.kind === 'button' ? 'button' : 'link';
    return { locator: `page.getByRole('${role}', { name: '${t}' })`, comment: 'text/role' };
  }
  // last resort
  return { locator: `page.locator('${e.tag}')`, comment: 'css-fallback' };
}

function methodSpecs(e: CapturedElement, locatorProp: string) {
  const baseName = pascal(e.ariaLabel || e.name || e.placeholder || e.text || e.id || e.kind);

  switch (e.kind) {
    case 'input': {
      const m = `fill${baseName}`;
      return [
        {
          name: m,
          args: 'value: string',
          body: `await this.${locatorProp}.fill(value);`,
          comment: 'Fill input value',
        },
      ];
    }
    case 'textarea': {
      const m = `fill${baseName}`;
      return [
        {
          name: m,
          args: 'value: string',
          body: `await this.${locatorProp}.fill(value);`,
          comment: 'Fill textarea value',
        },
      ];
    }
    case 'select': {
      const m = `select${baseName}`;
      return [
        {
          name: m,
          args: 'option: string',
          body: `await this.${locatorProp}.selectOption({ label: option }).catch(async () => this.${locatorProp}.selectOption(option));`,
          comment: 'Select dropdown option (label first, then value)',
        },
      ];
    }
    case 'checkbox': {
      const m = `set${baseName}`;
      return [
        {
          name: m,
          args: 'checked: boolean = true',
          body: `if (checked) await this.${locatorProp}.check(); else await this.${locatorProp}.uncheck();`,
          comment: 'Set checkbox state',
        },
      ];
    }
    case 'radio': {
      const m = `choose${baseName}`;
      return [
        {
          name: m,
          args: '',
          body: `await this.${locatorProp}.check();`,
          comment: 'Choose radio option',
        },
      ];
    }
    case 'button': {
      const m = `click${baseName}`;
      return [
        {
          name: m,
          args: '',
          body: `await this.${locatorProp}.click();`,
          comment: 'Click button',
        },
      ];
    }
    case 'link': {
      const m = `open${baseName}`;
      return [
        {
          name: m,
          args: '',
          body: `await this.${locatorProp}.click();`,
          comment: 'Open link',
        },
      ];
    }
    case 'table': {
      const tableName = baseName || 'Table';
      return [
        {
          name: `get${tableName}Headers`,
          args: '',
          body: `return this.${locatorProp}.locator('th').allTextContents();`,
          comment: 'Read table headers',
        },
        {
          name: `get${tableName}RowByColumnValue`,
          args: 'columnHeader: string, value: string',
          body: `// Best-effort: find column index by header text then match row cell text\nconst headers = await this.${locatorProp}.locator('th').allTextContents();\nconst idx = headers.findIndex(h => h.trim() === columnHeader);\nif (idx < 0) throw new Error('Header not found: ' + columnHeader);\nconst rows = this.${locatorProp}.locator('tbody tr');\nconst count = await rows.count();\nfor (let i=0;i<count;i++){\n  const row = rows.nth(i);\n  const cell = row.locator('td').nth(idx);\n  if ((await cell.innerText()).trim() === value) return row;\n}\nthrow new Error('Row not found for ' + columnHeader + '=' + value);`,
          comment: 'Find table row by column value',
        },
      ];
    }
    default:
      return [];
  }
}

export async function writePageObject(params: {
  outDir: string;
  className: string;
  snapshot: PageSnapshot;
}) {
  const filePath = path.join(params.outDir, `${params.className}.ts`);
  const lines: string[] = [];

  lines.push(`/**`);
  lines.push(` * Auto-generated by QA-Genie.`);
  lines.push(` * PageName: ${params.className}`);
  lines.push(` * URL: ${params.snapshot.url}`);
  lines.push(` */`);
  lines.push(`import { expect, type Locator, type Page } from '@playwright/test';`);
  lines.push('');
  lines.push(`export class ${params.className} {`);
  lines.push(`  constructor(private readonly page: Page) {}`);
  lines.push('');

  // Locators
  const locatorProps: Array<{ prop: string; locatorExpr: string; why: string; e: CapturedElement }> = [];
  const used = new Set<string>();

  for (const e of params.snapshot.elements) {
    const hint = e.ariaLabel || e.name || e.placeholder || e.text || e.id || e.kind;
    const propBase = camel(hint || e.kind);
    let prop = propBase || 'el';
    let n = 1;
    while (used.has(prop)) {
      n++;
      prop = `${propBase}${n}`;
    }
    used.add(prop);

    const sel = selectorFor(e);
    locatorProps.push({ prop, locatorExpr: sel.locator, why: sel.comment, e });
  }

  lines.push('  // Locators');
  for (const l of locatorProps) {
    lines.push(`  private get ${l.prop}(): Locator {`);
    lines.push(`    // selector: ${l.why}`);
    lines.push(`    return ${l.locatorExpr};`);
    lines.push('  }');
    lines.push('');
  }

  // Minimal page assertion
  lines.push('  async assertLoaded() {');
  lines.push(`    await expect(this.page).toHaveURL(/${params.snapshot.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/);`);
  if (params.snapshot.headers[0]) {
    const h = params.snapshot.headers[0].replace(/'/g, "\\'");
    lines.push(`    // Intent check: a dominant header should be visible`);
    lines.push(`    await expect(this.page.getByRole('heading', { name: '${h}' })).toBeVisible();`);
  }
  lines.push('  }');
  lines.push('');

  // Methods
  const seenMethods = new Set<string>();
  lines.push('  // Behavior methods');
  for (const l of locatorProps) {
    for (const m of methodSpecs(l.e, l.prop)) {
      if (seenMethods.has(m.name)) continue;
      seenMethods.add(m.name);
      lines.push(`  /** ${m.comment} */`);
      lines.push(`  async ${m.name}(${m.args}) {`);
      lines.push(`    ${m.body}`);
      lines.push('  }');
      lines.push('');
    }
  }

  // Composite helpers (simple): login if username/password + a button exist
  const hasUser = locatorProps.find((x) => /user|email/i.test(x.prop));
  const hasPass = locatorProps.find((x) => /pass/i.test(x.prop));
  const hasSubmit = locatorProps.find((x) => /login|sign|submit|continue/i.test(x.prop) && x.e.kind === 'button');
  if (hasUser && hasPass && hasSubmit) {
    const loginMethod = 'login';
    if (!seenMethods.has(loginMethod)) {
      lines.push(`  /** Composite: fill credentials and submit */`);
      lines.push(`  async ${loginMethod}(username: string, password: string) {`);
      lines.push(`    await this.${hasUser.prop}.fill(username);`);
      lines.push(`    await this.${hasPass.prop}.fill(password);`);
      lines.push(`    await this.${hasSubmit.prop}.click();`);
      lines.push('  }');
      lines.push('');
    }
  }

  lines.push('}');
  lines.push('');

  await fs.mkdir(params.outDir, { recursive: true });
  await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
  return filePath;
}
