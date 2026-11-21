// BET-076 / PDR-001 — cross-workspace references of the form `<source>:<KIND>-<NNN>`.
//
// The qualifier is a `remote_context.sources[].name`; an unqualified ID always means the current
// workspace. Despite living under `portfolio/`, this module runs in product mode too — products
// cite portfolio PDRs. Resolution reads the referenced artifact's state at resolution time and
// never writes it anywhere (reference, never copy).
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type { Check } from '../integrity';
import {
  readRemoteContextConfig,
  findSourceByName,
  isPathSource,
  resolveFull,
  type RemoteContextSource,
  type ResolvedContent,
} from '../remote-context';

export type RefKind = 'BET' | 'PDR' | 'OBJ' | 'NOTE';

export interface ParsedRef {
  source: string | null;
  kind: RefKind;
  id: string;
  raw: string;
}

export type RefStatus = 'found' | 'missing' | 'unknown-source' | 'unreachable';

export interface RefResolution {
  ref: ParsedRef;
  status: RefStatus;
  state?: string;
  stale?: boolean;
  path?: string;
  error?: string;
}

const QUALIFIED_REF = /^([a-z0-9][a-z0-9-]*):((BET|PDR|OBJ|NOTE)-\d+)$/;
const LOCAL_REF = /^((BET|PDR|OBJ|NOTE)-\d+)$/;

export function parseRef(raw: string): ParsedRef | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  const qualified = value.match(QUALIFIED_REF);
  if (qualified) {
    return { source: qualified[1], kind: qualified[3] as RefKind, id: qualified[2], raw: value };
  }
  const local = value.match(LOCAL_REF);
  if (local) {
    return { source: null, kind: local[2] as RefKind, id: local[1], raw: value };
  }
  return null;
}

/** True for a string that parses as `<source>:<ID>` — the integrity check skips these. */
export function isQualifiedRef(raw: unknown): boolean {
  return typeof raw === 'string' && parseRef(raw)?.source != null;
}

// ─── Artifact lookup inside a resolved workspace ────────────────────────────

// `BET-012` matches `BET-012` and `BET-012-<slug>`, never `BET-0123`.
function matchesId(name: string, id: string): boolean {
  return name === id || name.startsWith(`${id}-`) || name === `${id}.md`;
}

function findEntry(dir: string, id: string, predicate: (e: fs.Dirent) => boolean): string | null {
  if (!fs.existsSync(dir)) return null;
  const hit = fs.readdirSync(dir, { withFileTypes: true }).find((e) => predicate(e) && matchesId(e.name, id));
  return hit ? path.join(dir, hit.name) : null;
}

function readStatusSection(file: string): string | undefined {
  const lines = fs.readFileSync(file, 'utf-8').split('\n');
  const start = lines.findIndex((l) => /^##\s+Status\s*$/.test(l));
  if (start === -1) return undefined;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#')) return undefined;
    if (line !== '' && !line.startsWith('<!--')) return line.replace(/^[-*]\s*/, '');
  }
  return undefined;
}

const MD_DIRS: Record<Exclude<RefKind, 'BET'>, string> = {
  PDR: 'decisions',
  OBJ: 'objectives',
  NOTE: 'notes',
};

export function lookupArtifact(
  workspaceRoot: string,
  ref: ParsedRef
): { path: string; state?: string } | null {
  const oprimDir = path.join(workspaceRoot, 'oprim');
  if (ref.kind === 'BET') {
    for (const state of ['pending', 'archived'] as const) {
      const hit = findEntry(path.join(oprimDir, 'bets', state), ref.id, (e) => e.isDirectory());
      if (hit) return { path: hit, state };
    }
    return null;
  }
  const hit = findEntry(path.join(oprimDir, MD_DIRS[ref.kind]), ref.id, (e) => e.isFile() && e.name.endsWith('.md'));
  if (!hit) return null;
  return { path: hit, state: ref.kind === 'NOTE' ? undefined : readStatusSection(hit) };
}

// ─── Resolver ───────────────────────────────────────────────────────────────

type ResolveFn = (source: RemoteContextSource) => ResolvedContent;

/**
 * Resolves qualified references, memoising `resolveFull()` per source name so each source is
 * cloned/fetched at most once per command invocation no matter how many references point at it.
 */
export class RefResolver {
  private readonly cache = new Map<string, ResolvedContent>();

  constructor(
    private readonly projectRoot: string,
    private readonly fetchSource: ResolveFn = resolveFull
  ) {}

  private resolveSource(source: RemoteContextSource): ResolvedContent {
    const cached = this.cache.get(source.name);
    if (cached) return cached;
    // Relative `path:` sources are relative to the project, not to wherever the CLI was run from.
    const effective =
      isPathSource(source) && !path.isAbsolute(source.path)
        ? { ...source, path: path.resolve(this.projectRoot, source.path) }
        : source;
    const result = this.fetchSource(effective);
    this.cache.set(source.name, result);
    return result;
  }

  resolve(ref: ParsedRef): RefResolution {
    if (ref.source === null) {
      const hit = lookupArtifact(this.projectRoot, ref);
      return hit ? { ref, status: 'found', state: hit.state, path: hit.path } : { ref, status: 'missing' };
    }

    const source = findSourceByName(readRemoteContextConfig(this.projectRoot), ref.source);
    if (!source) return { ref, status: 'unknown-source' };

    const content = this.resolveSource(source);
    if (content.error) return { ref, status: 'unreachable', error: content.error };

    const hit = lookupArtifact(content.workspaceRoot, ref);
    if (!hit) return { ref, status: 'missing', stale: content.stale };
    return { ref, status: 'found', state: hit.state, stale: content.stale, path: hit.path };
  }

