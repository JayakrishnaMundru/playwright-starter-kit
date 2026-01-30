import fs from 'node:fs/promises';
import path from 'node:path';
import { projectPaths } from './paths';
import { writeSpec } from './spec';
import { ProjectSpec } from '../spec/schema';

export async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function newProject(params: { projectDir: string; baseUrl: string; authMode?: 'none' | 'credentials' }) {
  const { projectDir, baseUrl } = params;
  const authMode = params.authMode ?? 'credentials';

  const p = projectPaths(projectDir);
  await ensureDir(projectDir);
  await ensureDir(p.screenshotsDir);
  await ensureDir(p.artifactsDir);

  const spec: ProjectSpec = {
    baseUrl,
    goals: [],
    auth: { mode: authMode },
  };

  await writeSpec(p.specPath, spec);

  // create a basic README for the project
  const readme = `# QA-Genie Project\n\nBase URL: ${baseUrl}\n\nFiles:\n- spec.yaml\n- inventory.json (after explore)\n- manual-tests.csv (after generate)\n- playwright/ (after generate)\n`;
  await fs.writeFile(path.join(projectDir, 'README.md'), readme, 'utf-8');

  return p;
}
