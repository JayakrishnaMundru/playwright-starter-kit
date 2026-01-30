import fs from 'node:fs/promises';
import { ProjectSpec, ProjectSpecSchema } from '../spec/schema';
import YAML from 'yaml';

export async function writeSpec(path: string, spec: ProjectSpec) {
  const validated = ProjectSpecSchema.parse(spec);
  await fs.writeFile(path, YAML.stringify(validated), 'utf-8');
}

export async function readSpec(path: string): Promise<ProjectSpec> {
  const raw = await fs.readFile(path, 'utf-8');
  const parsed = YAML.parse(raw);
  return ProjectSpecSchema.parse(parsed);
}
