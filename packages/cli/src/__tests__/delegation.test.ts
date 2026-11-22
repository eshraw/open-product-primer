// BET-078 — two-way delegation links between portfolio bets and product bets.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkDelegationLinks,
  findDelegations,
  parseDelegatedTo,
  qualifierNamesPortfolio,
} from '../lib/portfolio/delegation';
import { buildPortfolioView } from '../lib/portfolio/view';
import { renderPortfolioTerminal } from '../lib/portfolio/render';
import { checkCrossProductRefs } from '../lib/portfolio/refs';
import { loadWorkflowSchema, workflowIdsFor } from '../lib/workflow-schema';
import type { Check } from '../lib/integrity';
import { validateCommand } from '../commands/validate';

let tmpRoot: string;
let portfolio: string;
let cacheDir: string;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-delegate-'));
  portfolio = path.join(tmpRoot, 'acme');
  cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-delegate-cache-'));
  process.env['OPRIM_REMOTE_CONTEXT_CACHE_DIR'] = cacheDir;
  process.env['OPRIM_REMOTE_CONTEXT_THROTTLE_MS'] = '0';
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  fs.rmSync(cacheDir, { recursive: true, force: true });
  delete process.env['OPRIM_REMOTE_CONTEXT_CACHE_DIR'];
  delete process.env['OPRIM_REMOTE_CONTEXT_THROTTLE_MS'];
});

// ─── fixtures ────────────────────────────────────────────────────────────────

function writeBet(root: string, state: 'pending' | 'archived', dir: string, links: string[], decision = 'Build now'): void {
  const betDir = path.join(root, 'oprim', 'bets', state, dir);
  fs.mkdirSync(betDir, { recursive: true });
  fs.writeFileSync(
    path.join(betDir, 'bet-decision.md'),
    [`# Decision: ${dir.slice(0, 7)}`, '', '## Status', `- Decision: ${decision}`, '', '## Links', '- PDRs: None', ...links, ''].join('\n')
  );
}

function writeWorkspace(root: string, name: string, sequence = 'now: []\n', config = 'version: 1\n'): void {
  fs.mkdirSync(path.join(root, '.oprim-context'), { recursive: true });
  fs.writeFileSync(path.join(root, '.oprim-context', 'context.yaml'), `name: ${name}\nversion: "1"\n`);
  fs.mkdirSync(path.join(root, 'oprim'), { recursive: true });
  fs.writeFileSync(path.join(root, 'oprim', 'sequence.yaml'), sequence);
  fs.writeFileSync(path.join(root, 'oprim', 'config.yaml'), config);
}

/** A local product that registers the portfolio as `registeredAs` (default `acme-portfolio`, ≠ identity `acme`). */
function product(name: string, sequence = 'now: []\n', registeredAs = 'acme-portfolio'): string {
  const dir = path.join(tmpRoot, name);
  const config = yaml.dump({ version: 1, remote_context: { enabled: true, sources: [{ name: registeredAs, path: '../acme' }] } });
  writeWorkspace(dir, name, sequence, config);
  return dir;
}

function writePortfolio(products: string[]): void {
  const config =
    'version: 1\nmode: portfolio\n' +
    yaml.dump({
      remote_context: { enabled: true, sources: products.map((p) => ({ name: p, path: `../${p}` })) },
      products: products.map((source) => ({ source })),
    });
  writeWorkspace(portfolio, 'acme', 'now:\n  - id: BET-004\n    title: Payments\n', config);
}

function run(): Check[] {
  const checks: Check[] = [];
  checkDelegationLinks(portfolio, checks);
  return checks;
}

const failures = (checks: Check[]): Check[] => checks.filter((c) => !c.pass);

// ─── parsing ─────────────────────────────────────────────────────────────────

