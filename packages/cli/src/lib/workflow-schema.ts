import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { WORKSPACE_MODES, isWorkspaceMode, type WorkspaceMode } from './workspace-mode';

// Bundled workflow definitions ship inside the compiled package at dist/workflows/ (copied
// there at build time by scripts/copy-workflow-assets.js — see package.json's "build" script).
const BUNDLED_DIR = path.join(__dirname, '..', 'workflows');

export interface WorkflowAgentTarget {
  skill: boolean;
  command: string | null;
}

export interface WorkflowSchema {
  id: string;
  skillName: string | null;
  title: string | null;
  description: string;
  cursorDescription: string | null;
  claude: WorkflowAgentTarget;
  cursor: WorkflowAgentTarget;
  poolside: { skill: boolean };
  vibe: { skill: boolean };
  qwen: { skill: boolean };
  kimi: { skill: boolean };
  dsh: { skill: boolean };
  inline: boolean;
  variants: string[] | null;
  /** Workspace modes this workflow installs in (BET-075). Absent → both, except spec-authoring → [product]. */
  modes: WorkspaceMode[];
  /**
   * Position in the standard per-agent install (and the inline instruction block). Absent → the
   * workflow is not part of the standard install set (spec-authoring is framework-gated and
   * installed separately; tutorial is not installed).
   */
  order: number | null;
}

// Workflows whose `modes:` defaults to product-only — PDR-001 §5: a portfolio never holds specs.
const PRODUCT_ONLY_BY_DEFAULT = new Set(['spec-authoring']);

function parseModes(obj: Record<string, unknown>, id: string, filePath: string): WorkspaceMode[] {
  if (!('modes' in obj) || obj.modes === undefined || obj.modes === null) {
    return PRODUCT_ONLY_BY_DEFAULT.has(id) ? ['product'] : [...WORKSPACE_MODES];
  }
  const raw = obj.modes;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(
      `Invalid workflow schema at ${filePath}: "modes" must be a non-empty list of ${WORKSPACE_MODES.join(' | ')}`
    );
  }
  for (const value of raw) {
    if (typeof value !== 'string' || !isWorkspaceMode(value)) {
      throw new Error(
        `Invalid workflow schema at ${filePath}: unknown mode "${String(value)}" in "modes" (expected ${WORKSPACE_MODES.join(' | ')})`
      );
    }
  }
  return Array.from(new Set(raw as WorkspaceMode[]));
}

function parseOrder(obj: Record<string, unknown>, filePath: string): number | null {
  if (!('order' in obj) || obj.order === undefined || obj.order === null) return null;
  if (typeof obj.order !== 'number' || !Number.isInteger(obj.order)) {
    throw new Error(`Invalid workflow schema at ${filePath}: "order" must be an integer`);
  }
  return obj.order;
}

function overridesDir(projectRoot: string): string {
  return path.join(projectRoot, 'oprim', 'workflows');
}

function requireField<T>(obj: Record<string, unknown>, field: string, filePath: string): T {
  if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
    throw new Error(`Invalid workflow schema at ${filePath}: missing required field "${field}"`);
  }
  return obj[field] as T;
}

// `fallback` is the bundled schema when parsing a project override: `order` and `modes` are
// install-set metadata added after forking shipped (BET-075), so an override that omits them
// inherits the bundled values rather than silently dropping out of (or into) an install.
function parseSchema(raw: string, filePath: string, fallback?: WorkflowSchema): WorkflowSchema {
  let doc: unknown;
  try {
    doc = yaml.load(raw);
  } catch (err) {
    throw new Error(`Invalid workflow schema at ${filePath}: ${(err as Error).message}`);
  }
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    throw new Error(`Invalid workflow schema at ${filePath}: expected a YAML mapping`);
  }
  const obj = doc as Record<string, unknown>;

  requireField(obj, 'id', filePath);
  requireField(obj, 'description', filePath);
  const claude = requireField<Record<string, unknown>>(obj, 'claude', filePath);
  const cursor = requireField<Record<string, unknown>>(obj, 'cursor', filePath);
  const poolside = requireField<Record<string, unknown>>(obj, 'poolside', filePath);
  // vibe/qwen/kimi/dsh are optional and mirror poolside by default — see mistral-vibe-agent-support,
  // qwen-code-agent-support, kimi-cli-agent-support, and deepseek-harness-agent-support specs. This
  // keeps existing bundled/forked schemas (none declare a `vibe:`/`qwen:`/`kimi:`/`dsh:` key) working
  // unchanged.
  const vibe = (obj.vibe as Record<string, unknown> | undefined) ?? poolside;
  const qwen = (obj.qwen as Record<string, unknown> | undefined) ?? poolside;
  const kimi = (obj.kimi as Record<string, unknown> | undefined) ?? poolside;
  const dsh = (obj.dsh as Record<string, unknown> | undefined) ?? poolside;
  requireField(obj, 'inline', filePath);

  return {
    id: obj.id as string,
    skillName: (obj.skillName as string | undefined) ?? null,
    title: (obj.title as string | undefined) ?? null,
    description: obj.description as string,
    cursorDescription: (obj.cursorDescription as string | undefined) ?? null,
    claude: { skill: Boolean(claude.skill), command: (claude.command as string | undefined) ?? null },
    cursor: { skill: Boolean(cursor.skill), command: (cursor.command as string | undefined) ?? null },
    poolside: { skill: Boolean(poolside.skill) },
    vibe: { skill: Boolean(vibe.skill) },
    qwen: { skill: Boolean(qwen.skill) },
    kimi: { skill: Boolean(kimi.skill) },
    dsh: { skill: Boolean(dsh.skill) },
    inline: Boolean(obj.inline),
    variants: (obj.variants as string[] | undefined) ?? null,
    modes: fallback && (obj.modes === undefined || obj.modes === null) ? fallback.modes : parseModes(obj, obj.id as string, filePath),
    order: fallback && (obj.order === undefined || obj.order === null) ? fallback.order : parseOrder(obj, filePath),
  };
}

