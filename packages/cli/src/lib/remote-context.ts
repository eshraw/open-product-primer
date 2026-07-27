import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';
import { execFileSync } from 'child_process';
import * as yaml from 'js-yaml';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GitSource {
  name: string;
  git: string;
  description?: string;
}

export interface PathSource {
  name: string;
  path: string;
  description?: string;
}

export type RemoteContextSource = GitSource | PathSource;

export interface RemoteContextConfig {
  enabled: boolean;
  sources: RemoteContextSource[];
}

export interface RemoteContextIdentity {
  name: string;
  version: string;
  description?: string;
}

export function isGitSource(source: RemoteContextSource): source is GitSource {
  return 'git' in source && typeof source.git === 'string';
}

export function isPathSource(source: RemoteContextSource): source is PathSource {
  return 'path' in source && typeof source.path === 'string';
}

// ─── oprim/config.yaml — remote_context block ──────────────────────────────

const REMOTE_CONTEXT_KEY = 'remote_context';

function configPath(projectRoot: string): string {
  return path.join(projectRoot, 'oprim', 'config.yaml');
}

export function readRemoteContextConfig(projectRoot: string): RemoteContextConfig {
  const p = configPath(projectRoot);
  if (!fs.existsSync(p)) return { enabled: false, sources: [] };

  const parsed = yaml.load(fs.readFileSync(p, 'utf-8')) as Record<string, unknown> | undefined;
  const raw = parsed?.[REMOTE_CONTEXT_KEY] as Partial<RemoteContextConfig> | undefined;
  if (!raw) return { enabled: false, sources: [] };

  return {
    enabled: raw.enabled ?? false,
    sources: Array.isArray(raw.sources) ? raw.sources : [],
  };
}

// Surgical replace of just the `remote_context:` top-level block, leaving every other
// line in oprim/config.yaml byte-for-byte untouched — mirrors the non-destructive approach
// in config-merge.ts (never parse+re-dump the whole file).
function replaceTopLevelBlock(content: string, key: string, blockContent: string): string {
  const lines = content.split('\n');
  const startIdx = lines.findIndex((l) => new RegExp(`^${key}:`).test(l));

  const blockLines = blockContent.replace(/\n$/, '').split('\n');

  if (startIdx === -1) {
    const separator = content.endsWith('\n') || content === '' ? '' : '\n';
    return content + separator + blockLines.join('\n') + '\n';
  }

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^[A-Za-z_]/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }

  return [...lines.slice(0, startIdx), ...blockLines, ...lines.slice(endIdx)].join('\n');
}

export function writeRemoteContextConfig(projectRoot: string, config: RemoteContextConfig): void {
  const p = configPath(projectRoot);
  const existing = fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '';
  const dumped = yaml.dump({ [REMOTE_CONTEXT_KEY]: config }, { lineWidth: -1 });
  const updated = replaceTopLevelBlock(existing, REMOTE_CONTEXT_KEY, dumped);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, updated, 'utf-8');
}

export function findSourceByName(
  config: RemoteContextConfig,
  name: string
): RemoteContextSource | undefined {
  return config.sources.find((s) => s.name === name);
}

// ─── Remote context identity (.oprim-context/context.yaml) ─────────────────

export function identityFilePath(rootDir: string): string {
  return path.join(rootDir, '.oprim-context', 'context.yaml');
}

export function readIdentity(rootDir: string): RemoteContextIdentity | null {
  const p = identityFilePath(rootDir);
  if (!fs.existsSync(p)) return null;
  try {
    const parsed = yaml.load(fs.readFileSync(p, 'utf-8')) as Partial<RemoteContextIdentity>;
    if (!parsed?.name || !parsed?.version) return null;
    return { name: parsed.name, version: parsed.version, description: parsed.description };
  } catch {
    return null;
  }
}

export function writeIdentity(rootDir: string, identity: RemoteContextIdentity): void {
  const p = identityFilePath(rootDir);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, yaml.dump(identity, { lineWidth: -1 }), 'utf-8');
}

// ─── Cache directory layout (git sources only) ─────────────────────────────

// 5 minutes — see design.md open question. Overridable for tests that need to exercise
// post-throttle-window behavior without actually waiting.
function throttleMs(): number {
  const override = process.env['OPRIM_REMOTE_CONTEXT_THROTTLE_MS'];
  return override ? Number(override) : 5 * 60 * 1000;
}

// Overridable so tests never write into the real user's home directory.
function cacheRoot(): string {
  return process.env['OPRIM_REMOTE_CONTEXT_CACHE_DIR'] ?? path.join(os.homedir(), '.oprim', 'remote-context-cache');
}

function sourceCacheKey(source: GitSource): string {
  const hash = crypto.createHash('sha1').update(source.git).digest('hex').slice(0, 12);
  return `${source.name}-${hash}`;
}

function fullCacheDir(source: GitSource): string {
  return path.join(cacheRoot(), sourceCacheKey(source), 'full');
}

function identityCacheDir(source: GitSource): string {
  return path.join(cacheRoot(), sourceCacheKey(source), 'identity');
}

function markerPath(dir: string): string {
  return path.join(dir, '.oprim-last-fetch');
}

function isWithinThrottle(dir: string): boolean {
  const marker = markerPath(dir);
  if (!fs.existsSync(marker)) return false;
  const last = Number(fs.readFileSync(marker, 'utf-8').trim() || '0');
  return Date.now() - last < throttleMs();
}

function touchMarker(dir: string): void {
  fs.writeFileSync(markerPath(dir), String(Date.now()), 'utf-8');
}