describe('parseDelegatedTo', () => {
  it('accepts qualified BET refs and <product>:pending-handoff, ignores everything else', () => {
    const parsed = parseDelegatedTo(['checkout:BET-031', 'search:pending-handoff', 'BET-002', 'None', 'checkout:PDR-001']);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({ source: 'checkout', id: 'BET-031' });
    expect(parsed[1]).toEqual({ source: 'search', pendingHandoff: true });
  });

  it('findDelegations reads one entry per product, across lines and comma lists', () => {
    writePortfolio(['checkout', 'search']);
    writeBet(portfolio, 'pending', 'BET-004-payments', [
      '- Delegated to: checkout:BET-031',
      '- Delegated to: search:pending-handoff',
    ]);
    writeBet(portfolio, 'pending', 'BET-005-other', ['- Delegated to: `checkout:BET-032`, None']);
    expect(findDelegations(portfolio).map((d) => [d.portfolioBet, 'raw' in d.target ? d.target.raw : 'handoff'])).toEqual([
      ['BET-004', 'checkout:BET-031'],
      ['BET-004', 'handoff'],
      ['BET-005', 'checkout:BET-032'],
    ]);
  });
});

// ─── validate check ──────────────────────────────────────────────────────────

describe('checkDelegationLinks', () => {
  it('passes a matching pair, comparing the back-link qualifier by identity rather than string', () => {
    const checkout = product('checkout');
    writePortfolio(['checkout']);
    writeBet(portfolio, 'pending', 'BET-004-payments', ['- Delegated to: checkout:BET-031']);
    writeBet(checkout, 'pending', 'BET-031-wallet', ['- Delegated from: acme-portfolio:BET-004']);

    expect(qualifierNamesPortfolio(checkout, 'acme-portfolio', portfolio)).toBe(true);
    expect(qualifierNamesPortfolio(checkout, 'someone-else', portfolio)).toBe(false);

    const checks = run();
    expect(failures(checks)).toEqual([]);
    expect(checks.map((c) => c.name)).toContain('delegation: BET-004 ↔ checkout:BET-031 (pending)');
  });

  it('also accepts the portfolio identity name as qualifier', () => {
    const checkout = product('checkout');
    writePortfolio(['checkout']);
    writeBet(portfolio, 'pending', 'BET-004-payments', ['- Delegated to: checkout:BET-031']);
    writeBet(checkout, 'pending', 'BET-031-wallet', ['- Delegated from: acme:BET-004']);
    expect(failures(run())).toEqual([]);
  });

  it('back-link missing on the product side is a required failure', () => {
    const checkout = product('checkout');
    writePortfolio(['checkout']);
    writeBet(portfolio, 'pending', 'BET-004-payments', ['- Delegated to: checkout:BET-031']);
    writeBet(checkout, 'pending', 'BET-031-wallet', []);

    expect(failures(run())).toEqual([
      expect.objectContaining({ name: 'delegation: checkout:BET-031 has no back-link to BET-004', required: true }),
    ]);
  });

  it('back-link pointing at another portfolio bet is a required failure naming both IDs', () => {
    const checkout = product('checkout');
    writePortfolio(['checkout']);
    writeBet(portfolio, 'pending', 'BET-004-payments', ['- Delegated to: checkout:BET-031']);
    writeBet(checkout, 'pending', 'BET-031-wallet', ['- Delegated from: acme-portfolio:BET-009']);

    const [f] = failures(run());
    expect(f.required).toBe(true);
    expect(f.name).toContain('BET-004');
    expect(f.name).toContain('acme-portfolio:BET-009');
  });

  it('a back-link qualifier that resolves to a different workspace does not count', () => {
    const checkout = product('checkout', 'now: []\n', 'elsewhere');
    writePortfolio(['checkout']);
    // `elsewhere` points at ../acme in the fixture; repoint it at a different workspace.
    writeWorkspace(path.join(tmpRoot, 'other'), 'other');
    const cfg = yaml.dump({ version: 1, remote_context: { enabled: true, sources: [{ name: 'elsewhere', path: '../other' }] } });
    fs.writeFileSync(path.join(checkout, 'oprim', 'config.yaml'), cfg);
    writeBet(portfolio, 'pending', 'BET-004-payments', ['- Delegated to: checkout:BET-031']);
    writeBet(checkout, 'pending', 'BET-031-wallet', ['- Delegated from: elsewhere:BET-004']);

    expect(failures(run())[0]).toMatchObject({ required: true });
  });

  it('a missing product bet is a required failure', () => {
    product('checkout');
    writePortfolio(['checkout']);
    writeBet(portfolio, 'pending', 'BET-004-payments', ['- Delegated to: checkout:BET-031']);
    expect(failures(run())).toEqual([
      expect.objectContaining({ name: 'delegation: checkout:BET-031 not found in checkout', required: true }),
    ]);
  });

  it('a delegation to an unregistered source is a required failure', () => {
    writePortfolio([]);
    writeBet(portfolio, 'pending', 'BET-004-payments', ['- Delegated to: nowhere:pending-handoff']);
    expect(failures(run())).toEqual([expect.objectContaining({ required: true })]);
    expect(failures(run())[0].name).toContain('unknown source "nowhere"');
  });

  it('a pending handoff passes, annotated pending handoff', () => {
    product('search');
    writePortfolio(['search']);
    writeBet(portfolio, 'pending', 'BET-006-search', ['- Delegated to: search:pending-handoff']);
    const checks = run();
    expect(failures(checks)).toEqual([]);
    expect(checks.map((c) => c.name)).toEqual(['delegation: BET-006 → search (pending handoff)']);
    // The refs check never sees pending-handoff as a dangling reference either.
    const refChecks: Check[] = [];
    checkCrossProductRefs(portfolio, refChecks);
    expect(failures(refChecks)).toEqual([]);
  });

  it('checks every product of a multi-product delegation independently', () => {
    const checkout = product('checkout');
    const search = product('search');
    writePortfolio(['checkout', 'search']);
    writeBet(portfolio, 'pending', 'BET-004-payments', ['- Delegated to: checkout:BET-031, search:BET-014']);
    writeBet(checkout, 'pending', 'BET-031-wallet', ['- Delegated from: acme-portfolio:BET-004']);
    writeBet(search, 'pending', 'BET-014-index', []);

    const checks = run();
    expect(checks.filter((c) => c.pass).map((c) => c.name)).toEqual(['delegation: BET-004 ↔ checkout:BET-031 (pending)']);
    expect(failures(checks).map((c) => c.name)).toEqual(['delegation: search:BET-014 has no back-link to BET-004']);
  });

  it('an archived product bet still satisfies the pair', () => {
    const checkout = product('checkout');
    writePortfolio(['checkout']);
    writeBet(portfolio, 'pending', 'BET-004-payments', ['- Delegated to: checkout:BET-031']);
    writeBet(checkout, 'archived', 'BET-031-wallet', ['- Delegated from: acme-portfolio:BET-004']);
    const checks = run();
    expect(failures(checks)).toEqual([]);
    expect(checks[0].name).toContain('(archived)');
  });

  it('a product back-link with no forward link is a required failure (pair on one side only)', () => {
    const checkout = product('checkout');
    writePortfolio(['checkout']);
    writeBet(portfolio, 'pending', 'BET-004-payments', []);
    writeBet(checkout, 'pending', 'BET-031-wallet', ['- Delegated from: acme-portfolio:BET-004']);
    expect(failures(run())).toEqual([
      expect.objectContaining({
        name: 'delegation: checkout:BET-031 says "Delegated from: acme-portfolio:BET-004" but BET-004 does not delegate to it',
        required: true,
      }),
    ]);
  });

  it('an applied handoff not yet linked is a non-required nudge to run --link', () => {
    const search = product('search');
    writePortfolio(['search']);
    writeBet(portfolio, 'pending', 'BET-006-search', ['- Delegated to: search:pending-handoff']);
    writeBet(search, 'pending', 'BET-014-index', ['- Delegated from: acme-portfolio:BET-006']);
    const [f] = failures(run());
    expect(f).toMatchObject({ required: false });
    expect(f.note).toBe('run /oprim:delegate BET-006 --to search --link BET-014');
  });

  it('oprim validate exits non-zero on a broken pair in a portfolio workspace', async () => {
    const checkout = product('checkout');
    writePortfolio(['checkout']);
    writeBet(portfolio, 'pending', 'BET-004-payments', ['- Delegated to: checkout:BET-031']);
    writeBet(checkout, 'pending', 'BET-031-wallet', []);
    vi.spyOn(process, 'cwd').mockReturnValue(portfolio);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await validateCommand().parseAsync(['--json'], { from: 'user' });
    expect(process.exitCode).toBe(1);
    expect(log.mock.calls.map((c) => String(c[0])).join('\n')).toContain('has no back-link to BET-004');
  });
});

