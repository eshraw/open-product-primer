// BET-075 — portfolio workspace mode and scaffold.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initCommand } from '../commands/init';
import { updateCommand } from '../commands/update';
import { checkbox, confirm, select } from '@inquirer/prompts';
import { readWorkspaceMode } from '../lib/workspace-mode';
import { mergePortfolioConfigSchema } from '../lib/config-merge';
import { checkPortfolioNoSpecs, checkPortfolioScaffold, runWorkspaceModeChecks } from '../lib/portfolio/checks';
import { assembleOprimWorkspaceContent } from '../lib/remote-context';
import { installAgentSkills, codexInstructions } from '../lib/install-agent';
import { loadWorkflowSchema, workflowIdsFor } from '../lib/workflow-schema';
import type { Check } from '../lib/integrity';

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn().mockResolvedValue([]),
  confirm: vi.fn().mockResolvedValue(false),
  select: vi.fn().mockResolvedValue('openspec'),
}));

let tmpDir: string;
const p = (...parts: string[]): string => path.join(tmpDir, ...parts);
const read = (...parts: string[]): string => fs.readFileSync(p(...parts), 'utf-8');

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-portfolio-'));
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
  vi.mocked(confirm).mockReset().mockResolvedValue(false);
  vi.mocked(checkbox).mockReset().mockResolvedValue([]);
  vi.mocked(select).mockReset().mockResolvedValue('openspec');
});

async function initPortfolio(okf = false, agents: string[] = ['claude']): Promise<void> {
  vi.mocked(confirm).mockResolvedValueOnce(okf).mockResolvedValue(false);
  const args = ['--name', 'acme', '--mode', 'portfolio'];
  for (const a of agents) args.push('--agent', a);
  await initCommand().parseAsync(args, { from: 'user' });
}

