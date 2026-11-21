import * as fs from 'fs';
import * as path from 'path';
import type { Check } from './integrity';

// BET-075 / PDR-001 — the single reader of `mode:` in oprim/config.yaml. Commands never read
// the key themselves; they branch on readWorkspaceMode(). An absent key means `product`, and
// nothing ever writes `mode: product` into an existing config.
export type WorkspaceMode = 'product' | 'portfolio';
export const WORKSPACE_MODES: readonly WorkspaceMode[] = ['product', 'portfolio'];

const MODE_LINE = /^mode:[ \t]*(\S*)/m;

function readConfig(projectRoot: string): string | null {
  const configPath = path.join(projectRoot, 'oprim', 'config.yaml');
  return fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf-8') : null;
}

/** The raw `mode:` value (quotes stripped), or null when the key is absent. */
export function readRawWorkspaceMode(content: string): string | null {
  const match = content.match(MODE_LINE);
  if (!match) return null;
  return match[1].replace(/^["']|["']$/g, '');
}

export function isWorkspaceMode(value: string): value is WorkspaceMode {
  return (WORKSPACE_MODES as readonly string[]).includes(value);
}

/**
 * Resolves the workspace mode. Absent config or absent key → `product`. An unknown value also
 * resolves to `product` (the conservative default) — validateWorkspaceMode() is what reports it.
 */
export function readWorkspaceMode(projectRoot: string): WorkspaceMode {
  const content = readConfig(projectRoot);
  if (content === null) return 'product';
  const raw = readRawWorkspaceMode(content);
  return raw !== null && isWorkspaceMode(raw) ? raw : 'product';
}

/** Pushes a required failure when `mode:` is set to anything other than product | portfolio. */
export function validateWorkspaceMode(projectRoot: string, checks: Check[]): void {
  const content = readConfig(projectRoot);
  if (content === null) return;
  const raw = readRawWorkspaceMode(content);
  if (raw === null || isWorkspaceMode(raw)) return;
  checks.push({
    name: `config: unknown mode "${raw}" (expected ${WORKSPACE_MODES.join(' | ')})`,
    pass: false,
    note: 'Fix the mode: key in oprim/config.yaml, or remove it for a product workspace',
    required: true,
  });
}
