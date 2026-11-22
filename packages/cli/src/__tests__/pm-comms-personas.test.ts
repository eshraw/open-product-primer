// BET-081 — prioritize / comms / publish workflows and the Claude reviewer-persona subagents.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initCommand } from '../commands/init';
import { checkbox, confirm, select } from '@inquirer/prompts';
import { installAgentSkills, claudeAgents } from '../lib/install-agent';
import { renderSkillBody, renderCursorCommand, renderAgentInstructions } from '../lib/workflow-renderer';
import { loadWorkflowSchema, workflowIdsFor } from '../lib/workflow-schema';
import { checkSkillVersionDrift, type Check } from '../lib/integrity';

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn().mockResolvedValue([]),
  confirm: vi.fn().mockResolvedValue(false),
  select: vi.fn().mockResolvedValue('openspec'),
}));

const WORKFLOWS = ['prioritize', 'stakeholder-update', 'roadmap-comms', 'publish'];
const COMMS = ['stakeholder-update', 'roadmap-comms'];
const PERSONAS = ['c-level', 'eng-lead', 'data-eng'];

let tmpDir: string;
const p = (...parts: string[]): string => path.join(tmpDir, ...parts);
const read = (...parts: string[]): string => fs.readFileSync(p(...parts), 'utf-8');

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-comms-'));
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

describe('prioritize / comms / publish install', () => {
  it('portfolio mode installs all four on every agent surface', async () => {
    await init('portfolio', ['claude', 'cursor', 'codex', 'poolside']);
    for (const id of WORKFLOWS) {
      expect(fs.existsSync(p('.claude', 'skills', `oprim-${id}`, 'SKILL.md'))).toBe(true);
      expect(fs.existsSync(p('.claude', 'commands', 'oprim', `${id}.md`))).toBe(true);
      expect(fs.existsSync(p('.cursor', 'commands', `oprim-${id}.md`))).toBe(true);
      expect(fs.existsSync(p('.poolside', 'skills', `oprim-${id}`, 'SKILL.md'))).toBe(true);
      expect(read('AGENTS.md')).toContain(`(oprim-${id})`);
    }
  });

  it('product mode installs none of them', async () => {
    await init('product', ['claude', 'cursor', 'codex', 'poolside']);
    for (const id of WORKFLOWS) {
      expect(fs.existsSync(p('.claude', 'skills', `oprim-${id}`))).toBe(false);
      expect(fs.existsSync(p('.cursor', 'commands', `oprim-${id}.md`))).toBe(false);
      expect(read('AGENTS.md')).not.toContain(`oprim-${id}`);
    }
  });
});

