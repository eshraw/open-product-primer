import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import * as yaml from 'js-yaml';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildPortfolioView } from '../lib/portfolio/view';
import { renderPortfolioTerminal, renderPortfolioMarkdown } from '../lib/portfolio/render';
import { checkPortfolioWip } from '../lib/portfolio/wip';
import { extractReviewDate, extractLinks, resolveBetDecisionPath } from '../lib/bet-meta';
import type { Check } from '../lib/integrity';
import { ovwCommand } from '../commands/ovw';

let tmpRoot: string;
let portfolio: string;
let cacheDir: string;

const TODAY = '2027-01-10';

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-pview-'));
  portfolio = path.join(tmpRoot, 'acme');
  cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-pview-cache-'));
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

interface BetFixture {
  objectives?: string;
  delegatedTo?: string;
  delegatedFrom?: string;
  review?: string;
  promoted?: boolean;
  criteria?: boolean;
}

interface WorkspaceFixture {
  name: string;
  sequence: string;
  bets?: Record<string, BetFixture>; // dir name → fixture
  archived?: string[];
  objectives?: Record<string, string>; // file → status
}

function decision(id: string, f: BetFixture): string {
  return [
    `# Decision: ${id}`,
    '',
    '## Status',
    '- Decision: Build now',
    `- Review date: ${f.review ?? 'YYYY-MM-DD'}`,
    '',
    '## Links',
    '- PDRs: None',
    `- Objectives: ${f.objectives ?? 'None'}`,
    ...(f.delegatedTo ? [`- Delegated to: ${f.delegatedTo}`] : []),
    ...(f.delegatedFrom ? [`- Delegated from: ${f.delegatedFrom}`] : []),
    `- OpenSpec change: ${f.promoted ? 'openspec/changes/x' : '<to be filled when promoted>'}`,
    '',
  ].join('\n');
}

