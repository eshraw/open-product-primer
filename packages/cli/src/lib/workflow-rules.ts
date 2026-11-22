// BET-080 — reads `rules.<workflow>` from oprim/config.yaml. A rule is either a string (custom
// guidance, the original shape) or a map `{ text, ask_first }`. Only `ask_first` is interpreted by
// the CLI; `text` is read by the agent from config.yaml at run time, like a string rule.
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { readWorkspaceMode, type WorkspaceMode } from './workspace-mode';

export interface RenderContext {
  mode: WorkspaceMode;
  /** Explicit `rules.<id>.ask_first` values; absent ids fall back to the mode default. */
  askFirst: Record<string, boolean>;
}

export const PRODUCT_RENDER_CONTEXT: RenderContext = { mode: 'product', askFirst: {} };

/** `ask_first` booleans from `rules:` — string rules and non-boolean values are ignored. */
export function readAskFirstRules(projectRoot: string): Record<string, boolean> {
  const configPath = path.join(projectRoot, 'oprim', 'config.yaml');
  if (!fs.existsSync(configPath)) return {};
  let parsed: unknown;
  try {
    parsed = yaml.load(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return {};
  }
  const rules = (parsed as Record<string, unknown> | null)?.rules;
  if (!rules || typeof rules !== 'object' || Array.isArray(rules)) return {};
  const out: Record<string, boolean> = {};
  for (const [id, rule] of Object.entries(rules as Record<string, unknown>)) {
    if (rule && typeof rule === 'object' && typeof (rule as Record<string, unknown>).ask_first === 'boolean') {
      out[id] = (rule as Record<string, unknown>).ask_first as boolean;
    }
  }
  return out;
}

export function renderContextFor(projectRoot?: string): RenderContext {
  if (!projectRoot) return PRODUCT_RENDER_CONTEXT;
  return { mode: readWorkspaceMode(projectRoot), askFirst: readAskFirstRules(projectRoot) };
}

/** Ask-first is on by default in portfolio mode and off in product mode; `rules.<id>.ask_first` overrides. */
export function askFirstEnabled(id: string, ctx: RenderContext): boolean {
  return ctx.askFirst[id] ?? ctx.mode === 'portfolio';
}

const START = '<!-- oprim:portfolio:start -->';
const END = '<!-- oprim:portfolio:end -->';
const BLOCK = /\n*<!-- oprim:portfolio:start -->[\s\S]*?<!-- oprim:portfolio:end -->/g;

/**
 * Resolves `<!-- oprim:portfolio:start/end -->` blocks. Disabled: the block and the newlines
 * before it are removed, so a block written as its own paragraph/list item/sentence leaves the
 * surrounding text exactly as it was without it (product output is byte-identical by
 * construction). Enabled: only the delimiters (and the newline right inside each) are removed.
 */
export function applyAskFirstBlocks(content: string, enabled: boolean): string {
  if (!content.includes(START)) return content;
  if (!enabled) return content.replace(BLOCK, '');
  return content.split(START + '\n').join('').split(START).join('').split('\n' + END).join('').split(END).join('');
}
