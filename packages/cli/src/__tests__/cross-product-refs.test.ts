import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import * as yaml from 'js-yaml';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  parseRef,
  RefResolver,
  collectRefs,
  checkCrossProductRefs,
} from '../lib/portfolio/refs';
import { checkProductRegistry, readProducts } from '../lib/portfolio/products';
import { runWorkspaceModeChecks } from '../lib/portfolio/checks';
import { checkSequenceIntegrity, type Check } from '../lib/integrity';
import { resolveFull, readIdentity, type RemoteContextSource } from '../lib/remote-context';
import { contextCommand } from '../commands/context';

let tmpRoot: string;
let project: string;
let cacheDir: string;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-xrefs-'));
  project = path.join(tmpRoot, 'portfolio');
  fs.mkdirSync(path.join(project, 'oprim'), { recursive: true });
  cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-xrefs-cache-'));
  process.env['OPRIM_REMOTE_CONTEXT_CACHE_DIR'] = cacheDir;
  process.env['OPRIM_REMOTE_CONTEXT_THROTTLE_MS'] = '0';
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  fs.rmSync(cacheDir, { recursive: true, force: true });
  delete process.env['OPRIM_REMOTE_CONTEXT_CACHE_DIR'];
  delete process.env['OPRIM_REMOTE_CONTEXT_THROTTLE_MS'];
});

// ─── fixtures ────────────────────────────────────────────────────────────────

interface ProductFixture {
  pending?: string[];
  archived?: string[];
  decisions?: Record<string, string>; // filename → status
  notes?: string[];
  mode?: 'portfolio';
}

