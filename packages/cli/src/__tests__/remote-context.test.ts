import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  readRemoteContextConfig,
  writeRemoteContextConfig,
  findSourceByName,
  readIdentity,
  writeIdentity,
  resolveIdentityOnly,
  resolveFull,
  hasEverFullyResolved,
  assembleOprimWorkspaceContent,
  isGitSource,
  isPathSource,
  type GitSource,
  type PathSource,
} from '../lib/remote-context';

let tmpDir: string;
let cacheDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-remote-context-test-'));
  cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-remote-context-cache-'));
  process.env['OPRIM_REMOTE_CONTEXT_CACHE_DIR'] = cacheDir;
  process.env['OPRIM_REMOTE_CONTEXT_THROTTLE_MS'] = '0';
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.rmSync(cacheDir, { recursive: true, force: true });
  delete process.env['OPRIM_REMOTE_CONTEXT_CACHE_DIR'];
  delete process.env['OPRIM_REMOTE_CONTEXT_THROTTLE_MS'];
});

// Creates a real git repo (used as a local "remote" — `git clone <path>` works on any
// filesystem path) with an identity file and an oprim/ workspace, fully committed.
function makeGitSourceRepo(opts: { name: string; description?: string; withIdentity?: boolean }): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-remote-context-repo-'));
  execFileSync('git', ['init', '--quiet', '-b', 'main'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });

  if (opts.withIdentity !== false) {
    fs.mkdirSync(path.join(dir, '.oprim-context'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, '.oprim-context', 'context.yaml'),
      `name: ${opts.name}\nversion: "1"\n${opts.description ? `description: "${opts.description}"\n` : ''}`
    );
  }
  fs.mkdirSync(path.join(dir, 'oprim', 'decisions'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'oprim', 'decisions', 'PDR-001-example.md'), '# PDR-001: Example\n');

  execFileSync('git', ['add', '-A'], { cwd: dir });
  execFileSync('git', ['commit', '--quiet', '-m', 'initial'], { cwd: dir });
  return dir;
}

function makePathSourceRepo(opts: { name: string; description?: string; withIdentity?: boolean }): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-remote-context-path-'));
  if (opts.withIdentity !== false) {
    fs.mkdirSync(path.join(dir, '.oprim-context'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, '.oprim-context', 'context.yaml'),
      `name: ${opts.name}\nversion: "1"\n${opts.description ? `description: "${opts.description}"\n` : ''}`
    );
  }
  fs.mkdirSync(path.join(dir, 'oprim', 'bets'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'oprim', 'bets', 'BET-001.md'), '# BET-001\n');
  return dir;
}

describe('remote_context config read/write', () => {
  it('returns an empty default when no config.yaml exists', () => {
    const config = readRemoteContextConfig(tmpDir);
    expect(config).toEqual({ enabled: false, sources: [] });
  });

  it('reads an existing remote_context block', () => {
    fs.mkdirSync(path.join(tmpDir, 'oprim'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'oprim', 'config.yaml'),
      'version: 1\nremote_context:\n  enabled: true\n  sources:\n    - name: foo\n      git: git@example.com:foo.git\n'
    );
    const config = readRemoteContextConfig(tmpDir);
    expect(config.enabled).toBe(true);
    expect(config.sources).toHaveLength(1);
    expect(config.sources[0].name).toBe('foo');
  });

  it('writes a new remote_context block without disturbing other keys', () => {
    fs.mkdirSync(path.join(tmpDir, 'oprim'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'oprim', 'config.yaml'),
      'version: 1\nproject:\n  name: "my-project"\ncontext: ""\n'
    );

    const source: GitSource = { name: 'acme', git: 'git@example.com:acme.git' };
    writeRemoteContextConfig(tmpDir, { enabled: true, sources: [source] });

    const content = fs.readFileSync(path.join(tmpDir, 'oprim', 'config.yaml'), 'utf-8');
    expect(content).toContain('name: "my-project"');
    expect(content).toContain('context: ""');
    expect(content).toContain('remote_context:');

    const reread = readRemoteContextConfig(tmpDir);
    expect(reread.sources).toHaveLength(1);
    expect(reread.sources[0].name).toBe('acme');
  });

  it('replaces an existing remote_context block in place rather than duplicating it', () => {
    fs.mkdirSync(path.join(tmpDir, 'oprim'), { recursive: true });
    writeRemoteContextConfig(tmpDir, { enabled: false, sources: [] });
    writeRemoteContextConfig(tmpDir, { enabled: true, sources: [{ name: 'a', git: 'x' }] });

    const content = fs.readFileSync(path.join(tmpDir, 'oprim', 'config.yaml'), 'utf-8');
    expect((content.match(/remote_context:/g) || []).length).toBe(1);
  });

  it('findSourceByName finds by exact name', () => {
    const config = { enabled: true, sources: [{ name: 'foo', git: 'x' }] };
    expect(findSourceByName(config, 'foo')).toBeDefined();
    expect(findSourceByName(config, 'bar')).toBeUndefined();
  });
});

