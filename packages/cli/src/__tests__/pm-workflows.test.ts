// BET-080 — PM inbox / daily-planning workflows and the portfolio "ask first" rule.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initCommand } from '../commands/init';
import { checkbox, confirm, select } from '@inquirer/prompts';
import { installAgentSkills, CLAUDE_SKILLS } from '../lib/install-agent';
import { renderSkillBody, renderCursorCommand, renderAgentInstructions } from '../lib/workflow-renderer';
import { applyAskFirstBlocks, readAskFirstRules, renderContextFor } from '../lib/workflow-rules';
import { checkSkillVersionDrift, type Check } from '../lib/integrity';

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn().mockResolvedValue([]),
  confirm: vi.fn().mockResolvedValue(false),
  select: vi.fn().mockResolvedValue('openspec'),
}));

const PM_WORKFLOWS = ['capture', 'triage', 'ingest', 'start-day', 'plan-week'];
const COMMAND_WORKFLOWS = ['triage', 'ingest', 'start-day', 'plan-week'];
const ASK_FIRST_HEADING = 'Ask about assumptions first';

let tmpDir: string;
const p = (...parts: string[]): string => path.join(tmpDir, ...parts);
const read = (...parts: string[]): string => fs.readFileSync(p(...parts), 'utf-8');

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-pm-'));
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

async function init(mode: 'product' | 'portfolio', agents: string[]): Promise<void> {
  const args = ['--name', 'acme'];
  if (mode === 'portfolio') args.push('--mode', 'portfolio');
  for (const a of agents) args.push('--agent', a);
  await initCommand().parseAsync(args, { from: 'user' });
}

function setRules(yamlBlock: string): void {
  const configPath = p('oprim', 'config.yaml');
  fs.writeFileSync(configPath, read('oprim', 'config.yaml').replace(/^rules: \{\}$/m, yamlBlock));
}

describe('PM workflows install', () => {
  it('portfolio mode installs all five for every agent surface', async () => {
    await init('portfolio', ['claude', 'cursor', 'codex', 'poolside']);
    for (const id of PM_WORKFLOWS) {
      expect(fs.existsSync(p('.claude', 'skills', `oprim-${id}`, 'SKILL.md'))).toBe(true);
      expect(fs.existsSync(p('.poolside', 'skills', `oprim-${id}`, 'SKILL.md'))).toBe(true);
    }
    for (const id of COMMAND_WORKFLOWS) {
      expect(fs.existsSync(p('.claude', 'commands', 'oprim', `${id}.md`))).toBe(true);
      expect(fs.existsSync(p('.cursor', 'commands', `oprim-${id}.md`))).toBe(true);
    }
    expect(fs.existsSync(p('.cursor', 'skills', 'oprim-capture', 'SKILL.md'))).toBe(true);
    const agentsMd = read('AGENTS.md');
    for (const heading of ['(oprim-capture)', '(oprim-triage)', '(oprim-ingest)', '(oprim-start-day)', '(oprim-plan-week)']) {
      expect(agentsMd).toContain(heading);
    }
  });

  it('product mode installs none of them', async () => {
    await init('product', ['claude', 'cursor', 'codex', 'poolside']);
    for (const id of PM_WORKFLOWS) {
      expect(fs.existsSync(p('.claude', 'skills', `oprim-${id}`))).toBe(false);
      expect(fs.existsSync(p('.poolside', 'skills', `oprim-${id}`))).toBe(false);
      expect(fs.existsSync(p('.cursor', 'commands', `oprim-${id}.md`))).toBe(false);
    }
    expect(read('AGENTS.md')).not.toContain('oprim-capture');
  });

  it('the portfolio STATE.md scaffold carries the four sections the workflows maintain', async () => {
    await init('portfolio', []);
    const state = read('STATE.md');
    for (const h of ['## Focus', '## In progress', '## Blockers', '## Last commands']) expect(state).toContain(h);
  });
});

describe('PM workflow content', () => {
  it('capture appends a timestamped checkbox line without asking anything else', () => {
    const body = renderSkillBody('capture');
    expect(body).toContain('- [ ] <YYYY-MM-DD HH:MM> <text>');
    expect(body).toMatch(/do not ask follow-up questions/);
  });

  it('triage asks one question per item and confirms before product writes', () => {
    const body = renderSkillBody('triage');
    expect(body).toMatch(/exactly one question per item/i);
    expect(body).toContain('outputs/handoffs/');
    expect(body).toMatch(/Only on "yes", write/);
    expect(body).toContain('→ discarded');
  });

  it('ingest is append-only and confirms twice before writing into a product', () => {
    const body = renderSkillBody('ingest');
    expect(body).toMatch(/Never edit, reorder or delete an existing line/);
    expect(body).toMatch(/Nothing outside `wiki\/` is written until the user confirms/);
    expect(body).toMatch(/separate confirmation/);
  });

  it('start-day and plan-week fall back to sequence.yaml and treat calendar/chat as optional', () => {
    for (const id of ['start-day', 'plan-week']) {
      const body = renderSkillBody(id);
      expect(body).toContain('oprim ovw --portfolio --json');
      expect(body).toContain('oprim/sequence.yaml');
      expect(body).toMatch(/only if such tools are available/);
      expect(body).toMatch(/skip this step silently/);
      for (const h of ['## Focus', '## In progress', '## Blockers', '## Last commands']) expect(body).toContain(h);
    }
  });
});