function writeWorkspace(dir: string, name: string, f: ProductFixture): void {
  fs.mkdirSync(path.join(dir, '.oprim-context'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.oprim-context', 'context.yaml'),
    `name: ${name}\nversion: "1"\n${f.mode ? `mode: ${f.mode}\n` : ''}`
  );
  for (const b of f.pending ?? []) fs.mkdirSync(path.join(dir, 'oprim', 'bets', 'pending', b), { recursive: true });
  for (const b of f.archived ?? []) fs.mkdirSync(path.join(dir, 'oprim', 'bets', 'archived', b), { recursive: true });
  for (const [file, status] of Object.entries(f.decisions ?? {})) {
    fs.mkdirSync(path.join(dir, 'oprim', 'decisions'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'oprim', 'decisions', file), `# ${file}\n\n## Status\n${status}\n\n## Context\nx\n`);
  }
  for (const n of f.notes ?? []) {
    fs.mkdirSync(path.join(dir, 'oprim', 'notes'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'oprim', 'notes', n), '# note\n');
  }
}

function makeLocalProduct(name: string, f: ProductFixture): string {
  const dir = path.join(tmpRoot, name);
  writeWorkspace(dir, name, f);
  return dir;
}

function makeGitProduct(name: string, f: ProductFixture): string {
  const dir = path.join(tmpRoot, `${name}-repo`);
  writeWorkspace(dir, name, f);
  execFileSync('git', ['init', '--quiet', '-b', 'main'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  // git does not track empty directories
  for (const sub of ['pending', 'archived']) {
    const base = path.join(dir, 'oprim', 'bets', sub);
    if (!fs.existsSync(base)) continue;
    for (const b of fs.readdirSync(base)) fs.writeFileSync(path.join(base, b, 'bet-decision.md'), '# bet\n');
  }
  execFileSync('git', ['add', '-A'], { cwd: dir });
  execFileSync('git', ['commit', '--quiet', '-m', 'init'], { cwd: dir });
  return dir;
}

function writeConfig(cfg: Record<string, unknown>, mode?: 'portfolio'): void {
  const body = yaml.dump(cfg, { lineWidth: -1 });
  fs.writeFileSync(path.join(project, 'oprim', 'config.yaml'), `version: 1\n${mode ? `mode: ${mode}\n` : ''}${body}`);
}

function registerSources(sources: RemoteContextSource[], extra: Record<string, unknown> = {}, mode?: 'portfolio'): void {
  writeConfig({ remote_context: { enabled: true, sources }, ...extra }, mode);
}

function writeSequence(content: string): void {
  fs.writeFileSync(path.join(project, 'oprim', 'sequence.yaml'), content);
}

function writeBetLinks(bet: string, links: string): void {
  const dir = path.join(project, 'oprim', 'bets', 'pending', bet);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'bet-decision.md'), `# Decision: ${bet}\n\n## Status\n- Decision: Build now\n\n## Links\n${links}\n`);
}

function refChecks(): Check[] {
  const checks: Check[] = [];
  checkCrossProductRefs(project, checks);
  return checks;
}

// ─── 1. grammar ──────────────────────────────────────────────────────────────

describe('parseRef', () => {
  it('parses a qualified bet reference', () => {
    expect(parseRef('checkout:BET-012')).toEqual({ source: 'checkout', kind: 'BET', id: 'BET-012', raw: 'checkout:BET-012' });
  });

  it('parses every kind', () => {
    for (const kind of ['BET', 'PDR', 'OBJ', 'NOTE']) {
      expect(parseRef(`acme-portfolio:${kind}-3`)?.kind).toBe(kind);
    }
  });

  it('treats an unqualified ID as local', () => {
    expect(parseRef('BET-012')).toEqual({ source: null, kind: 'BET', id: 'BET-012', raw: 'BET-012' });
  });

  it('rejects invalid qualifier characters and unknown kinds', () => {
    expect(parseRef('Checkout:BET-012')).toBeNull();
    expect(parseRef('-checkout:BET-012')).toBeNull();
    expect(parseRef('check_out:BET-012')).toBeNull();
    expect(parseRef('checkout:TASK-012')).toBeNull();
    expect(parseRef('checkout: BET-012')).toBeNull();
    expect(parseRef('None')).toBeNull();
  });

  it('YAML flow lists keep an unspaced qualified reference a string', () => {
    const parsed = yaml.load('blocked_by: [checkout:BET-012, BET-003]') as { blocked_by: unknown[] };
    expect(parsed.blocked_by).toEqual(['checkout:BET-012', 'BET-003']);
  });
});

// ─── 2. resolver ─────────────────────────────────────────────────────────────

describe('RefResolver', () => {
  it('finds pending and archived bets, PDRs with status, and notes', () => {
    const dir = makeLocalProduct('checkout', {
      pending: ['BET-020-wallet-v2'],
      archived: ['BET-012-add-wallet'],
      decisions: { 'PDR-003-data-retention.md': 'Accepted' },
      notes: ['NOTE-007-idea.md'],
    });
    registerSources([{ name: 'checkout', path: dir }]);
    const r = new RefResolver(project);

    expect(r.resolve(parseRef('checkout:BET-012')!)).toMatchObject({ status: 'found', state: 'archived' });
    expect(r.resolve(parseRef('checkout:BET-020')!)).toMatchObject({ status: 'found', state: 'pending' });
    expect(r.resolve(parseRef('checkout:PDR-003')!)).toMatchObject({ status: 'found', state: 'Accepted' });
    expect(r.resolve(parseRef('checkout:NOTE-007')!)).toMatchObject({ status: 'found' });
  });

  it('does not match a longer ID with the same prefix', () => {
    const dir = makeLocalProduct('checkout', { pending: ['BET-0123-other'] });
    registerSources([{ name: 'checkout', path: dir }]);
    expect(new RefResolver(project).resolve(parseRef('checkout:BET-012')!).status).toBe('missing');
  });

  it('reports missing, unknown-source and unreachable', () => {
    const dir = makeLocalProduct('checkout', {});
    registerSources([
      { name: 'checkout', path: dir },
      { name: 'gone', path: path.join(tmpRoot, 'nope') },
    ]);
    const r = new RefResolver(project);
    expect(r.resolve(parseRef('checkout:BET-099')!).status).toBe('missing');
    expect(r.resolve(parseRef('chekout:BET-031')!).status).toBe('unknown-source');
    expect(r.resolve(parseRef('gone:BET-001')!).status).toBe('unreachable');
  });

  it('resolves relative path sources against the project root, not the cwd', () => {
    makeLocalProduct('checkout', { pending: ['BET-001'] });
    registerSources([{ name: 'checkout', path: '../checkout' }]);
    expect(new RefResolver(project).resolve(parseRef('checkout:BET-001')!).status).toBe('found');
  });

  it('resolves each source at most once for many references', () => {
    const dir = makeGitProduct('checkout', { pending: Array.from({ length: 20 }, (_, i) => `BET-${i + 1}`) });
    registerSources([{ name: 'checkout', git: dir }]);
    let calls = 0;
    const r = new RefResolver(project, (s) => {
      calls++;
      return resolveFull(s);
    });
    for (let i = 1; i <= 20; i++) {
      expect(r.resolve(parseRef(`checkout:BET-${i}`)!).status).toBe('found');
    }
    expect(calls).toBe(1);
  });

  it('serves references from a stale cache when the git fetch fails', () => {
    const dir = makeGitProduct('checkout', { archived: ['BET-012-add-wallet'] });
    registerSources([{ name: 'checkout', git: dir }]);
    expect(new RefResolver(project).resolve(parseRef('checkout:BET-012')!).stale).toBe(false);

    fs.rmSync(dir, { recursive: true, force: true });
    const res = new RefResolver(project).resolve(parseRef('checkout:BET-012')!);
    expect(res).toMatchObject({ status: 'found', stale: true, state: 'archived' });

    const checks = (() => {
      writeSequence('now:\n  - id: BET-001\n    blocked_by: [checkout:BET-012]\n');
      return refChecks();
    })();
    expect(checks).toEqual([expect.objectContaining({ name: 'ref: checkout:BET-012 (archived) (stale)', pass: true })]);
  });
});

// ─── 3. collection + checks ──────────────────────────────────────────────────

describe('collectRefs / checkCrossProductRefs', () => {
  it('collects from sequence fields and bet Links lines, ignoring prose', () => {
    writeSequence(`
now:
  - id: BET-001
    blocked_by: [checkout:BET-012, BET-002]
    unlocks: [search:BET-004]
    requires_pdrs: [acme:PDR-003]
`);
    writeBetLinks('BET-001-x', '- PDRs: PDR-001, acme:PDR-002\n- Objectives: None\n- Delegated to: `chekout:BET-031`\n- OpenSpec change: checkout:BET-999');
    const raws = collectRefs(project).map((c) => c.ref.raw);
    expect(raws).toEqual(
      expect.arrayContaining(['checkout:BET-012', 'BET-002', 'search:BET-004', 'acme:PDR-003', 'PDR-001', 'acme:PDR-002', 'chekout:BET-031'])
    );
    expect(raws).not.toContain('checkout:BET-999'); // not a reference-bearing Links label
  });

  it('missing artifact in a reachable source is a required failure', () => {
    const dir = makeLocalProduct('checkout', {});
    registerSources([{ name: 'checkout', path: dir }]);
    writeSequence('now:\n  - id: BET-001\n    blocked_by: [checkout:BET-099]\n');
    expect(refChecks()).toEqual([
      expect.objectContaining({ name: 'ref: checkout:BET-099 not found in checkout', pass: false, required: true }),
    ]);
  });

  it('unknown qualifier in bet Links is a required failure', () => {
    registerSources([]);
    writeBetLinks('BET-001-x', '- Delegated to: chekout:BET-031');
    expect(refChecks()).toEqual([
      expect.objectContaining({ name: 'ref: unknown source "chekout"', pass: false, required: true }),
    ]);
  });

  it('unreachable source with no cache is non-required', () => {
    registerSources([{ name: 'checkout', git: path.join(tmpRoot, 'no-such-repo') }]);
    writeSequence('now:\n  - id: BET-001\n    blocked_by: [checkout:BET-012]\n');
    const [c] = refChecks();
    expect(c).toMatchObject({ pass: false, required: false });
    expect(c.name).toContain('unreachable');
  });

  it('a product workspace citing a portfolio PDR passes', () => {
    const dir = makeLocalProduct('acme-portfolio', { mode: 'portfolio', decisions: { 'PDR-003-data-retention.md': 'Accepted' } });
    registerSources([{ name: 'acme-portfolio', path: dir }]); // no mode: key → product workspace
    writeSequence('now:\n  - id: BET-001\n    requires_pdrs: [acme-portfolio:PDR-003]\n');
    const checks = refChecks();
    expect(checks).toEqual([expect.objectContaining({ pass: true, name: 'ref: acme-portfolio:PDR-003 (Accepted)' })]);
  });

  it('adds nothing when there are no qualified references', () => {
    writeSequence('now:\n  - id: BET-001\n    blocked_by: [BET-002]\n');
    expect(refChecks()).toEqual([]);
  });

  it('5 products × ~50 references resolve well under 10s', () => {
    const sources: RemoteContextSource[] = [];
    const refs: string[] = [];
    for (let p = 0; p < 5; p++) {
      const name = `product-${p}`;
      const bets = Array.from({ length: 10 }, (_, i) => `BET-${p * 10 + i + 1}-slug`);
      sources.push({ name, path: makeLocalProduct(name, { pending: bets }) });
      refs.push(...bets.map((b) => `${name}:${b.replace(/-slug$/, '')}`));
    }
    registerSources(sources);
    writeSequence(`now:\n  - id: BET-001\n    blocked_by: [${refs.join(', ')}]\n`);
    const start = Date.now();
    const checks = refChecks();
    expect(Date.now() - start).toBeLessThan(10_000);
    expect(checks).toHaveLength(50);
    expect(checks.every((c) => c.pass)).toBe(true);
  });
});

// ─── 4. integrity ────────────────────────────────────────────────────────────

describe('checkSequenceIntegrity with qualified references', () => {
  function integrity(): Check[] {
    const checks: Check[] = [];
    checkSequenceIntegrity(project, checks);
    return checks;
  }

  it('does not flag qualified blocked_by/unlocks as dangling', () => {
    writeSequence('now:\n  - id: BET-001\n    blocked_by: [checkout:BET-012]\n    unlocks: [search:BET-004]\n');
    expect(integrity()).toEqual([]);
  });

  it('still flags unqualified dangling references', () => {
    writeSequence('now:\n  - id: BET-001\n    blocked_by: [BET-999]\n');
    expect(integrity().map((c) => c.name)).toEqual(['sequence: dangling blocked_by reference BET-999']);
  });

  it('hints when an entry was written with a space and parsed as a map', () => {
    writeSequence('now:\n  - id: BET-001\n    blocked_by: [checkout: BET-012]\n');
    expect(integrity()).toEqual([
      expect.objectContaining({
        name: 'sequence: BET-001 blocked_by entry parsed as a map — write it as checkout:BET-012',
        pass: false,
        required: false,
      }),
    ]);
  });
});

// ─── 5. product registry ─────────────────────────────────────────────────────

describe('product registry', () => {
  function registry(): Check[] {
    const checks: Check[] = [];
    checkProductRegistry(project, checks);
    return checks;
  }

  it('accepts a product that names a registered source', () => {
    registerSources([{ name: 'checkout', path: '../checkout' }], {
      products: [{ source: 'checkout', owner: 'Dana', squad: 'payments', status: 'active' }],
    }, 'portfolio');
    expect(registry()).toEqual([expect.objectContaining({ pass: true, name: 'products: 1 registered' })]);
    expect(readProducts(project)).toEqual([
      { source: 'checkout', owner: 'Dana', squad: 'payments', objectives: undefined, status: 'active' },
    ]);
  });

  it('defaults status to active', () => {
    registerSources([{ name: 'checkout', path: '../checkout' }], { products: [{ source: 'checkout' }] }, 'portfolio');
    expect(readProducts(project)[0].status).toBe('active');
  });

  it('fails when the source is not registered', () => {
    registerSources([], { products: [{ source: 'search' }] }, 'portfolio');
    expect(registry()).toEqual([
      expect.objectContaining({
        name: "products: search is not a registered remote_context source — run 'oprim context register'",
        required: true,
        pass: false,
      }),
    ]);
  });

  it('fails when a product carries its own git field', () => {
    registerSources([{ name: 'checkout', path: '../checkout' }], {
      products: [{ source: 'checkout', git: 'git@example.com:x.git' }],
    }, 'portfolio');
    const [c] = registry();
    expect(c).toMatchObject({ pass: false, required: true, name: 'products: checkout has its own git field' });
    expect(c.note).toContain('remote_context.sources');
  });

  it('fails on an unknown status', () => {
    registerSources([{ name: 'checkout', path: '../checkout' }], { products: [{ source: 'checkout', status: 'dead' }] }, 'portfolio');
    expect(registry()[0]).toMatchObject({ pass: false, required: true });
  });

  it('runs only in portfolio mode', () => {
    registerSources([], { products: [{ source: 'search' }] });
    const checks: Check[] = [];
    runWorkspaceModeChecks(project, checks);
    expect(checks.filter((c) => c.name.startsWith('products:'))).toEqual([]);
  });
});

// ─── 6. identity mode ────────────────────────────────────────────────────────

describe('identity mode', () => {
  let logLines: string[];
  beforeEach(() => {
    logLines = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logLines.push(args.map(String).join(' '));
    });
  });

  it('readIdentity passes mode through and ignores unknown values', () => {
    const dir = makeLocalProduct('p', { mode: 'portfolio' });
    expect(readIdentity(dir)?.mode).toBe('portfolio');
    fs.writeFileSync(path.join(dir, '.oprim-context', 'context.yaml'), 'name: p\nversion: "1"\nmode: weird\n');
    expect(readIdentity(dir)?.mode).toBeUndefined();
  });

  it('context init writes mode: portfolio in a portfolio workspace', async () => {
    writeConfig({}, 'portfolio');
    vi.spyOn(process, 'cwd').mockReturnValue(project);
    await contextCommand().parseAsync(['init'], { from: 'user' });
    expect(readIdentity(project)?.mode).toBe('portfolio');
  });

  it('context init writes no mode in a product workspace', async () => {
    writeConfig({});
    vi.spyOn(process, 'cwd').mockReturnValue(project);
    await contextCommand().parseAsync(['init'], { from: 'user' });
    const raw = fs.readFileSync(path.join(project, '.oprim-context', 'context.yaml'), 'utf-8');
    expect(raw).not.toContain('mode');
  });

  it('context list labels portfolio sources', async () => {
    const portfolio = makeLocalProduct('acme-portfolio', { mode: 'portfolio' });
    const ds = makeLocalProduct('design-system', {});
    registerSources([
      { name: 'acme-portfolio', path: portfolio },
      { name: 'design-system', path: ds },
    ]);
    vi.spyOn(process, 'cwd').mockReturnValue(project);
    await contextCommand().parseAsync(['list'], { from: 'user' });
    const header = (n: string) => logLines.find((l) => l.includes(n) && l.includes('(path)'))!;
    expect(header('acme-portfolio')).toMatch(/\(path\).*portfolio/);
    expect(header('design-system')).not.toMatch(/\(path\).*portfolio/);
  });
});
