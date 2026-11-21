// BET-077 / PDR-001 — objectives (`oprim/objectives/OBJ-NNN-<slug>.md`) and bet → objective links.
//
// Like refs.ts this runs in both modes: a product bet may cite its portfolio's objectives. Dangling
// *qualified* references are reported by checkCrossProductRefs (BET-076) only; this module adds the
// dangling-local, missing-link and inactive-objective checks, so no reference is reported twice.
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type { Check } from '../integrity';
import { readWorkspaceMode } from '../workspace-mode';
import { readRemoteContextConfig, isPathSource, resolveIdentityOnly, type RemoteContextSource } from '../remote-context';
import { parseRef, RefResolver, type ParsedRef } from './refs';

export interface ObjectiveSummary {
  id: string;
  title: string;
  status: string;
  period: string;
  path: string;
}

const OBJECTIVE_FILE = /^(OBJ-\d+)(-.*)?\.md$/;

function splitFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { frontmatter: {}, body: content };
  let frontmatter: Record<string, unknown> = {};
  try {
    const parsed = yaml.load(m[1]);
    if (parsed && typeof parsed === 'object') frontmatter = parsed as Record<string, unknown>;
  } catch {
    // Malformed frontmatter — fall back to the body sections.
  }
  return { frontmatter, body: content.slice(m[0].length) };
}

/** First non-blank, non-comment line under `## <heading>`, list marker stripped. */
function readSection(body: string, heading: string): string | undefined {
  const lines = body.split('\n');
  const start = lines.findIndex((l) => new RegExp(`^##\\s+${heading}\\s*$`, 'i').test(l));
  if (start === -1) return undefined;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#')) return undefined;
    if (line !== '' && !line.startsWith('<!--')) return line.replace(/^[-*]\s*/, '');
  }
  return undefined;
}