  /** Number of distinct sources resolved so far — exposed for the one-fetch-per-source test. */
  get resolvedSourceCount(): number {
    return this.cache.size;
  }
}

// ─── Reference collection ───────────────────────────────────────────────────

export interface CollectedRef {
  ref: ParsedRef;
  origin: string;
}

const SEQUENCE_LANES = ['now', 'next', 'later', 'backlog'] as const;
const SEQUENCE_FIELDS = ['blocked_by', 'unlocks', 'requires_pdrs'] as const;
const LINK_LABELS = ['PDRs', 'Objectives', 'Delegated to', 'Delegated from', 'Cross-product'];
const LINK_LINE = new RegExp(`^\\s*[-*]\\s*(${LINK_LABELS.join('|')})\\s*:\\s*(.*)$`, 'i');

function collectFromSequence(projectRoot: string, out: CollectedRef[]): void {
  const p = path.join(projectRoot, 'oprim', 'sequence.yaml');
  if (!fs.existsSync(p)) return;
  let seq: Record<string, unknown>;
  try {
    seq = (yaml.load(fs.readFileSync(p, 'utf-8')) as Record<string, unknown>) ?? {};
  } catch {
    return; // checkSequenceIntegrity reports the parse error
  }
  for (const lane of SEQUENCE_LANES) {
    const entries = seq[lane];
    if (!Array.isArray(entries)) continue;
    for (const entry of entries as Array<Record<string, unknown>>) {
      for (const field of SEQUENCE_FIELDS) {
        const values = entry?.[field];
        if (!Array.isArray(values)) continue;
        for (const v of values) {
          const ref = typeof v === 'string' ? parseRef(v) : null;
          if (ref) out.push({ ref, origin: `sequence.yaml ${entry.id ?? '?'} ${field}` });
        }
      }
    }
  }
}

function collectFromBetLinks(projectRoot: string, out: CollectedRef[]): void {
  const pendingDir = path.join(projectRoot, 'oprim', 'bets', 'pending');
  if (!fs.existsSync(pendingDir)) return;
  for (const entry of fs.readdirSync(pendingDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const decision = path.join(pendingDir, entry.name, 'bet-decision.md');
    if (!fs.existsSync(decision)) continue;

    let inLinks = false;
    for (const line of fs.readFileSync(decision, 'utf-8').split('\n')) {
      if (/^##\s/.test(line)) {
        inLinks = /^##\s+Links\s*$/.test(line);
        continue;
      }
      if (!inLinks) continue;
      const m = line.match(LINK_LINE);
      if (!m) continue;
      // Non-matching tokens (prose such as "None", placeholders) are ignored.
      for (const token of m[2].split(',')) {
        const ref = parseRef(token.replace(/[`[\]]/g, '').trim());
        if (ref) out.push({ ref, origin: `${entry.name} Links (${m[1]})` });
      }
    }
  }
}

// BET-077 — `products[].objectives` in config.yaml accept the same reference grammar.
function collectFromProducts(projectRoot: string, out: CollectedRef[]): void {
  const p = path.join(projectRoot, 'oprim', 'config.yaml');
  if (!fs.existsSync(p)) return;
  let products: unknown;
  try {
    products = (yaml.load(fs.readFileSync(p, 'utf-8')) as Record<string, unknown> | undefined)?.products;
  } catch {
    return;
  }
  if (!Array.isArray(products)) return;
  for (const e of products as Array<Record<string, unknown>>) {
    if (!e || typeof e !== 'object' || !Array.isArray(e.objectives)) continue;
    for (const v of e.objectives as unknown[]) {
      const ref = parseRef(String(v));
      if (ref) out.push({ ref, origin: `config.yaml products ${String(e.source ?? '?')} objectives` });
    }
  }
}

/** Every parseable reference (qualified and local) in sequence.yaml, pending bets' `## Links` and `products:`. */
export function collectRefs(projectRoot: string): CollectedRef[] {
  const out: CollectedRef[] = [];
  collectFromSequence(projectRoot, out);
  collectFromBetLinks(projectRoot, out);
  collectFromProducts(projectRoot, out);
  return out;
}

// ─── doctor / validate check ────────────────────────────────────────────────

/**
 * Severity mapping (design.md §4): unknown qualifier → required; reachable source missing the
 * artifact → required; unreachable with no cache → non-required; served from a stale cache →
 * pass, annotated `(stale)`. Unqualified references are left to the local checks.
 */
export function checkCrossProductRefs(
  projectRoot: string,
  checks: Check[],
  resolver: RefResolver = new RefResolver(projectRoot)
): void {
  const seen = new Set<string>();
  for (const { ref, origin } of collectRefs(projectRoot)) {
    if (ref.source === null || seen.has(ref.raw)) continue;
    seen.add(ref.raw);

    const r = resolver.resolve(ref);
    switch (r.status) {
      case 'unknown-source':
        checks.push({
          name: `ref: unknown source "${ref.source}"`,
          pass: false,
          note: `${ref.raw} in ${origin} — register it with 'oprim context register' or fix the qualifier`,
          required: true,
        });
        break;
      case 'unreachable':
        checks.push({
          name: `ref: ${ref.raw} could not be checked — source ${ref.source} unreachable`,
          pass: false,
          note: r.error,
          required: false,
        });
        break;
      case 'missing':
        checks.push({
          name: `ref: ${ref.raw} not found in ${ref.source}${r.stale ? ' (stale)' : ''}`,
          pass: false,
          note: `referenced from ${origin}`,
          required: true,
        });
        break;
      case 'found':
        checks.push({
          name: `ref: ${ref.raw}${r.state ? ` (${r.state})` : ''}${r.stale ? ' (stale)' : ''}`,
          pass: true,
          required: true,
        });
        break;
    }
  }
}
