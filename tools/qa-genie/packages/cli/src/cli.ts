#!/usr/bin/env node
import { Command } from 'commander';
import path from 'node:path';
import { exploreProject, generateProject, newProject, resolveProjectDir, slugifyUrl } from '@qa-genie/core';

const program = new Command();
program.name('qa-genie').description('Explore a URL, interview for requirements, and generate tests.').version('0.0.1');

program
  .command('new')
  .requiredOption('--url <url>', 'Base URL (include https://)')
  .option('--out <dir>', 'Output directory', 'output')
  .option('--auth <mode>', 'Auth mode: none|credentials', 'credentials')
  .action(async (opts) => {
    const baseUrl: string = opts.url;
    const slug = slugifyUrl(baseUrl);
    const outDir = path.resolve(process.cwd(), opts.out);
    const projectDir = resolveProjectDir(outDir, slug);

    const p = await newProject({ projectDir, baseUrl, authMode: opts.auth === 'none' ? 'none' : 'credentials' });
    console.log(JSON.stringify({ ok: true, projectDir: p.projectDir, spec: path.relative(process.cwd(), p.specPath) }, null, 2));
  });

program
  .command('explore')
  .requiredOption('--project <path>', 'Project folder (e.g., output/my-app)')
  .option('--max-pages <n>', 'Max pages to crawl', '25')
  .option('--depth <n>', 'Max link depth', '2')
  .option('--ignore <pattern...>', 'Ignore URL patterns (repeatable)', [])
  .option('--storage-state <path>', 'Playwright storageState JSON for authenticated crawling')
  .option('--user-env <name>', 'Env var for username', 'QA_GENIE_USER')
  .option('--pass-env <name>', 'Env var for password', 'QA_GENIE_PASS')
  .action(async (opts) => {
    const projectDir = path.resolve(process.cwd(), opts.project);
    const inv = await exploreProject({
      projectDir,
      maxPages: Number(opts.maxPages),
      maxDepth: Number(opts.depth),
      ignorePatterns: (opts.ignore as string[]) || [],
      storageStatePath: opts.storageState ? path.resolve(process.cwd(), opts.storageState) : undefined,
      userEnv: opts.userEnv,
      passEnv: opts.passEnv,
    });
    console.log(JSON.stringify({ ok: true, pages: inv.pages.length, inventory: path.join(opts.project, 'inventory.json') }, null, 2));
  });

program
  .command('generate')
  .requiredOption('--project <path>', 'Project folder (e.g., output/my-app)')
  .option('--target <target>', 'Target output: manual|playwright|both', 'both')
  .action(async (opts) => {
    const projectDir = path.resolve(process.cwd(), opts.project);
    const target = String(opts.target);
    const t = target === 'manual' || target === 'playwright' ? target : 'both';
    const out = await generateProject({ projectDir, target: t });
    console.log(JSON.stringify({ ok: true, manualCsv: out.manualCsv, playwrightDir: out.playwrightDir }, null, 2));
  });

await program.parseAsync(process.argv);
