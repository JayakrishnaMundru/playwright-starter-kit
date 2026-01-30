#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();
program.name('qa-genie').description('Explore a URL, interview for requirements, and generate tests.').version('0.0.1');

program
  .command('new')
  .requiredOption('--url <url>', 'Base URL')
  .option('--out <dir>', 'Output directory', 'output')
  .action(async (opts) => {
    console.log('TODO: create project', opts);
  });

program
  .command('explore')
  .requiredOption('--project <path>', 'Project folder')
  .action(async (opts) => {
    console.log('TODO: explore', opts);
  });

program
  .command('generate')
  .requiredOption('--project <path>', 'Project folder')
  .option('--target <target>', 'Target output: manual|playwright|both', 'both')
  .action(async (opts) => {
    console.log('TODO: generate', opts);
  });

await program.parseAsync(process.argv);