describe('source kind discrimination', () => {
  it('identifies git vs path sources', () => {
    const gitSource: GitSource = { name: 'a', git: 'x' };
    const pathSource: PathSource = { name: 'b', path: '/tmp/x' };
    expect(isGitSource(gitSource)).toBe(true);
    expect(isPathSource(gitSource)).toBe(false);
    expect(isGitSource(pathSource)).toBe(false);
    expect(isPathSource(pathSource)).toBe(true);
  });
});

describe('remote context identity file', () => {
  it('returns null when no identity file exists', () => {
    expect(readIdentity(tmpDir)).toBeNull();
  });

  it('writes and reads back an identity file', () => {
    writeIdentity(tmpDir, { name: 'my-context', version: '1', description: 'covers auth and billing' });
    const identity = readIdentity(tmpDir);
    expect(identity).toEqual({ name: 'my-context', version: '1', description: 'covers auth and billing' });
  });

  it('reads an identity file with no description', () => {
    writeIdentity(tmpDir, { name: 'my-context', version: '1' });
    const identity = readIdentity(tmpDir);
    expect(identity?.name).toBe('my-context');
    expect(identity?.description).toBeUndefined();
  });
});

describe('resolveIdentityOnly — local-path sources', () => {
  it('resolves the canonical description without reading the rest of the workspace', () => {
    const repoDir = makePathSourceRepo({ name: 'sibling', description: 'sibling repo decisions' });
    const source: PathSource = { name: 'sibling', path: repoDir };

    const result = resolveIdentityOnly(source);
    expect(result.error).toBeUndefined();
    expect(result.identity?.description).toBe('sibling repo decisions');
    expect(result.nameMismatch).toBeUndefined();
  });

  it('reports a name mismatch without failing resolution', () => {
    const repoDir = makePathSourceRepo({ name: 'actual-name' });
    const source: PathSource = { name: 'declared-name', path: repoDir };

    const result = resolveIdentityOnly(source);
    expect(result.identity).not.toBeNull();
    expect(result.nameMismatch).toEqual({ declared: 'declared-name', resolved: 'actual-name' });
  });

  it('reports an error when the path does not exist', () => {
    const source: PathSource = { name: 'missing', path: path.join(tmpDir, 'does-not-exist') };
    const result = resolveIdentityOnly(source);
    expect(result.error).toContain('path not found');
    expect(result.identity).toBeNull();
  });

  it('returns null identity (no error) when the target has no identity file', () => {
    const repoDir = makePathSourceRepo({ name: 'no-identity', withIdentity: false });
    const source: PathSource = { name: 'no-identity', path: repoDir };
    const result = resolveIdentityOnly(source);
    expect(result.error).toBeUndefined();
    expect(result.identity).toBeNull();
  });
});