// ─── read-through status ─────────────────────────────────────────────────────

function snapshotTree(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string): void => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else out[path.relative(dir, full)] = fs.readFileSync(full, 'utf-8');
    }
  };
  walk(dir);
  return out;
}

describe('delegated status in the portfolio view', () => {
  it('follows the product bet live: archiving it changes the view without touching any portfolio file', () => {
    const checkout = product('checkout', 'now:\n  - id: BET-031\n    title: Wallet\n');
    product('search');
    writePortfolio(['checkout', 'search']);
    writeBet(portfolio, 'pending', 'BET-004-payments', ['- Delegated to: checkout:BET-031, search:pending-handoff']);
    writeBet(checkout, 'pending', 'BET-031-wallet', ['- Delegated from: acme-portfolio:BET-004'], 'Defer');

    const before = snapshotTree(portfolio);
    expect(buildPortfolioView(portfolio, '2027-01-01').delegations).toEqual([
      { bet: 'BET-004', target: 'checkout:BET-031', state: 'now', decision: 'Defer' },
      { bet: 'BET-004', target: 'search', state: 'pending handoff' },
    ]);

    // The product archives its bet: moves the directory and drops it from the board.
    fs.mkdirSync(path.join(checkout, 'oprim', 'bets', 'archived'), { recursive: true });
    fs.renameSync(
      path.join(checkout, 'oprim', 'bets', 'pending', 'BET-031-wallet'),
      path.join(checkout, 'oprim', 'bets', 'archived', 'BET-031-wallet')
    );
    fs.writeFileSync(path.join(checkout, 'oprim', 'sequence.yaml'), 'now: []\n');

    const view = buildPortfolioView(portfolio, '2027-01-01');
    expect(view.delegations[0]).toEqual({ bet: 'BET-004', target: 'checkout:BET-031', state: 'archived' });
    expect(renderPortfolioTerminal(view).join('\n')).toContain('BET-004 delegated → checkout:BET-031 (archived)');
    expect(snapshotTree(portfolio)).toEqual(before);
  });
});

// ─── workflow ────────────────────────────────────────────────────────────────

describe('delegate workflow', () => {
  it('is portfolio-only and installed as a Claude command', () => {
    const schema = loadWorkflowSchema('delegate');
    expect(schema.modes).toEqual(['portfolio']);
    expect(workflowIdsFor('claude-skill', 'portfolio')).toContain('delegate');
    expect(workflowIdsFor('claude-skill', 'product')).not.toContain('delegate');
  });

  it('every rendering forbids cache writes and git writes, and requires confirmation', () => {
    const dir = path.join(__dirname, '..', 'workflows');
    for (const file of ['delegate.template.md', 'delegate.inline.md', 'delegate.cursor-command.md']) {
      const body = fs.readFileSync(path.join(dir, file), 'utf-8');
      expect(body, file).toContain('~/.oprim/remote-context-cache/');
      expect(body, file).toMatch(/never run git commit|`git commit`/i);
      expect(body, file).toMatch(/push/);
      expect(body, file).toContain('(y/N)');
      expect(body, file).toContain('pending-handoff');
      expect(body, file).toContain('outputs/handoffs/<product>-BET-NNN.md');
      expect(body, file).toContain('--link');
    }
  });
});
