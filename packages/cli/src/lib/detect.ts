import * as fs from 'fs';
import * as path from 'path';

export function detectOpenSpec(projectRoot: string): { detected: boolean; changesDir: string | null } {
  const detected = fs.existsSync(path.join(projectRoot, 'openspec'));
  return { detected, changesDir: detected ? 'openspec/changes' : null };
}

export function detectGraphify(projectRoot: string): { detected: boolean; graphDir: string | null } {
  const detected = fs.existsSync(path.join(projectRoot, 'graphify-out'));
  return { detected, graphDir: detected ? 'graphify-out' : null };
}