/**
 * Loads a workflow's schema.yaml, resolving a project-level
 * `oprim/workflows/<id>.schema.yaml` override over the CLI-bundled default.
 * Throws an actionable, file-naming error if an override exists but fails to parse
 * or is missing required fields — never silently falls back to the bundled default.
 */
export function loadWorkflowSchema(id: string, projectRoot?: string): WorkflowSchema {
  if (projectRoot) {
    const overridePath = path.join(overridesDir(projectRoot), `${id}.schema.yaml`);
    if (fs.existsSync(overridePath)) {
      const bundledPath = path.join(BUNDLED_DIR, `${id}.schema.yaml`);
      const bundled = fs.existsSync(bundledPath)
        ? parseSchema(fs.readFileSync(bundledPath, 'utf-8'), bundledPath)
        : undefined;
      return parseSchema(fs.readFileSync(overridePath, 'utf-8'), overridePath, bundled);
    }
  }
  const bundledPath = path.join(BUNDLED_DIR, `${id}.schema.yaml`);
  return parseSchema(fs.readFileSync(bundledPath, 'utf-8'), bundledPath);
}

/**
 * Loads a workflow's template.md, resolving a project-level
 * `oprim/workflows/<id>.template.md` override over the CLI-bundled default.
 */
export function loadWorkflowTemplate(id: string, projectRoot?: string): string {
  if (projectRoot) {
    const overridePath = path.join(overridesDir(projectRoot), `${id}.template.md`);
    if (fs.existsSync(overridePath)) {
      return fs.readFileSync(overridePath, 'utf-8');
    }
  }
  const bundledPath = path.join(BUNDLED_DIR, `${id}.template.md`);
  return fs.readFileSync(bundledPath, 'utf-8');
}

/**
 * Loads a bundled, non-overridable variant file (Cursor's condensed command body, the
 * Codex/Gemini/Poolside inline section, promote's per-framework bodies). Only
 * `<id>.schema.yaml` and `<id>.template.md` are project-forkable — see
 * workflow-schema-authoring spec. Returns null if the workflow has no such variant.
 */
export function loadWorkflowVariant(filename: string): string | null {
  const p = path.join(BUNDLED_DIR, filename);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf-8');
}

/** Ids of every CLI-bundled workflow (one per `<id>.schema.yaml` in the bundled directory). */
export function bundledWorkflowIds(): string[] {
  return fs
    .readdirSync(BUNDLED_DIR)
    .filter((f) => f.endsWith('.schema.yaml'))
    .map((f) => f.slice(0, -'.schema.yaml'.length))
    .sort();
}

export type WorkflowInstallTarget =
  | 'claude-skill'
  | 'claude-command'
  | 'cursor-skill'
  | 'cursor-command'
  | 'poolside-skill'
  | 'vibe-skill'
  | 'qwen-skill'
  | 'kimi-skill'
  | 'dsh-skill'
  | 'inline';

function targets(schema: WorkflowSchema, target: WorkflowInstallTarget): boolean {
  switch (target) {
    case 'claude-skill':
      return schema.claude.skill && schema.skillName !== null;
    case 'claude-command':
      return schema.claude.command !== null;
    case 'cursor-skill':
      return schema.cursor.skill && schema.skillName !== null;
    case 'cursor-command':
      return schema.cursor.command !== null;
    case 'poolside-skill':
      return schema.poolside.skill && schema.skillName !== null;
    case 'vibe-skill':
      return schema.vibe.skill && schema.skillName !== null;
    case 'qwen-skill':
      return schema.qwen.skill && schema.skillName !== null;
    case 'kimi-skill':
      return schema.kimi.skill && schema.skillName !== null;
    case 'dsh-skill':
      return schema.dsh.skill && schema.skillName !== null;
    case 'inline':
      return schema.inline;
  }
}

/**
 * BET-075 — the workflow ids an agent install target gets in a workspace mode, sorted by `order`.
 * Replaces the per-agent hard-coded id lists: a workflow is included when it declares an `order`,
 * targets this agent surface, and lists `mode` in its `modes` (project overrides honoured when
 * `projectRoot` is given).
 */
export function workflowIdsFor(target: WorkflowInstallTarget, mode: WorkspaceMode, projectRoot?: string): string[] {
  return bundledWorkflowIds()
    .map((id) => loadWorkflowSchema(id, projectRoot))
    .filter((schema) => schema.order !== null && schema.modes.includes(mode) && targets(schema, target))
    .sort((a, b) => (a.order as number) - (b.order as number))
    .map((schema) => schema.id);
}