describe('applyAskFirstBlocks', () => {
  const S = '<!-- oprim:portfolio:start -->';
  const E = '<!-- oprim:portfolio:end -->';
  it('paragraph, list-item and inline-sentence blocks strip back to the original text', () => {
    expect(applyAskFirstBlocks(`A\n\n${S}\n### X\nbody\n${E}\n\nB`, false)).toBe('A\n\nB');
    expect(applyAskFirstBlocks(`1. a\n${S}\n1b. x\n${E}\n2. b`, false)).toBe('1. a\n2. b');
    expect(applyAskFirstBlocks(`one. ${S}Ask. ${E}Two.`, false)).toBe('one. Two.');
  });
  it('keeping a block removes only its delimiters', () => {
    expect(applyAskFirstBlocks(`A\n\n${S}\n### X\n${E}\n\nB`, true)).toBe('A\n\n### X\n\nB');
    expect(applyAskFirstBlocks(`1. a\n${S}\n1b. x\n${E}\n2. b`, true)).toBe('1. a\n1b. x\n2. b');
    expect(applyAskFirstBlocks(`one. ${S}Ask. ${E}Two.`, true)).toBe('one. Ask. Two.');
  });
});

describe('ask-first rule', () => {
  it('product render of bet/pdr/criteria carries no portfolio markers', () => {
    for (const id of ['bet', 'pdr', 'criteria']) {
      const body = renderSkillBody(id);
      expect(body).not.toContain('oprim:portfolio');
      expect(body).not.toContain(ASK_FIRST_HEADING);
      expect(renderCursorCommand(id)).not.toContain('oprim:portfolio');
    }
    expect(renderAgentInstructions('product')).not.toContain('oprim:portfolio');
  });

  it('portfolio default: bet/pdr/criteria skills include the ask-first step on every surface', async () => {
    await init('portfolio', ['claude', 'cursor', 'codex']);
    for (const name of ['oprim-bet', 'oprim-pdr', 'oprim-criteria']) {
      const skill = read('.claude', 'skills', name, 'SKILL.md');
      expect(skill).toContain(ASK_FIRST_HEADING);
      expect(skill).not.toContain('oprim:portfolio');
    }
    expect(read('.cursor', 'commands', 'oprim-bet.md')).toMatch(/ask 2–3 questions about the assumptions/);
    expect(read('AGENTS.md')).toMatch(/4c\. Before drafting any bet content/);
  });

  it('rules.<id>.ask_first: false turns it off per workflow in portfolio mode', async () => {
    await init('portfolio', ['claude']);
    setRules('rules:\n  pdr:\n    ask_first: false\n');
    installAgentSkills('claude', tmpDir, 'none');
    expect(read('.claude', 'skills', 'oprim-pdr', 'SKILL.md')).toBe(CLAUDE_SKILLS['oprim-pdr']);
    expect(read('.claude', 'skills', 'oprim-bet', 'SKILL.md')).toContain(ASK_FIRST_HEADING);
  });

  it('rules.<id>.ask_first: true turns it on in product mode; string rules still parse', async () => {
    await init('product', ['claude']);
    setRules('rules:\n  bet:\n    text: "Always link an objective"\n    ask_first: true\n  pdr: "Cite evidence"\n');
    expect(readAskFirstRules(tmpDir)).toEqual({ bet: true });
    installAgentSkills('claude', tmpDir);
    expect(read('.claude', 'skills', 'oprim-bet', 'SKILL.md')).toContain(ASK_FIRST_HEADING);
    expect(read('.claude', 'skills', 'oprim-pdr', 'SKILL.md')).toBe(CLAUDE_SKILLS['oprim-pdr']);
  });

  it('skill-drift check passes on a fresh portfolio install', async () => {
    await init('portfolio', ['claude']);
    const checks: Check[] = [];
    checkSkillVersionDrift(tmpDir, checks);
    expect(checks).toEqual([]);
    expect(renderContextFor(tmpDir).mode).toBe('portfolio');
  });
});
