import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export function detectOpenSpec(projectRoot: string): { detected: boolean; changesDir: string | null } {
  const detected = fs.existsSync(path.join(projectRoot, 'openspec'));
  return { detected, changesDir: detected ? 'openspec/changes' : null };
}

export function detectGraphify(projectRoot: string): { detected: boolean; graphDir: string | null } {
  const detected = fs.existsSync(path.join(projectRoot, 'graphify-out'));
  return { detected, graphDir: detected ? 'graphify-out' : null };
}

export function readAgentsFromConfig(projectRoot: string): string[] | null {
  const configPath = path.join(projectRoot, 'oprim', 'config.yaml');
  if (!fs.existsSync(configPath)) return null;
  const content = fs.readFileSync(configPath, 'utf-8');
  const config = yaml.load(content) as Record<string, unknown> | null;
  if (!config || !('agents' in config)) return null;
  const agents = config['agents'];
  if (!Array.isArray(agents)) return null;
  return agents as string[];
}

export function detectAvailableAgents(projectRoot: string): string[] {
  const detected: string[] = [];
  if (fs.existsSync(path.join(projectRoot, '.claude'))) detected.push('claude');
  if (fs.existsSync(path.join(projectRoot, '.cursor'))) detected.push('cursor');
  return detected;
}

export function writeAgentsToConfig(agents: string[], projectRoot: string): void {
  const configPath = path.join(projectRoot, 'oprim', 'config.yaml');
  if (!fs.existsSync(configPath)) return;
  const content = fs.readFileSync(configPath, 'utf-8');
  const config = yaml.load(content) as Record<string, unknown>;
  config['agents'] = agents;
  fs.writeFileSync(configPath, yaml.dump(config, { indent: 2 }), 'utf-8');
}