describe('prioritize content', () => {
  it('forbids writing any sequence.yaml on every surface and only proposes a diff', () => {
    const surfaces = [
      renderSkillBody('prioritize'),
      renderCursorCommand('prioritize'),
      renderAgentInstructions('portfolio'),
    ];
    for (const text of surfaces) {
      expect(text).toMatch(/[Nn]ever write, edit or create any `sequence\.yaml`/);
    }
    const body = renderSkillBody('prioritize');
    expect(body).toContain('oprim ovw --portfolio --json');
    expect(body).toMatch(/nothing was written/);
    expect(body).toMatch(/addressed to that product's owner/);
    expect(body).toMatch(/never a diff to their file/);
    // It shows its inputs per bet rather than a hidden score.
    for (const input of ['Objectives', 'Risk', 'Door', 'Rationale']) expect(body).toContain(input);
  });
});

describe('comms content', () => {
  it('writes a dated, audience-specific DRAFT to outputs/ and never sends', () => {
    for (const id of COMMS) {
      const body = renderSkillBody(id);
      expect(body).toContain(`outputs/<YYYY-MM-DD>-${id}-<audience>.md`);
      expect(body).toContain('> DRAFT — verify before sending.');
      expect(body).toMatch(/Never send, post, email, publish or upload anything/);
      expect(body).toContain('<source>:BET-NNN');
      for (const audience of ['exec', 'eng', 'sales', 'customers']) expect(body).toContain(audience);
    }
    expect(renderSkillBody('stakeholder-update')).toContain('`2027-01` → `2027-01-31`');
    expect(renderSkillBody('stakeholder-update')).toContain('oprim/reviews/');
  });

  it('ask-first block is stripped in product rendering and kept in a portfolio install', async () => {
    for (const id of COMMS) {
      expect(renderSkillBody(id)).not.toContain('Ask about assumptions first');
      expect(renderSkillBody(id)).not.toContain('oprim:portfolio');
      expect(renderCursorCommand(id)).not.toContain('oprim:portfolio');
    }
    await init('portfolio', ['claude', 'codex']);
    for (const id of COMMS) {
      const skill = read('.claude', 'skills', `oprim-${id}`, 'SKILL.md');
      expect(skill).toContain('Ask about assumptions first');
      expect(skill).not.toContain('oprim:portfolio');
    }
    expect(read('AGENTS.md')).toMatch(/1b\. Before drafting, ask 2–3 questions about what this audience/);

    setRules('rules:\n  roadmap-comms:\n    ask_first: false\n');
    installAgentSkills('claude', tmpDir, 'none');
    expect(read('.claude', 'skills', 'oprim-roadmap-comms', 'SKILL.md')).not.toContain('Ask about assumptions first');
    expect(read('.claude', 'skills', 'oprim-stakeholder-update', 'SKILL.md')).toContain('Ask about assumptions first');
  });
});

describe('publish content', () => {
  it('is one-way, writes outputs/publish/<ref>.md and uploads only when explicitly asked', () => {
    const body = renderSkillBody('publish');
    expect(body).toContain('`checkout:BET-031` → `outputs/publish/checkout-BET-031.md`');
    expect(body).toContain('Source of truth: checkout:BET-031 in git');
    expect(body).toMatch(/Never call a Notion API or tool unless the user explicitly asks to upload/);
    expect(body).toMatch(/Never read changes back from Notion/);
    expect(body).toContain('oprim context --source <source>');
    expect(body).toContain('criteria.yaml');
  });
});

describe('reviewer personas', () => {
  it('portfolio + claude installs c-level, eng-lead and data-eng agents with Read/Edit tools', async () => {
    await init('portfolio', ['claude']);
    for (const name of PERSONAS) {
      const agent = read('.claude', 'agents', `${name}.md`);
      expect(agent).toMatch(new RegExp(`^---\\nname: ${name}\\ndescription: .+\\ntools: Read, Edit\\n---\\n`));
      expect(agent).toContain(`${name} perspective`);
      expect(agent).toMatch(/Never change, reorder or delete any existing text/);
      expect(agent).toMatch(/re-read the file and confirm everything above your new section is unchanged/);
    }
    // Personas are subagents, not skills or commands.
    expect(fs.existsSync(p('.claude', 'skills', 'persona-c-level'))).toBe(false);
    expect(fs.existsSync(p('.claude', 'commands', 'oprim', 'persona-c-level.md'))).toBe(false);
  });

  it('product mode creates no .claude/agents/ files', async () => {
    await init('product', ['claude']);
    expect(fs.existsSync(p('.claude', 'agents'))).toBe(false);
    expect(claudeAgents('product')).toEqual({});
  });

  it('other agents get no persona files in portfolio mode', async () => {
    await init('portfolio', ['cursor', 'codex', 'poolside']);
    expect(fs.existsSync(p('.claude', 'agents'))).toBe(false);
    expect(fs.readdirSync(p('.poolside', 'skills')).some((d) => d.startsWith('persona'))).toBe(false);
    expect(read('AGENTS.md')).not.toContain('c-level perspective');
    expect(workflowIdsFor('cursor-command', 'portfolio').some((id) => id.startsWith('persona'))).toBe(false);
  });

  it('a project override in oprim/workflows/ forks a persona body', async () => {
    await init('portfolio', ['claude']);
    fs.mkdirSync(p('oprim', 'workflows'), { recursive: true });
    const forked = '---\nname: c-level\ndescription: Our CEO\ntools: Read, Edit\n---\n\nBe our CEO.\n';
    fs.writeFileSync(p('oprim', 'workflows', 'persona-c-level.template.md'), forked);
    installAgentSkills('claude', tmpDir, 'none');
    expect(read('.claude', 'agents', 'c-level.md')).toBe(forked);
    expect(read('.claude', 'agents', 'eng-lead.md')).toBe(claudeAgents('portfolio')['eng-lead']);
  });

  it('skill-drift check passes on a fresh install and flags an edited agent', async () => {
    await init('portfolio', ['claude']);
    const fresh: Check[] = [];
    checkSkillVersionDrift(tmpDir, fresh);
    expect(fresh).toEqual([]);

    fs.appendFileSync(p('.claude', 'agents', 'data-eng.md'), '\nlocal edit\n');
    const drifted: Check[] = [];
    checkSkillVersionDrift(tmpDir, drifted);
    expect(drifted.map((c) => c.name)).toEqual(['agent: Claude subagent data-eng is out of date']);
  });

  it('rejects a claude.agent that is not a lowercase slug', () => {
    fs.mkdirSync(p('oprim', 'workflows'), { recursive: true });
    fs.writeFileSync(
      p('oprim', 'workflows', 'persona-c-level.schema.yaml'),
      'id: persona-c-level\ndescription: x\nclaude:\n  agent: ../evil\ncursor: {}\npoolside: {}\ninline: false\n'
    );
    expect(() => loadWorkflowSchema('persona-c-level', tmpDir)).toThrow(/persona-c-level\.schema\.yaml.*claude\.agent/);
  });

  it('a data-eng review appended as YAML comments leaves criteria.yaml data identical', () => {
    const criteria = `bet: BET-042
metrics:
  - id: checkout_conversion
    name: Checkout conversion
    baseline: 0.31
    target: 0.35
    timeframe: 30d
    source:
      type: amplitude
      definition:
        event: checkout_completed
        aggregation: unique_users
        denominator_event: checkout_started
`;
    const reviewed =
      criteria +
      `
# ## data-eng perspective (2026-11-22)
# Verdict: Measurable with fixes — denominator double-counts retries.
# - checkout_started fires on every retry; dedupe by session_id.
`;
    expect(yaml.load(reviewed)).toEqual(yaml.load(criteria));
    // The persona's instructions require exactly that comment form.
    const body = claudeAgents('portfolio')['data-eng'];
    expect(body).toContain('# ## data-eng perspective (YYYY-MM-DD)');
    expect(body).toMatch(/must parse to exactly the same data before and after/);
  });
});
