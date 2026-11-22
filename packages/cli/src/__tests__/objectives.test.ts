// BET-077 — objectives as first-class artifacts, the oprim-objective workflow, and bet → objective links.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initCommand } from '../commands/init';
import { validateCommand } from '../commands/validate';
import { checkbox, confirm, select } from '@inquirer/prompts';
import { listObjectives, checkObjectiveLinks, hasPortfolioContext, isInactiveObjectiveStatus } from '../lib/portfolio/objectives';
import { objectiveTemplate } from '../lib/portfolio/templates';
import { checkCrossProductRefs, collectRefs, RefResolver } from '../lib/portfolio/refs';
import { renderSkillBody } from '../lib/workflow-renderer';
import type { Check } from '../lib/integrity';

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn().mockResolvedValue([]),
  confirm: vi.fn().mockResolvedValue(false),
  select: vi.fn().mockResolvedValue('openspec'),
}));

let tmpRoot: string;
let project: string;
const p = (...parts: string[]): string => path.join(project, ...parts);

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-objectives-'));
  project = path.join(tmpRoot, 'project');
  fs.mkdirSync(path.join(project, 'oprim'), { recursive: true });
  vi.spyOn(process, 'cwd').mockReturnValue(project);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  process.exitCode = undefined;
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  vi.restoreAllMocks();
  vi.mocked(confirm).mockReset().mockResolvedValue(false);
  vi.mocked(checkbox).mockReset().mockResolvedValue([]);
  vi.mocked(select).mockReset().mockResolvedValue('openspec');
  process.exitCode = undefined;
});

// ─── fixtures ────────────────────────────────────────────────────────────────

function writeObjective(root: string, file: string, status: string, opts: { okf?: boolean; period?: string } = {}): void {
  const id = file.match(/^OBJ-\d+/)![0];
  const period = opts.period ?? '2027-Q1';
  const fm = opts.okf
    ? `---\ntype: objective\ntitle: "T"\ndescription: "d"\ntags: []\ntimestamp: 2026-11-21\nperiod: ${period}\nstatus: ${status}\n---\n\n`
    : '';
  fs.mkdirSync(path.join(root, 'oprim', 'objectives'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'oprim', 'objectives', file),
    `${fm}# ${id}: Grow repeat purchases\n\n## Status\n${status}\n\n## Period\n${period}\n\n## Key results\n- x\n\n## Rationale\ny\n`
  );
}

function writeBet(dir: string, links: string[]): void {
  const betDir = p('oprim', 'bets', 'pending', dir);
  fs.mkdirSync(betDir, { recursive: true });
  fs.writeFileSync(
    path.join(betDir, 'bet-decision.md'),
    `# Decision: ${dir}\n\n## Status\n- Decision: Build now\n\n## Links\n${links.join('\n')}\n- OpenSpec change: <to be filled when promoted>\n`
  );
}

function writeConfig(body: string): void {
  fs.writeFileSync(p('oprim', 'config.yaml'), `version: 1\n${body}`);
}

