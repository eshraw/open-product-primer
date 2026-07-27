import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

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
  inline: boolean;
  variants: string[] | null;
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

function parseSchema(raw: string, filePath: string): WorkflowSchema {
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
    inline: Boolean(obj.inline),
    variants: (obj.variants as string[] | undefined) ?? null,
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
      return parseSchema(fs.readFileSync(overridePath, 'utf-8'), overridePath);
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