/** Every objective in `<workspaceRoot>/oprim/objectives/`, sorted by ID. Body sections win over frontmatter. */
export function listObjectives(workspaceRoot: string): ObjectiveSummary[] {
  const dir = path.join(workspaceRoot, 'oprim', 'objectives');
  if (!fs.existsSync(dir)) return [];
  const out: ObjectiveSummary[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const m = entry.isFile() ? entry.name.match(OBJECTIVE_FILE) : null;
    if (!m) continue;
    const file = path.join(dir, entry.name);
    const { frontmatter, body } = splitFrontmatter(fs.readFileSync(file, 'utf-8'));
    const fm = (key: string): string => (frontmatter[key] == null ? '' : String(frontmatter[key]));
    const heading = body.match(/^#\s+OBJ-\d+:\s*(.+)$/m);
    out.push({
      id: m[1],
      title: heading ? heading[1].trim() : fm('title'),
      status: readSection(body, 'Status') ?? fm('status'),
      period: readSection(body, 'Period') ?? fm('period'),
      path: file,
    });
  }
  return out.sort((a, b) => Number(a.id.slice(4)) - Number(b.id.slice(4)));
}

/** `Achieved`, `Dropped` and `Superseded by OBJ-MMM` are inactive; anything else (incl. unknown) is not. */
export function isInactiveObjectiveStatus(status: string | undefined): boolean {
  return !!status && /^(achieved|dropped|superseded)\b/i.test(status.trim());
}

// ─── "Has a portfolio" ─────────────────────────────────────────────────────

/**
 * True in a portfolio workspace, or in a product workspace with at least one registered source
 * whose identity declares `mode: portfolio` (identity-only resolution — cheap).
 */
export function hasPortfolioContext(
  projectRoot: string,
  resolveIdentity: typeof resolveIdentityOnly = resolveIdentityOnly
): boolean {
  if (readWorkspaceMode(projectRoot) === 'portfolio') return true;
  const config = readRemoteContextConfig(projectRoot);
  if (!config.enabled) return false;
  return config.sources.some((source: RemoteContextSource) => {
    const effective =
      isPathSource(source) && !path.isAbsolute(source.path)
        ? { ...source, path: path.resolve(projectRoot, source.path) }
        : source;
    return resolveIdentity(effective).identity?.mode === 'portfolio';
  });
}

// ─── Link collection ───────────────────────────────────────────────────────

interface BetObjectiveLinks {
  bet: string; // BET-NNN
  refs: ParsedRef[];
}

const OBJECTIVES_LINE = /^\s*[-*]\s*Objectives\s*:\s*(.*)$/i;

function parseObjectiveTokens(value: string): ParsedRef[] {
  const out: ParsedRef[] = [];
  for (const token of value.split(',')) {
    const ref = parseRef(token.replace(/[`[\]]/g, '').trim());
    if (ref && ref.kind === 'OBJ') out.push(ref);
  }
  return out;
}

function collectBetObjectiveLinks(projectRoot: string): BetObjectiveLinks[] {
  const pendingDir = path.join(projectRoot, 'oprim', 'bets', 'pending');
  if (!fs.existsSync(pendingDir)) return [];
  const out: BetObjectiveLinks[] = [];
  for (const entry of fs.readdirSync(pendingDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const decision = path.join(pendingDir, entry.name, 'bet-decision.md');
    if (!fs.existsSync(decision)) continue;
    const bet = entry.name.match(/^BET-\d+/)?.[0] ?? entry.name;

    const refs: ParsedRef[] = [];
    let inLinks = false;
    for (const line of fs.readFileSync(decision, 'utf-8').split('\n')) {
      if (/^##\s/.test(line)) {
        inLinks = /^##\s+Links\s*$/.test(line);
        continue;
      }
      const m = inLinks ? line.match(OBJECTIVES_LINE) : null;
      if (m) refs.push(...parseObjectiveTokens(m[1]));
    }
    out.push({ bet, refs });
  }
  return out;
}

/** `products[].objectives` entries from config.yaml that parse as OBJ references. */
function collectProductObjectiveRefs(projectRoot: string): Array<{ product: string; ref: ParsedRef }> {
  const p = path.join(projectRoot, 'oprim', 'config.yaml');
  if (!fs.existsSync(p)) return [];
  let products: unknown;
  try {
    products = (yaml.load(fs.readFileSync(p, 'utf-8')) as Record<string, unknown> | undefined)?.products;
  } catch {
    return [];
  }
  if (!Array.isArray(products)) return [];
  const out: Array<{ product: string; ref: ParsedRef }> = [];
  for (const e of products as Array<Record<string, unknown>>) {
    if (!e || typeof e !== 'object' || !Array.isArray(e.objectives)) continue;
    for (const raw of e.objectives as unknown[]) {
      const ref = parseRef(String(raw));
      if (ref && ref.kind === 'OBJ') out.push({ product: String(e.source ?? '?'), ref });
    }
  }
  return out;
}

// ─── doctor / validate check ───────────────────────────────────────────────

const missingNote = (ref: ParsedRef): string =>
  `Create it with /oprim:objective in this workspace, or qualify the reference (<source>:${ref.id})`;

/**
 * - required: an unqualified `OBJ-NNN` (bet Links or `products[].objectives`) that does not exist
 * - non-required: a pending bet with no objective link — only where a portfolio exists
 * - non-required: a bet whose linked objectives are all Achieved / Dropped / Superseded
 */
export function checkObjectiveLinks(
  projectRoot: string,
  checks: Check[],
  resolver: RefResolver = new RefResolver(projectRoot),
  portfolio: boolean = hasPortfolioContext(projectRoot)
): void {
  for (const { product, ref } of collectProductObjectiveRefs(projectRoot)) {
    if (ref.source !== null || resolver.resolve(ref).status === 'found') continue;
    checks.push({
      name: `objective: products ${product} references ${ref.id}, which does not exist`,
      pass: false,
      note: missingNote(ref),
      required: true,
    });
  }

  let linked = 0;
  for (const { bet, refs } of collectBetObjectiveLinks(projectRoot)) {
    if (refs.length === 0) {
      if (portfolio) {
        checks.push({
          name: `objective: ${bet} is not linked to any objective`,
          pass: false,
          note: 'Add "- Objectives: OBJ-NNN" (or <source>:OBJ-NNN) to its ## Links section',
          required: false,
        });
      }
      continue;
    }

    const inactive: string[] = [];
    let active = 0;
    for (const ref of refs) {
      const r = resolver.resolve(ref);
      if (r.status === 'found') {
        if (isInactiveObjectiveStatus(r.state)) inactive.push(`${ref.raw} (${r.state})`);
        else active++;
      } else if (r.status === 'missing' && ref.source === null) {
        checks.push({
          name: `objective: ${bet} references ${ref.id}, which does not exist`,
          pass: false,
          note: missingNote(ref),
          required: true,
        });
      }
      // Qualified missing / unknown-source / unreachable: reported by checkCrossProductRefs.
    }

    if (inactive.length > 0 && active === 0) {
      checks.push({
        name: `objective: ${bet} serves no active objective`,
        pass: false,
        note: `linked only to ${inactive.join(', ')} — link a current objective or revisit the bet`,
        required: false,
      });
    } else if (active > 0) {
      linked++;
    }
  }

  if (portfolio && linked > 0) {
    checks.push({ name: `objective: ${linked} pending bet(s) linked to an active objective`, pass: true, required: false });
  }
}