function makeSource(name: string, mode?: 'portfolio'): string {
  const dir = path.join(tmpRoot, name);
  fs.mkdirSync(path.join(dir, '.oprim-context'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.oprim-context', 'context.yaml'),
    `name: ${name}\nversion: "1"\n${mode ? `mode: ${mode}\n` : ''}`
  );
  fs.mkdirSync(path.join(dir, 'oprim'), { recursive: true });
  return dir;
}

function registerSources(sources: Array<{ name: string; path: string }>, extra = ''): void {
  const list = sources.map((s) => `    - name: ${s.name}\n      path: ${s.path}\n`).join('');
  writeConfig(`${extra}remote_context:\n  enabled: true\n  sources:\n${list}`);
}

function run(): Check[] {
  const checks: Check[] = [];
  checkObjectiveLinks(project, checks);
  return checks;
}

const objectiveChecks = (checks: Check[]): Check[] => checks.filter((c) => c.name.startsWith('objective:'));

// ─── artifact ────────────────────────────────────────────────────────────────

describe('objective artifact', () => {
  it('template: OKF off has no frontmatter; OKF on carries type, period and status', () => {
    expect(objectiveTemplate(false).startsWith('# OBJ-XXX:')).toBe(true);
    const okf = objectiveTemplate(true);
    expect(okf.startsWith('---\n')).toBe(true);
    const fm = okf.split('\n---\n')[0];
    for (const key of ['type: objective', 'title:', 'description:', 'tags:', 'timestamp:', 'period:', 'status: Active']) {
      expect(fm).toContain(key);
    }
    for (const h of ['## Status', '## Period', '## Key results', '## Rationale']) expect(okf).toContain(h);
  });

  it('init --mode portfolio scaffolds oprim/templates/objective.md; product init does not', async () => {
    vi.mocked(confirm).mockResolvedValueOnce(true).mockResolvedValue(false);
    await initCommand().parseAsync(['--name', 'acme', '--mode', 'portfolio'], { from: 'user' });
    expect(fs.readFileSync(p('oprim', 'templates', 'objective.md'), 'utf-8')).toBe(objectiveTemplate(true));

    fs.rmSync(project, { recursive: true, force: true });
    fs.mkdirSync(project, { recursive: true });
    await initCommand().parseAsync(['--name', 'shop'], { from: 'user' });
    expect(fs.existsSync(p('oprim', 'templates', 'objective.md'))).toBe(false);
  });

  it('listObjectives parses OKF and non-OKF files, sorted by ID, ignoring non-objective files', () => {
    writeObjective(project, 'OBJ-010-later.md', 'Active', { period: '2027-Q2' });
    writeObjective(project, 'OBJ-002-grow.md', 'Superseded by OBJ-010', { okf: true });
    fs.writeFileSync(p('oprim', 'objectives', '.gitkeep'), '');
    fs.writeFileSync(p('oprim', 'objectives', 'README.md'), '# notes');

    expect(listObjectives(project)).toEqual([
      expect.objectContaining({ id: 'OBJ-002', title: 'Grow repeat purchases', status: 'Superseded by OBJ-010', period: '2027-Q1' }),
      expect.objectContaining({ id: 'OBJ-010', status: 'Active', period: '2027-Q2' }),
    ]);
  });

  it('listObjectives falls back to frontmatter when a body section is missing', () => {
    fs.mkdirSync(p('oprim', 'objectives'), { recursive: true });
    fs.writeFileSync(
      p('oprim', 'objectives', 'OBJ-001-x.md'),
      '---\ntype: objective\ntitle: "From FM"\nperiod: 2027-H1\nstatus: Achieved\n---\n\n# OBJ-001: From heading\n'
    );
    expect(listObjectives(project)).toEqual([
      expect.objectContaining({ id: 'OBJ-001', title: 'From heading', status: 'Achieved', period: '2027-H1' }),
    ]);
  });

  it('only Achieved, Dropped and Superseded statuses are inactive', () => {
    for (const s of ['Achieved', 'Dropped', 'Superseded by OBJ-004', 'dropped']) expect(isInactiveObjectiveStatus(s)).toBe(true);
    for (const s of ['Active', '', undefined, 'At risk']) expect(isInactiveObjectiveStatus(s)).toBe(false);
  });
});

// ─── workflow ────────────────────────────────────────────────────────────────

describe('oprim-objective workflow', () => {
  async function init(mode: 'product' | 'portfolio'): Promise<void> {
    const args = ['--name', 'acme', '--agent', 'claude', '--agent', 'cursor', '--agent', 'codex', '--agent', 'poolside'];
    if (mode === 'portfolio') args.push('--mode', 'portfolio');
    await initCommand().parseAsync(args, { from: 'user' });
  }

  it('is installed for every agent surface in portfolio mode', async () => {
    await init('portfolio');
    expect(fs.existsSync(p('.claude', 'skills', 'oprim-objective', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(p('.cursor', 'skills', 'oprim-objective', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(p('.cursor', 'commands', 'oprim-objective.md'))).toBe(true);
    expect(fs.existsSync(p('.poolside', 'skills', 'oprim-objective', 'SKILL.md'))).toBe(true);
    expect(fs.readFileSync(p('AGENTS.md'), 'utf-8')).toContain('### Objective authoring (oprim-objective)');
  });

  it('is not installed for any agent in product mode', async () => {
    await init('product');
    expect(fs.existsSync(p('.claude', 'skills', 'oprim-objective'))).toBe(false);
    expect(fs.existsSync(p('.cursor', 'skills', 'oprim-objective'))).toBe(false);
    expect(fs.existsSync(p('.cursor', 'commands', 'oprim-objective.md'))).toBe(false);
    expect(fs.existsSync(p('.poolside', 'skills', 'oprim-objective'))).toBe(false);
    expect(fs.readFileSync(p('AGENTS.md'), 'utf-8')).not.toContain('oprim-objective');
  });

  it('assigns max+1 IDs, honours rules.objective, and supersedes by rewriting Status', () => {
    const body = renderSkillBody('objective');
    expect(body).toContain('`OBJ-(\\d+)-`');
    expect(body).toMatch(/Assign max\+1, zero-padded to 3 digits/);
    expect(body).toContain('rules.objective');
    expect(body).toContain('Superseded by OBJ-NNN');
    expect(body).toContain('oprim/templates/objective.md');
  });

  it('the bet workflow adds an Objectives line only where a portfolio exists', () => {
    const body = renderSkillBody('bet');
    expect(body).toContain('- Objectives: <OBJ refs or "None"');
    expect(body).toMatch(/mode: portfolio`, or `oprim context list` labels at least one registered source `portfolio`/);
    expect(body).toMatch(/Otherwise skip it and leave the `- Objectives:` line out/);
  });
});

// ─── links and checks ────────────────────────────────────────────────────────

describe('checkObjectiveLinks', () => {
  it('product workspace with no portfolio source stays quiet about unlinked bets', () => {
    writeConfig('remote_context:\n  enabled: false\n  sources: []\n');
    writeBet('BET-001-a', ['- PDRs: None']);
    expect(hasPortfolioContext(project)).toBe(false);
    expect(run()).toEqual([]);
  });

  it('product workspace whose source is a plain product (not a portfolio) stays quiet', () => {
    makeSource('checkout');
    registerSources([{ name: 'checkout', path: '../checkout' }]);
    writeBet('BET-001-a', ['- PDRs: None']);
    expect(hasPortfolioContext(project)).toBe(false);
    expect(run()).toEqual([]);
  });

  it('product workspace with a portfolio source warns on an unlinked bet (non-required)', () => {
    makeSource('acme-portfolio', 'portfolio');
    registerSources([{ name: 'acme-portfolio', path: '../acme-portfolio' }]);
    writeBet('BET-004-a', ['- PDRs: None']);
    writeBet('BET-005-b', ['- Objectives: None']);
    expect(hasPortfolioContext(project)).toBe(true);
    expect(run()).toEqual([
      expect.objectContaining({ name: 'objective: BET-004 is not linked to any objective', pass: false, required: false }),
      expect.objectContaining({ name: 'objective: BET-005 is not linked to any objective', pass: false, required: false }),
    ]);
  });

  it('product bet citing a portfolio objective resolves cleanly in validate', async () => {
    const portfolio = makeSource('acme-portfolio', 'portfolio');
    writeObjective(portfolio, 'OBJ-002-grow.md', 'Active');
    registerSources([{ name: 'acme-portfolio', path: '../acme-portfolio' }]);
    writeBet('BET-004-a', ['- Objectives: acme-portfolio:OBJ-002']);

    const checks = run();
    expect(checks).toEqual([expect.objectContaining({ pass: true, name: 'objective: 1 pending bet(s) linked to an active objective' })]);

    await validateCommand().parseAsync(['--json'], { from: 'user' });
    expect(process.exitCode).toBeUndefined();
  });

  it('portfolio workspace warns on a pending bet with no Objectives line', () => {
    writeConfig('mode: portfolio\n');
    writeBet('BET-007-x', ['- PDRs: PDR-001']);
    expect(run()).toEqual([
      expect.objectContaining({ name: 'objective: BET-007 is not linked to any objective', required: false, pass: false }),
    ]);
  });

  it('a bet linked only to dropped/achieved objectives warns, naming them', () => {
    writeConfig('mode: portfolio\n');
    writeObjective(project, 'OBJ-003-old.md', 'Dropped');
    writeObjective(project, 'OBJ-004-done.md', 'Achieved', { okf: true });
    writeBet('BET-008-x', ['- Objectives: OBJ-003, OBJ-004']);
    const [check] = run();
    expect(check).toMatchObject({ name: 'objective: BET-008 serves no active objective', pass: false, required: false });
    expect(check.note).toContain('OBJ-003 (Dropped)');
    expect(check.note).toContain('OBJ-004 (Achieved)');
  });

  it('one active objective among inactive ones is enough', () => {
    writeConfig('mode: portfolio\n');
    writeObjective(project, 'OBJ-003-old.md', 'Superseded by OBJ-005');
    writeObjective(project, 'OBJ-005-new.md', 'Active');
    writeBet('BET-008-x', ['- Objectives: OBJ-003, `OBJ-005`']);
    expect(run()).toEqual([expect.objectContaining({ pass: true })]);
  });

  it('a dangling local objective is a required failure, also in product mode', async () => {
    writeConfig('mode: portfolio\n');
    writeBet('BET-009-x', ['- Objectives: OBJ-009']);
    expect(run()).toEqual([
      expect.objectContaining({
        name: 'objective: BET-009 references OBJ-009, which does not exist',
        pass: false,
        required: true,
      }),
    ]);

    await validateCommand().parseAsync(['--json'], { from: 'user' });
    expect(process.exitCode).toBe(1);

    writeConfig('');
    expect(run().map((c) => c.name)).toEqual(['objective: BET-009 references OBJ-009, which does not exist']);
  });

  it('a dangling qualified objective is reported once — by the cross-product ref check only', () => {
    makeSource('acme-portfolio', 'portfolio');
    registerSources([{ name: 'acme-portfolio', path: '../acme-portfolio' }]);
    writeBet('BET-004-a', ['- Objectives: acme-portfolio:OBJ-099']);

    const checks: Check[] = [];
    const resolver = new RefResolver(project);
    checkCrossProductRefs(project, checks, resolver);
    checkObjectiveLinks(project, checks, resolver);

    const mentions = checks.filter((c) => !c.pass && `${c.name} ${c.note ?? ''}`.includes('OBJ-099'));
    expect(mentions).toEqual([
      expect.objectContaining({ name: 'ref: acme-portfolio:OBJ-099 not found in acme-portfolio', required: true }),
    ]);
    expect(objectiveChecks(checks)).toEqual([]);
    expect(resolver.resolvedSourceCount).toBe(1);
  });
});

describe('products[].objectives', () => {
  it('qualified refs are collected for the cross-product check; local refs are checked here', () => {
    makeSource('checkout');
    writeObjective(project, 'OBJ-001-grow.md', 'Active');
    registerSources(
      [{ name: 'checkout', path: '../checkout' }],
      'mode: portfolio\nproducts:\n  - source: checkout\n    objectives: [OBJ-001, OBJ-002, checkout:OBJ-003]\n'
    );

    expect(collectRefs(project).map((c) => c.ref.raw)).toEqual(['OBJ-001', 'OBJ-002', 'checkout:OBJ-003']);

    const checks: Check[] = [];
    const resolver = new RefResolver(project);
    checkCrossProductRefs(project, checks, resolver);
    checkObjectiveLinks(project, checks, resolver);
    expect(checks.filter((c) => !c.pass).map((c) => c.name)).toEqual([
      'ref: checkout:OBJ-003 not found in checkout',
      'objective: products checkout references OBJ-002, which does not exist',
    ]);
  });
});