function writeWorkspace(dir: string, f: WorkspaceFixture): void {
  fs.mkdirSync(path.join(dir, '.oprim-context'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.oprim-context', 'context.yaml'), `name: ${f.name}\nversion: "1"\n`);
  fs.mkdirSync(path.join(dir, 'oprim'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'oprim', 'sequence.yaml'), f.sequence);
  for (const [bet, bf] of Object.entries(f.bets ?? {})) {
    const betDir = path.join(dir, 'oprim', 'bets', 'pending', bet);
    fs.mkdirSync(betDir, { recursive: true });
    fs.writeFileSync(path.join(betDir, 'bet-decision.md'), decision(bet.slice(0, 7), bf));
    if (bf.criteria) fs.writeFileSync(path.join(betDir, 'criteria.yaml'), 'criteria: []\n');
  }
  for (const bet of f.archived ?? []) {
    const betDir = path.join(dir, 'oprim', 'bets', 'archived', bet);
    fs.mkdirSync(betDir, { recursive: true });
    fs.writeFileSync(path.join(betDir, 'bet-decision.md'), '# archived\n');
  }
  for (const [file, status] of Object.entries(f.objectives ?? {})) {
    fs.mkdirSync(path.join(dir, 'oprim', 'objectives'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'oprim', 'objectives', file), `# ${file.slice(0, 7)}: Objective\n\n## Status\n${status}\n`);
  }
}

function localProduct(f: WorkspaceFixture): string {
  const dir = path.join(tmpRoot, f.name);
  writeWorkspace(dir, f);
  return dir;
}

function gitProduct(f: WorkspaceFixture): string {
  const dir = path.join(tmpRoot, `${f.name}-repo`);
  writeWorkspace(dir, f);
  execFileSync('git', ['init', '--quiet', '-b', 'main'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  execFileSync('git', ['add', '-A'], { cwd: dir });
  execFileSync('git', ['commit', '--quiet', '-m', 'init'], { cwd: dir });
  return dir;
}

interface PortfolioFixture extends Omit<WorkspaceFixture, 'name'> {
  products: Array<{ source: string; owner?: string; squad?: string; status?: string }>;
  sources: Array<{ name: string; path?: string; git?: string }>;
  okf?: boolean;
  mode?: 'portfolio' | null;
}

function writePortfolio(f: PortfolioFixture): void {
  writeWorkspace(portfolio, { ...f, name: 'acme' });
  const cfg = yaml.dump(
    {
      okf: { enabled: f.okf ?? false },
      remote_context: { enabled: true, sources: f.sources },
      products: f.products,
    },
    { lineWidth: -1 }
  );
  const mode = f.mode === null ? '' : 'mode: portfolio\n';
  fs.writeFileSync(path.join(portfolio, 'oprim', 'config.yaml'), `version: 1\n${mode}${cfg}`);
}

/** Two products, the spec's scenarios: checkout Now 2/2, search Now 1/3, an out-of-order dependency. */
function standardFixture(extra: Partial<PortfolioFixture> = {}): void {
  const checkout = localProduct({
    name: 'checkout',
    sequence: [
      'wip_limits:',
      '  now: 2',
      'now:',
      '  - id: BET-031',
      '    title: Wallet checkout',
      '    blocked_by: [search:BET-014]',
      '  - id: BET-032',
      '    title: Saved cards',
      'next:',
      '  - id: BET-033',
      '    title: Refunds',
      '',
    ].join('\n'),
    bets: {
      'BET-031-wallet': { objectives: 'acme:OBJ-001', review: '2027-01-05', promoted: true },
      'BET-032-saved-cards': { delegatedFrom: 'acme:BET-010' },
      'BET-033-refunds': { review: '2027-02-01', promoted: true, criteria: true },
    },
  });
  const search = localProduct({
    name: 'search',
    sequence: [
      'wip_limits:',
      '  now: 3',
      'now:',
      '  - id: BET-020',
      '    title: Facets',
      '    blocked_by: [acme:BET-099]',
      'later:',
      '  - id: BET-014',
      '    title: Index rebuild',
      '',
    ].join('\n'),
    bets: { 'BET-020-facets': { objectives: 'acme:OBJ-001' }, 'BET-014-index': {} },
  });
  writePortfolio({
    sequence: [
      'wip_limits:',
      '  now: 2',
      'now:',
      '  - id: BET-010',
      '    title: Payments strategy',
      'later:',
      '  - id: BET-011',
      '    title: Marketplace',
      '',
    ].join('\n'),
    bets: {
      'BET-010-payments': { objectives: 'OBJ-003', delegatedTo: 'checkout:BET-032' },
      'BET-011-marketplace': { objectives: 'OBJ-002' },
    },
    objectives: {
      'OBJ-001-grow.md': 'Active',
      'OBJ-002-marketplace.md': 'Active',
      'OBJ-003-payments.md': 'Active',
      'OBJ-004-old.md': 'Achieved',
    },
    products: [
      { source: 'checkout', owner: 'alice', squad: 'payments' },
      { source: 'search', owner: 'bob' },
    ],
    sources: [
      { name: 'checkout', path: checkout },
      { name: 'search', path: search },
    ],
    ...extra,
  });
}

// ─── bet-meta ────────────────────────────────────────────────────────────────

describe('bet-meta', () => {
  it('reads the review date and ignores the placeholder', () => {
    expect(extractReviewDate('## Status\n- Review date: 2027-01-08\n')).toBe('2027-01-08');
    expect(extractReviewDate('- Review date: YYYY-MM-DD\n')).toBeNull();
    expect(extractReviewDate('**Review date:** 2027-03-01\n')).toBe('2027-03-01');
  });

  it('reads ## Links into label → tokens', () => {
    const links = extractLinks('## Links\n- Objectives: OBJ-001, `acme:OBJ-002`\n- PDRs: None\n\n## Other\n- Objectives: OBJ-9\n');
    expect(links.get('objectives')).toEqual(['OBJ-001', 'acme:OBJ-002']);
    expect(links.get('pdrs')).toEqual(['None']);
  });

  it('never matches BET-01 against BET-012', () => {
    const dir = path.join(tmpRoot, 'bets');
    fs.mkdirSync(path.join(dir, 'BET-012-x'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'BET-012-x', 'bet-decision.md'), '#');
    expect(resolveBetDecisionPath(dir, 'BET-01')).toBeNull();
    expect(resolveBetDecisionPath(dir, 'BET-012')).toContain('BET-012-x');
  });
});

// ─── view model ──────────────────────────────────────────────────────────────

describe('buildPortfolioView', () => {
  it('renders each product with its load, owner and Now/Next', () => {
    standardFixture();
    const view = buildPortfolioView(portfolio, TODAY);
    expect(view.portfolio).toMatchObject({ name: 'portfolio', load: { now: 1, limit: 2 } });
    expect(view.products.map((p) => [p.name, p.load])).toEqual([
      ['checkout', { now: 2, limit: 2 }],
      ['search', { now: 1, limit: 3 }],
    ]);
    expect(view.products[0]).toMatchObject({ owner: 'alice', squad: 'payments', stale: false, unreachable: false });
    expect(view.products[0].next).toEqual([{ id: 'BET-033', title: 'Refunds' }]);

    const lines = renderPortfolioTerminal(view);
    expect(lines.some((l) => l.startsWith('checkout now 2/2'))).toBe(true);
    expect(lines.some((l) => l.startsWith('search now 1/3'))).toBe(true);
  });

  it('lists out-of-order and unresolved cross-product dependencies', () => {
    standardFixture();
    const view = buildPortfolioView(portfolio, TODAY);
    expect(view.dependencies).toEqual([
      { from: 'checkout:BET-031', fromLane: 'now', blocker: 'search:BET-014', blockerState: 'later', problem: 'out-of-order' },
      { from: 'search:BET-020', fromLane: 'now', blocker: 'BET-099', blockerState: 'missing', problem: 'unresolved' },
    ]);
    expect(renderPortfolioTerminal(view)).toContain('  checkout:BET-031 (now) blocked by search:BET-014 (later)');
  });

  it('accepts a blocker in now/next or archived', () => {
    standardFixture();
    // Move search:BET-014 to next and add an archived blocker.
    const searchSeq = path.join(tmpRoot, 'search', 'oprim', 'sequence.yaml');
    fs.writeFileSync(
      searchSeq,
      'now:\n  - id: BET-020\n    title: Facets\nnext:\n  - id: BET-014\n    title: Index rebuild\n'
    );
    fs.mkdirSync(path.join(portfolio, 'oprim', 'bets', 'archived', 'BET-005-done'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpRoot, 'checkout', 'oprim', 'sequence.yaml'),
      'now:\n  - id: BET-031\n    title: W\n    blocked_by: [search:BET-014, acme:BET-005]\n'
    );
    expect(buildPortfolioView(portfolio, TODAY).dependencies).toEqual([]);
  });

  it('reports objective coverage, counting delegated bets', () => {
    standardFixture();
    const view = buildPortfolioView(portfolio, TODAY);
    // OBJ-001: direct product links. OBJ-003: BET-010 in now. OBJ-002: only a Later bet. OBJ-004 inactive.
    expect(view.coverage.objectivesWithoutFlight).toEqual(['OBJ-002']);
    // BET-032 is covered via "Delegated from: acme:BET-010"; BET-033 links nothing.
    expect(view.coverage.betsWithoutObjective).toEqual(['checkout:BET-033']);
    expect(renderPortfolioTerminal(view)).toContain('  OBJ-002 has no bet in now/next');
  });

  it('covers an objective through "Delegated to" when the delegate is in flight', () => {
    standardFixture();
    // BET-011 (Later, OBJ-002) delegates to checkout:BET-033, which is in Next.
    fs.writeFileSync(
      path.join(portfolio, 'oprim', 'bets', 'pending', 'BET-011-marketplace', 'bet-decision.md'),
      decision('BET-011', { objectives: 'OBJ-002', delegatedTo: 'checkout:BET-033' })
    );
    expect(buildPortfolioView(portfolio, TODAY).coverage.objectivesWithoutFlight).toEqual([]);
  });

  it('reports overdue reviews and promoted bets missing criteria', () => {
    standardFixture();
    const view = buildPortfolioView(portfolio, TODAY);
    expect(view.hygiene.overdueReviews).toEqual([{ ref: 'checkout:BET-031', date: '2027-01-05' }]);
    expect(view.hygiene.missingCriteria).toEqual(['checkout:BET-031']);
    expect(renderPortfolioTerminal(view)).toContain('  checkout:BET-031 review overdue (2027-01-05)');
  });

  it('skips sunset products and lists unreachable ones without aborting', () => {
    standardFixture({
      products: [
        { source: 'checkout' },
        { source: 'search', status: 'sunset' },
        { source: 'billing' },
      ],
    });
    // billing is registered but its path does not exist.
    const cfgPath = path.join(portfolio, 'oprim', 'config.yaml');
    const cfg = yaml.load(fs.readFileSync(cfgPath, 'utf-8')) as Record<string, any>;
    cfg.remote_context.sources.push({ name: 'billing', path: path.join(tmpRoot, 'nope') });
    fs.writeFileSync(cfgPath, yaml.dump(cfg));

    const view = buildPortfolioView(portfolio, TODAY);
    expect(view.products.map((p) => p.name)).toEqual(['checkout', 'billing']);
    expect(view.products[1]).toMatchObject({ unreachable: true, now: [], next: [] });
    expect(renderPortfolioTerminal(view).some((l) => l.startsWith('billing unreachable'))).toBe(true);
  });

  it('marks a git product served from a stale cache', () => {
    const dir = gitProduct({ name: 'search', sequence: 'now:\n  - id: BET-020\n    title: Facets\n' });
    writePortfolio({
      sequence: 'now: []\n',
      products: [{ source: 'search' }],
      sources: [{ name: 'search', git: dir }],
    });
    expect(buildPortfolioView(portfolio, TODAY).products[0].stale).toBe(false);

    fs.rmSync(dir, { recursive: true, force: true });
    const view = buildPortfolioView(portfolio, TODAY);
    expect(view.products[0]).toMatchObject({ stale: true, unreachable: false, now: [{ id: 'BET-020', title: 'Facets' }] });
    expect(renderPortfolioTerminal(view)).toContain('search now 1 (stale)');
  });

  it('is identical across runs and has no ANSI codes off a TTY', () => {
    standardFixture();
    const a = renderPortfolioTerminal(buildPortfolioView(portfolio, TODAY)).join('\n');
    const b = renderPortfolioTerminal(buildPortfolioView(portfolio, TODAY)).join('\n');
    expect(a).toBe(b);
    expect(a).not.toMatch(/\u001b\[/);
    expect(a).toMatchSnapshot();
  });
});

// ─── markdown ────────────────────────────────────────────────────────────────

describe('renderPortfolioMarkdown', () => {
  it('starts with parseable OKF frontmatter listing every section when OKF is on', () => {
    standardFixture();
    const md = renderPortfolioMarkdown(buildPortfolioView(portfolio, TODAY), true);
    expect(md.startsWith('---\n')).toBe(true);
    const fm = yaml.load(md.split('---\n')[1]) as Record<string, any>;
    expect(fm.type).toBe('portfolio-view');
    expect(fm.timestamp).toBe(TODAY);
    expect(fm.products.map((p: any) => p.name)).toEqual(['portfolio', 'checkout', 'search']);
    expect(Array.isArray(fm.dependencies) && Array.isArray(fm.coverage) && Array.isArray(fm.hygiene)).toBe(true);
    expect(fm.coverage).toContainEqual({ kind: 'objective-without-flight', ref: 'OBJ-002' });
  });

  it('is plain markdown tables when OKF is off', () => {
    standardFixture();
    const md = renderPortfolioMarkdown(buildPortfolioView(portfolio, TODAY), false);
    expect(md.startsWith('# Portfolio view')).toBe(true);
    expect(md).toContain('| checkout | now 2/2 | active | now | BET-031 | Wallet checkout |');
    expect(md).toContain('| checkout:BET-031 | now | search:BET-014 | later | out-of-order |');
  });
});

// ─── WIP ─────────────────────────────────────────────────────────────────────

describe('checkPortfolioWip', () => {
  function wipFixture(searchNow: number, portfolioLimit?: number, searchStatus?: string): Check[] {
    const bets = (n: number, start: number): string =>
      Array.from({ length: n }, (_, i) => `  - id: BET-${start + i}\n    title: B${i}\n`).join('');
    const checkout = localProduct({ name: 'checkout', sequence: `wip_limits:\n  now: 2\nnow:\n${bets(2, 30)}` });
    const search = localProduct({ name: 'search', sequence: `wip_limits:\n  now: 2\nnow:\n${bets(searchNow, 40)}` });
    writePortfolio({
      sequence: `wip_limits:\n  now: 2\n${portfolioLimit !== undefined ? `  portfolio_now: ${portfolioLimit}\n` : ''}now:\n${bets(1, 10)}`,
      products: [{ source: 'checkout' }, { source: 'search', ...(searchStatus ? { status: searchStatus } : {}) }],
      sources: [
        { name: 'checkout', path: checkout },
        { name: 'search', path: search },
      ],
    });
    const checks: Check[] = [];
    checkPortfolioWip(portfolio, checks);
    return checks;
  }

  it('flags a product over its own limit', () => {
    expect(wipFixture(3)).toEqual([
      expect.objectContaining({ name: 'search: WIP limit exceeded (3 active, limit 2)', pass: false, required: false }),
    ]);
  });

  it('flags the portfolio-wide limit', () => {
    const checks = wipFixture(3, 5);
    expect(checks).toContainEqual(
      expect.objectContaining({
        name: 'portfolio: WIP limit exceeded (6 active across 3 workspaces, limit 5)',
        pass: false,
        required: false,
      })
    );
  });

  it('excludes sunset products', () => {
    expect(wipFixture(3, 5, 'sunset')).toEqual([expect.objectContaining({ name: 'portfolio: WIP within limits', pass: true })]);
  });
});

// ─── command ─────────────────────────────────────────────────────────────────

describe('oprim ovw --portfolio', () => {
  let out: string[];
  let err: string[];

  async function run(args: string[]): Promise<void> {
    vi.spyOn(process, 'cwd').mockReturnValue(portfolio);
    out = [];
    err = [];
    vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void out.push(a.map(String).join(' ')));
    vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => void err.push(a.map(String).join(' ')));
    vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    await ovwCommand().parseAsync(args, { from: 'user' });
  }

  it('exits non-zero outside portfolio mode', async () => {
    standardFixture({ mode: null });
    await run(['--portfolio']);
    expect(err).toEqual(['--portfolio requires mode: portfolio in oprim/config.yaml']);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('prints JSON with the view keys', async () => {
    standardFixture();
    await run(['--portfolio', '--json']);
    const parsed = JSON.parse(out.join('\n'));
    expect(Object.keys(parsed)).toEqual(expect.arrayContaining(['products', 'dependencies', 'coverage', 'hygiene']));
  });

  it('writes oprim/portfolio-view.md', async () => {
    standardFixture({ okf: true });
    await run(['--portfolio', '--write']);
    const md = fs.readFileSync(path.join(portfolio, 'oprim', 'portfolio-view.md'), 'utf-8');
    expect(md.startsWith('---\ntype: portfolio-view\n')).toBe(true);
    expect(out).toEqual(['Written: oprim/portfolio-view.md']);
  });

  it('rejects --json without --portfolio', async () => {
    standardFixture();
    await run(['--json']);
    expect(err[0]).toContain('only supported with --portfolio');
  });
});