function git(args: string[], cwd?: string): void {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

// ─── Resolution results ─────────────────────────────────────────────────────

export interface ResolvedIdentity {
  identity: RemoteContextIdentity | null;
  stale: boolean;
  error?: string;
  nameMismatch?: { declared: string; resolved: string };
}

export interface ResolvedContent {
  workspaceRoot: string; // filesystem path an assembled read can walk (the resolved oprim/ dir)
  stale: boolean;
  error?: string;
  nameMismatch?: { declared: string; resolved: string };
}

function withNameMismatch(
  source: RemoteContextSource,
  identity: RemoteContextIdentity | null | undefined
): { declared: string; resolved: string } | undefined {
  if (!identity) return undefined;
  if (identity.name === source.name) return undefined;
  return { declared: source.name, resolved: identity.name };
}

// ─── Git source resolution ─────────────────────────────────────────────────

function ensureFullGitClone(source: GitSource): { dir: string; stale: boolean; error?: string } {
  const dir = fullCacheDir(source);
  const exists = fs.existsSync(path.join(dir, '.git'));

  if (exists && isWithinThrottle(dir)) {
    return { dir, stale: false };
  }

  try {
    if (!exists) {
      fs.mkdirSync(path.dirname(dir), { recursive: true });
      git(['clone', '--depth', '1', '--quiet', source.git, dir]);
    } else {
      git(['fetch', '--depth', '1', '--quiet', 'origin', 'HEAD'], dir);
      git(['reset', '--hard', '--quiet', 'FETCH_HEAD'], dir);
    }
    touchMarker(dir);
    return { dir, stale: false };
  } catch (err) {
    if (exists) {
      // Last-known-good fallback — resolution degrades to stale rather than failing outright.
      return { dir, stale: true };
    }
    return { dir, stale: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function ensureIdentityOnlyGitClone(source: GitSource): { dir: string; error?: string } {
  const dir = identityCacheDir(source);
  const exists = fs.existsSync(path.join(dir, '.git'));

  if (exists && isWithinThrottle(dir)) {
    return { dir };
  }

  try {
    if (!exists) {
      fs.mkdirSync(path.dirname(dir), { recursive: true });
      // Partial clone (blob:none) + cone sparse-checkout scoped to .oprim-context/ — this is
      // the "targeted single-file fetch" from design.md decision 5, implemented as an
      // equivalent narrow fetch: git only downloads the one blob it needs to check out,
      // not the whole workspace. `git archive --remote` was considered and rejected — GitHub
      // and most managed git hosts disable the upload-archive service, so it isn't portable.
      git(['clone', '--filter=blob:none', '--no-checkout', '--depth', '1', '--quiet', source.git, dir]);
      git(['sparse-checkout', 'init', '--cone'], dir);
      git(['sparse-checkout', 'set', '.oprim-context'], dir);
      git(['checkout', '--quiet'], dir);
    } else {
      git(['fetch', '--depth', '1', '--quiet', 'origin', 'HEAD'], dir);
      git(['reset', '--hard', '--quiet', 'FETCH_HEAD'], dir);
    }
    touchMarker(dir);
    return { dir };
  } catch (err) {
    return { dir, error: err instanceof Error ? err.message : String(err) };
  }
}

export function resolveIdentityOnly(source: RemoteContextSource): ResolvedIdentity {
  if (isPathSource(source)) {
    if (!fs.existsSync(source.path)) {
      return { identity: null, stale: false, error: `path not found: ${source.path}` };
    }
    const identity = readIdentity(source.path);
    return { identity, stale: false, nameMismatch: withNameMismatch(source, identity) };
  }

  const { dir, error } = ensureIdentityOnlyGitClone(source);
  if (error) return { identity: null, stale: false, error };
  const identity = readIdentity(dir);
  return { identity, stale: false, nameMismatch: withNameMismatch(source, identity) };
}

// Local-path sources are always read live (no persistent cache), so "has this ever been
// resolved" is only a meaningful question for git sources, where full resolution populates
// a durable cache directory that outlives any single command invocation.
export function hasEverFullyResolved(source: RemoteContextSource): boolean {
  if (isPathSource(source)) return true;
  return fs.existsSync(path.join(fullCacheDir(source), '.git'));
}

export function resolveFull(source: RemoteContextSource): ResolvedContent {
  if (isPathSource(source)) {
    if (!fs.existsSync(source.path)) {
      return { workspaceRoot: source.path, stale: false, error: `path not found: ${source.path}` };
    }
    const identity = readIdentity(source.path);
    return {
      workspaceRoot: source.path,
      stale: false,
      nameMismatch: withNameMismatch(source, identity),
    };
  }

  const { dir, stale, error } = ensureFullGitClone(source);
  if (error) return { workspaceRoot: dir, stale: false, error };
  const identity = readIdentity(dir);
  return { workspaceRoot: dir, stale, nameMismatch: withNameMismatch(source, identity) };
}

// ─── Assembling oprim/ workspace content for printing ──────────────────────

function walkTextFiles(dir: string, base: string, out: string[]): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      walkTextFiles(full, rel, out);
    } else if (entry.isFile() && /\.(md|yaml|yml)$/.test(entry.name)) {
      out.push(rel);
    }
  }
}

export function assembleOprimWorkspaceContent(workspaceRoot: string): string {
  const oprimDir = path.join(workspaceRoot, 'oprim');
  const files: string[] = [];
  walkTextFiles(oprimDir, 'oprim', files);
  files.sort();

  return files
    .map((rel) => {
      const content = fs.readFileSync(path.join(workspaceRoot, rel), 'utf-8');
      return `─── ${rel} ───\n${content}`;
    })
    .join('\n\n');
}