describe('resolveFull — local-path sources', () => {
  it('resolves the full workspace content live from disk', () => {
    const repoDir = makePathSourceRepo({ name: 'sibling' });
    const source: PathSource = { name: 'sibling', path: repoDir };

    const result = resolveFull(source);
    expect(result.error).toBeUndefined();
    expect(result.workspaceRoot).toBe(repoDir);

    const content = assembleOprimWorkspaceContent(result.workspaceRoot);
    expect(content).toContain('BET-001');
  });

  it('reflects on-disk changes immediately on the next resolution, with no cache', () => {
    const repoDir = makePathSourceRepo({ name: 'sibling' });
    const source: PathSource = { name: 'sibling', path: repoDir };

    resolveFull(source);
    fs.writeFileSync(path.join(repoDir, 'oprim', 'bets', 'BET-002.md'), '# BET-002\n');

    const result = resolveFull(source);
    const content = assembleOprimWorkspaceContent(result.workspaceRoot);
    expect(content).toContain('BET-002');
  });

  it('reports an error with no fallback when the path does not exist', () => {
    const source: PathSource = { name: 'missing', path: path.join(tmpDir, 'does-not-exist') };
    const result = resolveFull(source);
    expect(result.error).toContain('path not found');
  });

  it('a path source is always considered fully resolved (no persistent cache concept)', () => {
    const source: PathSource = { name: 'sibling', path: tmpDir };
    expect(hasEverFullyResolved(source)).toBe(true);
  });
});

describe('git source resolution', () => {
  it('resolves identity-only content via a first-time partial clone', () => {
    const repoDir = makeGitSourceRepo({ name: 'acme-platform', description: 'platform decisions' });
    const source: GitSource = { name: 'acme-platform', git: repoDir };

    const result = resolveIdentityOnly(source);
    expect(result.error).toBeUndefined();
    expect(result.identity?.description).toBe('platform decisions');
  });

  it('does not check out the rest of the workspace during an identity-only fetch', () => {
    const repoDir = makeGitSourceRepo({ name: 'acme-platform' });
    const source: GitSource = { name: 'acme-platform', git: repoDir };

    resolveIdentityOnly(source);
    expect(hasEverFullyResolved(source)).toBe(false);
  });

  it('resolves full content via a first-time shallow clone', () => {
    const repoDir = makeGitSourceRepo({ name: 'acme-platform' });
    const source: GitSource = { name: 'acme-platform', git: repoDir };

    const result = resolveFull(source);
    expect(result.error).toBeUndefined();
    expect(result.stale).toBe(false);

    const content = assembleOprimWorkspaceContent(result.workspaceRoot);
    expect(content).toContain('PDR-001');
    expect(hasEverFullyResolved(source)).toBe(true);
  });

  it('reports a name mismatch for a git source without failing resolution', () => {
    const repoDir = makeGitSourceRepo({ name: 'actual-name' });
    const source: GitSource = { name: 'declared-name', git: repoDir };

    const result = resolveFull(source);
    expect(result.nameMismatch).toEqual({ declared: 'declared-name', resolved: 'actual-name' });
  });

  it('reports an error with no cache when the remote is unreachable and never resolved before', () => {
    const source: GitSource = { name: 'ghost', git: path.join(tmpDir, 'no-such-repo') };
    const result = resolveFull(source);
    expect(result.error).toBeDefined();
    expect(result.stale).toBe(false);
  });

  it('falls back to stale last-known-good content when a later fetch fails', () => {
    const repoDir = makeGitSourceRepo({ name: 'acme-platform' });
    const source: GitSource = { name: 'acme-platform', git: repoDir };

    // First resolution succeeds and populates the cache.
    const first = resolveFull(source);
    expect(first.error).toBeUndefined();

    // Force the throttle to have expired, then make the remote vanish.
    fs.rmSync(repoDir, { recursive: true, force: true });

    const second = resolveFull(source);
    expect(second.error).toBeUndefined();
    expect(second.stale).toBe(true);
  });

  it('returns null identity (no error) when the remote has no identity file', () => {
    const repoDir = makeGitSourceRepo({ name: 'no-identity', withIdentity: false });
    const source: GitSource = { name: 'no-identity', git: repoDir };

    const result = resolveIdentityOnly(source);
    expect(result.error).toBeUndefined();
    expect(result.identity).toBeNull();
  });
});
