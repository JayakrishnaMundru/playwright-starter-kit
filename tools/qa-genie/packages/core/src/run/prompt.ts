import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import type { TestPlan } from './plan';

function mdEscape(s: string) {
  return s.replace(/\r\n/g, '\n');
}

export async function generateAmazonQPrompts(params: {
  planPath: string;
  pagesDir: string;
  outDir: string;
}) {
  const planRaw = await fs.readFile(params.planPath, 'utf-8');
  const plan = YAML.parse(planRaw) as TestPlan;

  const files = await fs.readdir(params.pagesDir).catch(() => []);
  const pageFiles = files.filter((f) => f.endsWith('.ts'));

  await fs.mkdir(params.outDir, { recursive: true });

  const overview = `# Amazon Q Prompt Pack (QA-Genie)\n\nBase URL: ${plan.baseUrl}\nGenerated: ${plan.generatedAt}\n\n## Inputs\n- Page Objects: ${params.pagesDir}\n- Journey Plan: ${params.planPath}\n\n## Goals\n- Generate Playwright tests that call ONLY Page Object methods (no raw locators in tests).\n- Keep code production-quality (no hard waits, stable assertions).\n\n## Page Objects Found\n${pageFiles.map((f) => `- ${f}`).join('\n')}\n\n## Flows\n${(plan.flows || []).map((f, i) => `- ${i + 1}. ${f.name} (risk: ${f.risk})`).join('\n')}\n`;

  const rules = `# Rules (Must Follow)\n\n- Use TypeScript + @playwright/test.\n- Tests MUST call only Page Object methods from pages/*.ts.\n- Do not use page.locator/getBy* directly in tests.\n- No hard waits (no setTimeout/sleep).\n- Prefer expect-based assertions that validate intent.\n- Add comments that explain intent (not obvious code).\n- Keep selectors inside Page Objects only.\n- Keep test data parameterized (avoid hardcoding user-specific data).\n`;

  const genTests = `# Prompt: Generate Tests from Plan\n\nYou are Amazon Q. Generate Playwright test specs under ./tests/generated/ using the existing Page Object classes under ./pages.\n\nInputs:\n- Plan YAML below\n- Page Objects list below\n\nRequirements:\n- One spec per flow.\n- Each spec should have 2-4 tests: happy path + 1-2 edge cases from suggestedEdgeCases.\n- Use a small fixture/helper to instantiate pages as needed.\n- Only call Page Object methods.\n- Add meaningful assertions (URL, heading, confirmation message, etc.).\n\nPlan YAML:\n\n\`\`\`yaml\n${mdEscape(planRaw)}\n\`\`\`\n\nPage Objects:\n\n\`\`\`text\n${pageFiles.join('\n')}\n\`\`\`\n`;

  const refactor = `# Prompt: Refine Page Objects\n\nYou are Amazon Q. Review the Page Objects in ./pages and improve code quality:\n- Remove duplicate/low-value locators\n- Group methods (Inputs / Actions / Tables / Assertions)\n- Prefer getByTestId > getByRole > getByLabel > id/name > text > CSS fallback\n- Ensure methods are parameterized and reusable\n- Add a small number of composite methods (e.g., login(username,password), fillForm(data), submit()) where clearly applicable\n\nDo not change public method names unless you also update tests accordingly.\n`;

  const assertions = `# Prompt: Add Intent Assertions\n\nYou are Amazon Q. Enhance generated tests with intent-based assertions:\n- Validate navigation to expected page (URL pattern + heading visible)\n- Validate key UI state changes (success toast, table row appears, status updated)\n- Avoid brittle text assertions unless stable\n- No hard waits\n\nKeep tests fast and CI-friendly.\n`;

  await fs.writeFile(path.join(params.outDir, '01_overview.md'), overview, 'utf-8');
  await fs.writeFile(path.join(params.outDir, '02_rules.md'), rules, 'utf-8');
  await fs.writeFile(path.join(params.outDir, '03_generate_tests.md'), genTests, 'utf-8');
  await fs.writeFile(path.join(params.outDir, '04_refactor_pages.md'), refactor, 'utf-8');
  await fs.writeFile(path.join(params.outDir, '05_add_assertions.md'), assertions, 'utf-8');

  return {
    outDir: params.outDir,
    files: ['01_overview.md', '02_rules.md', '03_generate_tests.md', '04_refactor_pages.md', '05_add_assertions.md'].map((f) =>
      path.join(params.outDir, f),
    ),
  };
}