describe('oprim init --mode portfolio', () => {
  it('scaffolds the product workspace plus the portfolio layout, without a framework prompt', async () => {
    await initPortfolio();

    // product scaffold still there
    for (const rel of ['oprim/config.yaml', 'oprim/sequence.yaml', 'oprim/templates/bet-decision.md', 'oprim/decisions']) {
      expect(fs.existsSync(p(rel)), rel).toBe(true);
    }
    // portfolio layout
    for (const rel of [
      'oprim/handbook/overview.md',
      'oprim/handbook/principles.md',
      'oprim/handbook/glossary.md',
      'oprim/objectives',
      'STATE.md',
      'inbox.md',
      'wiki/log.md',
      'wiki/people',
      'wiki/products',
      'wiki/decisions',
      'outputs',
    ]) {
      expect(fs.existsSync(p(rel)), rel).toBe(true);
    }

    const config = read('oprim', 'config.yaml');
    expect(config).toMatch(/^version: 1\nmode: portfolio\n/);
    expect(config).toContain('  spec_framework: none\n');
    expect(config).toMatch(/^products: \[\]$/m);
    expect(readWorkspaceMode(tmpDir)).toBe('portfolio');
    expect(vi.mocked(select)).not.toHaveBeenCalled();
  });

  it('re-running preserves human-written files', async () => {
    await initPortfolio();
    fs.writeFileSync(p('oprim', 'handbook', 'overview.md'), '# Ours\n', 'utf-8');
    fs.writeFileSync(p('inbox.md'), '- call Sam\n', 'utf-8');

    await initPortfolio();

    expect(read('oprim', 'handbook', 'overview.md')).toBe('# Ours\n');
    expect(read('inbox.md')).toBe('- call Sam\n');
  });

  it('re-running plain `oprim init` keeps portfolio mode', async () => {
    await initPortfolio();
    vi.mocked(confirm).mockReset().mockResolvedValue(false);
    await initCommand().parseAsync(['--name', 'acme', '--agent', 'claude'], { from: 'user' });

    expect(readWorkspaceMode(tmpDir)).toBe('portfolio');
    expect(vi.mocked(select)).not.toHaveBeenCalled();
  });

  it('OKF on: handbook and personal files carry typed frontmatter', async () => {
    await initPortfolio(true);
    const glossary = read('oprim', 'handbook', 'glossary.md');
    expect(glossary.startsWith('---\n')).toBe(true);
    expect(glossary).toContain('type: handbook');
    expect(read('STATE.md')).toContain('type: pm-state');
    expect(read('inbox.md')).toContain('type: inbox');
    expect(read('wiki', 'log.md')).toContain('type: wiki-log');
  });

  it('OKF off: no frontmatter', async () => {
    await initPortfolio(false);
    for (const rel of ['oprim/handbook/glossary.md', 'STATE.md', 'inbox.md', 'wiki/log.md']) {
      expect(read(rel).startsWith('# '), rel).toBe(true);
    }
  });

  it('rejects an unknown mode and refuses to switch an existing workspace', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit ${code}`);
    }) as never);

    await expect(initCommand().parseAsync(['--mode', 'team'], { from: 'user' })).rejects.toThrow('exit 1');
    expect(fs.existsSync(p('oprim'))).toBe(false);

    await initCommand().parseAsync(['--name', 'acme', '--agent', 'claude'], { from: 'user' }); // product
    await expect(initCommand().parseAsync(['--mode', 'portfolio'], { from: 'user' })).rejects.toThrow('exit 1');
    expect(fs.existsSync(p('STATE.md'))).toBe(false);
    exit.mockRestore();
  });

  it('does not install the oprim-spec skill even if spec_framework is native', async () => {
    await initPortfolio(false, ['claude', 'cursor']);
    installAgentSkills('claude', tmpDir, 'native');
    installAgentSkills('cursor', tmpDir, 'native');
    expect(fs.existsSync(p('.claude', 'skills', 'oprim-spec'))).toBe(false);
    expect(fs.existsSync(p('.cursor', 'skills', 'oprim-spec'))).toBe(false);
    expect(fs.existsSync(p('.claude', 'skills', 'oprim-bet', 'SKILL.md'))).toBe(true);
  });
});

describe('oprim update — portfolio config merge', () => {
  it('appends products: [] to a portfolio config, leaving every other line untouched', async () => {
    await initPortfolio();
    const configPath = p('oprim', 'config.yaml');
    const withoutProducts = read('oprim', 'config.yaml').replace(/^products: \[\]\n/m, '');
    fs.writeFileSync(configPath, withoutProducts, 'utf-8');

    vi.mocked(confirm).mockReset().mockResolvedValue(false);
    await updateCommand().parseAsync([], { from: 'user' });

    const after = read('oprim', 'config.yaml');
    expect(after).toBe(withoutProducts + 'products: []\n');
    expect(vi.mocked(select)).not.toHaveBeenCalled();
  });

  it('adds nothing portfolio-specific to a product config', async () => {
    vi.mocked(confirm).mockResolvedValue(false);
    await initCommand().parseAsync(['--name', 'shop', '--agent', 'claude'], { from: 'user' });
    await updateCommand().parseAsync([], { from: 'user' });
    const config = read('oprim', 'config.yaml');
    expect(config).not.toMatch(/^mode:/m);
    expect(config).not.toMatch(/^products:/m);
  });

  it('mergePortfolioConfigSchema is a no-op when products already exists', () => {
    const content = 'version: 1\nmode: portfolio\nproducts:\n  - source: checkout\n';
    expect(mergePortfolioConfigSchema(content)).toEqual({ content, changed: false });
  });
});

describe('portfolio checks', () => {
  it('a fresh portfolio workspace passes every mode check', async () => {
    await initPortfolio();
    const checks: Check[] = [];
    runWorkspaceModeChecks(tmpDir, checks);
    expect(checks.length).toBeGreaterThan(0);
    expect(checks.every((c) => c.pass)).toBe(true);
  });

  it('a product workspace gets no mode checks', async () => {
    vi.mocked(confirm).mockResolvedValue(false);
    await initCommand().parseAsync(['--name', 'shop'], { from: 'user' });
    const checks: Check[] = [];
    runWorkspaceModeChecks(tmpDir, checks);
    expect(checks).toEqual([]);
  });

  it('missing personal file is a non-required warning pointing at init --mode portfolio', async () => {
    await initPortfolio();
    fs.rmSync(p('inbox.md'));
    const checks: Check[] = [];
    checkPortfolioScaffold(tmpDir, checks);
    const failed = checks.filter((c) => !c.pass);
    expect(failed).toHaveLength(1);
    expect(failed[0].name).toBe('portfolio: inbox.md is missing');
    expect(failed[0].required).toBe(false);
    expect(failed[0].note).toContain('oprim init --mode portfolio');
  });

  it('spec_framework edited back on is a required failure', async () => {
    await initPortfolio();
    const configPath = p('oprim', 'config.yaml');
    fs.writeFileSync(configPath, read('oprim', 'config.yaml').replace('spec_framework: none', 'spec_framework: native'));
    const checks: Check[] = [];
    checkPortfolioNoSpecs(tmpDir, checks);
    expect(checks).toHaveLength(1);
    expect(checks[0]).toMatchObject({
      name: 'portfolio: spec_framework must be none (portfolio workspaces never hold specs — see PDR-001)',
      pass: false,
      required: true,
    });
  });

  it('a specs/ directory under a pending bet is a required failure', async () => {
    await initPortfolio();
    fs.mkdirSync(p('oprim', 'bets', 'pending', 'BET-001-x', 'specs', 'cap'), { recursive: true });
    const checks: Check[] = [];
    checkPortfolioNoSpecs(tmpDir, checks);
    expect(checks.some((c) => !c.pass && c.required && c.name.includes('BET-001-x'))).toBe(true);
  });

  it('oprim validate exits non-zero on an invalid mode value', async () => {
    const { validateCommand } = await import('../commands/validate');
    fs.mkdirSync(p('oprim'), { recursive: true });
    fs.writeFileSync(p('oprim', 'config.yaml'), 'version: 1\nmode: portfoilo\n');
    const logs: string[] = [];
    vi.mocked(console.log).mockImplementation((msg?: unknown) => void logs.push(String(msg)));
    const prevExit = process.exitCode;
    await validateCommand().parseAsync(['--json'], { from: 'user' });
    expect(process.exitCode).toBe(1);
    process.exitCode = prevExit;
    const report = JSON.parse(logs.join('')) as { checks: Check[] };
    expect(report.checks.map((c) => c.name)).toContain(
      'config: unknown mode "portfoilo" (expected product | portfolio)'
    );
  });
});

describe('remote context export of a portfolio workspace', () => {
  it('includes oprim/ (handbook) but never the root personal files', async () => {
    await initPortfolio();
    fs.writeFileSync(p('inbox.md'), 'SECRET-INBOX\n');
    fs.writeFileSync(p('STATE.md'), 'SECRET-STATE\n');
    fs.writeFileSync(p('wiki', 'log.md'), 'SECRET-WIKI\n');
    fs.writeFileSync(p('outputs', 'draft.md'), 'SECRET-OUTPUT\n');

    const exported = assembleOprimWorkspaceContent(tmpDir);
    expect(exported).toContain('oprim/handbook/overview.md');
    for (const secret of ['SECRET-INBOX', 'SECRET-STATE', 'SECRET-WIKI', 'SECRET-OUTPUT']) {
      expect(exported).not.toContain(secret);
    }
  });
});

describe('mode-gated workflow install', () => {
  function overrideModes(id: string, modes: string): void {
    const bundled = fs.readFileSync(path.join(__dirname, '..', 'workflows', `${id}.schema.yaml`), 'utf-8');
    fs.mkdirSync(p('oprim', 'workflows'), { recursive: true });
    fs.writeFileSync(p('oprim', 'workflows', `${id}.schema.yaml`), bundled + `modes: ${modes}\n`);
  }

  it('bundled schemas: spec-authoring is product-only, PM workflows portfolio-only, the rest both', () => {
    expect(loadWorkflowSchema('spec-authoring').modes).toEqual(['product']);
    expect(loadWorkflowSchema('bet').modes).toEqual(['product', 'portfolio']);
    expect(workflowIdsFor('claude-skill', 'portfolio')).toEqual([
      ...workflowIdsFor('claude-skill', 'product'),
      'capture',
      'triage',
      'ingest',
      'start-day',
      'plan-week',
      'objective',
      'delegate',
      'prioritize',
      'stakeholder-update',
      'roadmap-comms',
      'publish',
    ]);
    expect(workflowIdsFor('claude-agent', 'product')).toEqual([]);
  });

  it('a portfolio-only workflow is skipped in product mode for every agent surface', async () => {
    vi.mocked(confirm).mockResolvedValue(false);
    await initCommand().parseAsync(['--name', 'shop'], { from: 'user' });
    overrideModes('explore', '[portfolio]');

    expect(workflowIdsFor('claude-skill', 'product', tmpDir)).not.toContain('explore');
    for (const agent of ['claude', 'poolside', 'codex'] as const) installAgentSkills(agent, tmpDir);

    expect(fs.existsSync(p('.claude', 'skills', 'oprim-explore'))).toBe(false);
    expect(fs.existsSync(p('.claude', 'commands', 'oprim', 'explore.md'))).toBe(false);
    expect(fs.existsSync(p('.poolside', 'skills', 'oprim-explore'))).toBe(false);
    const agentsMd = read('AGENTS.md');
    expect(agentsMd).not.toContain('### Problem exploration (oprim-explore)');
    expect(codexInstructions()).toContain('### Problem exploration (oprim-explore)'); // bundled product default still has it
  });

  it('a portfolio-only workflow is installed in portfolio mode', async () => {
    await initPortfolio(false, []);
    overrideModes('explore', '[portfolio]');
    installAgentSkills('claude', tmpDir);
    expect(fs.existsSync(p('.claude', 'skills', 'oprim-explore', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(p('.claude', 'commands', 'oprim', 'explore.md'))).toBe(true);
  });

  it('an override without modes/order inherits them from the bundled schema', () => {
    fs.mkdirSync(p('oprim', 'workflows'), { recursive: true });
    const bundled = fs.readFileSync(path.join(__dirname, '..', 'workflows', 'spec-authoring.schema.yaml'), 'utf-8');
    fs.writeFileSync(p('oprim', 'workflows', 'spec-authoring.schema.yaml'), bundled.replace(/^title: null$/m, 'title: Forked'));
    expect(loadWorkflowSchema('spec-authoring', tmpDir).modes).toEqual(['product']);
    const betBundled = fs.readFileSync(path.join(__dirname, '..', 'workflows', 'bet.schema.yaml'), 'utf-8');
    fs.writeFileSync(p('oprim', 'workflows', 'bet.schema.yaml'), betBundled.replace(/^order: \d+\n/m, ''));
    expect(loadWorkflowSchema('bet', tmpDir).order).toBe(loadWorkflowSchema('bet').order);
  });

  it('an invalid modes value fails loudly naming the override file and value', () => {
    overrideModes('bet', '[team]');
    expect(() => loadWorkflowSchema('bet', tmpDir)).toThrowError(/bet\.schema\.yaml.*unknown mode "team"/);
    overrideModes('note', '[]');
    expect(() => loadWorkflowSchema('note', tmpDir)).toThrowError(/note\.schema\.yaml.*non-empty/);
  });
});
