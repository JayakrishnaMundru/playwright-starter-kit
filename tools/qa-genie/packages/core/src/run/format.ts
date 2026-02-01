import fs from 'node:fs/promises';
import path from 'node:path';
import prettier from 'prettier';

async function walk(dir: string, out: string[]) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.next' || e.name === 'dist') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
}

function inferParser(filePath: string): prettier.BuiltInParserName | undefined {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
  if (filePath.endsWith('.js') || filePath.endsWith('.cjs') || filePath.endsWith('.mjs')) return 'babel';
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.md')) return 'markdown';
  if (filePath.endsWith('.yml') || filePath.endsWith('.yaml')) return 'yaml';
  return undefined;
}

export async function formatDir(params: { dir: string }) {
  const dir = path.resolve(params.dir);
  const files: string[] = [];
  await walk(dir, files);

  const changed: string[] = [];

  for (const f of files) {
    const parser = inferParser(f);
    if (!parser) continue;

    const input = await fs.readFile(f, 'utf-8').catch(() => null);
    if (input == null) continue;

    const config = (await prettier.resolveConfig(f).catch(() => null)) || {};
    const formatted = await prettier.format(input, { ...config, parser });
    if (formatted !== input) {
      await fs.writeFile(f, formatted, 'utf-8');
      changed.push(f);
    }
  }

  return { dir, changedCount: changed.length, changed };
}
