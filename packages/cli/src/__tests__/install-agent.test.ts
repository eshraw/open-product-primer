import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installAgentSkills, writeAgentInstructionFile, codexInstructions, geminiInstructions, poolsideInstructions, vibeInstructions, CLAUDE_COMMANDS, CLAUDE_SKILLS, POOLSIDE_SKILLS, VIBE_SKILLS, CURSOR_COMMANDS } from '../lib/install-agent';

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn().mockResolvedValue([]),
  confirm: vi.fn().mockResolvedValue(false),
  select: vi.fn().mockResolvedValue('openspec'),
}));

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-test-'));
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

// writeAgentInstructionFile ───────────────────────────────────────────────────

describe('writeAgentInstructionFile', () => {
  it('creates the file with delimited section when absent', () => {
    const filePath = path.join(tmpDir, 'AGENTS.md');
    writeAgentInstructionFile(filePath, 'hello oprim');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('<!-- oprim:start -->');
    expect(content).toContain('hello oprim');
    expect(content).toContain('<!-- oprim:end -->');
  });

  it('appends section after existing content when no delimiters present', () => {
    const filePath = path.join(tmpDir, 'AGENTS.md');
    fs.writeFileSync(filePath, '# Existing\n\nSome content.\n');
    writeAgentInstructionFile(filePath, 'new section');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('# Existing');
    expect(content).toContain('<!-- oprim:start -->');
    expect(content).toContain('new section');
  });

  it('replaces content between delimiters on re-run', () => {
    const filePath = path.join(tmpDir, 'AGENTS.md');
    fs.writeFileSync(filePath, 'before\n<!-- oprim:start -->\nOLD\n<!-- oprim:end -->\nafter\n');
    writeAgentInstructionFile(filePath, 'NEW');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('before');
    expect(content).toContain('after');
    expect(content).toContain('NEW');
    expect(content).not.toContain('OLD');
    expect(content.split('<!-- oprim:start -->').length).toBe(2);
  });

  it('does not duplicate the section on multiple re-runs', () => {
    const filePath = path.join(tmpDir, 'AGENTS.md');
    writeAgentInstructionFile(filePath, 'v1');
    writeAgentInstructionFile(filePath, 'v2');
    writeAgentInstructionFile(filePath, 'v3');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content.split('<!-- oprim:start -->').length).toBe(2);
    expect(content).toContain('v3');
    expect(content).not.toContain('v1');
    expect(content).not.toContain('v2');
  });
});

// content functions ────────────────────────────────────────────────────────────

describe('codexInstructions', () => {
  it('contains all six workflow sections', () => {
    const content = codexInstructions();
    expect(content).toContain('oprim-bet');
    expect(content).toContain('oprim-note');
    expect(content).toContain('oprim-criteria');
    expect(content).toContain('oprim-pdr');
    expect(content).toContain('oprim-review');
    expect(content).toContain('oprim-archive');
  });
});

describe('poolsideInstructions', () => {
  it('contains all six workflow sections', () => {
    const content = poolsideInstructions();
    expect(content).toContain('oprim-bet');
    expect(content).toContain('oprim-note');
    expect(content).toContain('oprim-criteria');
    expect(content).toContain('oprim-pdr');
    expect(content).toContain('oprim-review');
    expect(content).toContain('oprim-archive');
  });
});

describe('geminiInstructions', () => {
  it('contains all six workflow sections', () => {
    const content = geminiInstructions();
    expect(content).toContain('oprim-bet');
    expect(content).toContain('oprim-note');
    expect(content).toContain('oprim-criteria');
    expect(content).toContain('oprim-pdr');
    expect(content).toContain('oprim-review');
    expect(content).toContain('oprim-archive');
  });
});

describe('vibeInstructions', () => {
  it('contains all six workflow sections', () => {
    const content = vibeInstructions();
    expect(content).toContain('oprim-bet');
    expect(content).toContain('oprim-note');
    expect(content).toContain('oprim-criteria');
    expect(content).toContain('oprim-pdr');
    expect(content).toContain('oprim-review');
    expect(content).toContain('oprim-archive');
  });
});

// 7.3 ─────────────────────────────────────────────────────────────────────────

describe('installAgentSkills', () => {
  describe('claude', () => {
    it('creates .claude/skills/ directories and SKILL.md files', () => {
      installAgentSkills('claude', tmpDir);
      for (const skill of ['oprim-pdr', 'oprim-bet', 'oprim-note', 'oprim-criteria', 'oprim-review']) {
        const skillPath = path.join(tmpDir, '.claude', 'skills', skill, 'SKILL.md');
        expect(fs.existsSync(skillPath)).toBe(true);
      }
    });

    it('creates .claude/commands/oprim/ and command files', () => {
      installAgentSkills('claude', tmpDir);
      for (const cmd of ['promote.md', 'sequence.md']) {
        const cmdPath = path.join(tmpDir, '.claude', 'commands', 'oprim', cmd);
        expect(fs.existsSync(cmdPath)).toBe(true);
      }
    });

    it('does not create command wrappers for skill-backed commands', () => {
      installAgentSkills('claude', tmpDir);
      for (const cmd of ['pdr.md', 'bet.md', 'criteria.md', 'review.md']) {
        const cmdPath = path.join(tmpDir, '.claude', 'commands', 'oprim', cmd);
        expect(fs.existsSync(cmdPath)).toBe(false);
      }
    });

    it('creates .claude/ when it does not exist', () => {
      expect(fs.existsSync(path.join(tmpDir, '.claude'))).toBe(false);
      installAgentSkills('claude', tmpDir);
      expect(fs.existsSync(path.join(tmpDir, '.claude'))).toBe(true);
    });

    it('emits a notice when .claude/ was created', () => {
      const logSpy = vi.spyOn(console, 'log');
      installAgentSkills('claude', tmpDir);
      const notices = logSpy.mock.calls.map((c) => String(c[0]));
      expect(notices.some((n) => n.includes('.claude/ created'))).toBe(true);
    });

    it('does not emit a directory-created notice when .claude/ already exists', () => {
      fs.mkdirSync(path.join(tmpDir, '.claude'));
      const logSpy = vi.spyOn(console, 'log');
      installAgentSkills('claude', tmpDir);
      const notices = logSpy.mock.calls.map((c) => String(c[0]));
      expect(notices.some((n) => n.includes('.claude/ created'))).toBe(false);
    });
  });

  describe('codex', () => {
    it('creates AGENTS.md with oprim section when absent', () => {
      installAgentSkills('codex', tmpDir);
      const agentsPath = path.join(tmpDir, 'AGENTS.md');
      expect(fs.existsSync(agentsPath)).toBe(true);
      const content = fs.readFileSync(agentsPath, 'utf-8');
      expect(content).toContain('<!-- oprim:start -->');
      expect(content).toContain('<!-- oprim:end -->');
      expect(content).toContain('oprim workflows');
    });

    it('appends oprim section when AGENTS.md already has user content', () => {
      const agentsPath = path.join(tmpDir, 'AGENTS.md');
      fs.writeFileSync(agentsPath, '# My Agents\n\nDo useful things.\n');
      installAgentSkills('codex', tmpDir);
      const content = fs.readFileSync(agentsPath, 'utf-8');
      expect(content).toContain('# My Agents');
      expect(content).toContain('<!-- oprim:start -->');
    });

    it('replaces existing oprim section on re-run', () => {
      const agentsPath = path.join(tmpDir, 'AGENTS.md');
      fs.writeFileSync(agentsPath, '# My Agents\n<!-- oprim:start -->\nOLD CONTENT\n<!-- oprim:end -->\n');
      installAgentSkills('codex', tmpDir);
      const content = fs.readFileSync(agentsPath, 'utf-8');
      expect(content).not.toContain('OLD CONTENT');
      expect(content).toContain('oprim workflows');
      expect(content).toContain('# My Agents');
    });

    it('prints a confirmation line referencing AGENTS.md', () => {
      const logSpy = vi.spyOn(console, 'log');
      installAgentSkills('codex', tmpDir);
      const notices = logSpy.mock.calls.map((c) => String(c[0]));
      expect(notices.some((n) => n.includes('AGENTS.md'))).toBe(true);
    });
  });

  describe('gemini', () => {
    it('creates GEMINI.md with oprim section when absent', () => {
      installAgentSkills('gemini', tmpDir);
      const geminiPath = path.join(tmpDir, 'GEMINI.md');
      expect(fs.existsSync(geminiPath)).toBe(true);
      const content = fs.readFileSync(geminiPath, 'utf-8');
      expect(content).toContain('<!-- oprim:start -->');
      expect(content).toContain('<!-- oprim:end -->');
      expect(content).toContain('oprim workflows');
    });

    it('appends oprim section when GEMINI.md already has user content', () => {
      const geminiPath = path.join(tmpDir, 'GEMINI.md');
      fs.writeFileSync(geminiPath, '# My Gemini Config\n\nUse tools wisely.\n');
      installAgentSkills('gemini', tmpDir);
      const content = fs.readFileSync(geminiPath, 'utf-8');
      expect(content).toContain('# My Gemini Config');
      expect(content).toContain('<!-- oprim:start -->');
    });

    it('replaces existing oprim section on re-run', () => {
      const geminiPath = path.join(tmpDir, 'GEMINI.md');
      fs.writeFileSync(geminiPath, '# Gemini\n<!-- oprim:start -->\nOLD CONTENT\n<!-- oprim:end -->\n');
      installAgentSkills('gemini', tmpDir);
      const content = fs.readFileSync(geminiPath, 'utf-8');
      expect(content).not.toContain('OLD CONTENT');
      expect(content).toContain('oprim workflows');
      expect(content).toContain('# Gemini');
    });

    it('prints a confirmation line referencing GEMINI.md', () => {
      const logSpy = vi.spyOn(console, 'log');
      installAgentSkills('gemini', tmpDir);
      const notices = logSpy.mock.calls.map((c) => String(c[0]));
      expect(notices.some((n) => n.includes('GEMINI.md'))).toBe(true);
    });
  });

  describe('cursor', () => {
    it('creates .cursor/skills/ directories and SKILL.md files', () => {
      installAgentSkills('cursor', tmpDir);
      for (const skill of ['oprim-pdr', 'oprim-bet', 'oprim-note', 'oprim-criteria', 'oprim-review']) {
        const skillPath = path.join(tmpDir, '.cursor', 'skills', skill, 'SKILL.md');
        expect(fs.existsSync(skillPath)).toBe(true);
      }
    });

    it('creates .cursor/commands/ and command files', () => {
      installAgentSkills('cursor', tmpDir);
      for (const cmd of ['oprim-pdr.md', 'oprim-bet.md', 'oprim-note.md', 'oprim-criteria.md', 'oprim-review.md']) {
        const cmdPath = path.join(tmpDir, '.cursor', 'commands', cmd);
        expect(fs.existsSync(cmdPath)).toBe(true);
      }
    });

    it('creates .cursor/ when it does not exist', () => {
      expect(fs.existsSync(path.join(tmpDir, '.cursor'))).toBe(false);
      installAgentSkills('cursor', tmpDir);
      expect(fs.existsSync(path.join(tmpDir, '.cursor'))).toBe(true);
    });
  });

  describe('poolside', () => {
    it('creates .poolside/skills/ with all seven SKILL.md files', () => {
      installAgentSkills('poolside', tmpDir);
      for (const skill of Object.keys(POOLSIDE_SKILLS)) {
        const skillPath = path.join(tmpDir, '.poolside', 'skills', skill, 'SKILL.md');
        expect(fs.existsSync(skillPath)).toBe(true);
      }
    });

    it('creates .poolside/ when it does not exist', () => {
      expect(fs.existsSync(path.join(tmpDir, '.poolside'))).toBe(false);
      installAgentSkills('poolside', tmpDir);
      expect(fs.existsSync(path.join(tmpDir, '.poolside'))).toBe(true);
    });

    it('emits a notice when .poolside/ was created', () => {
      const logSpy = vi.spyOn(console, 'log');
      installAgentSkills('poolside', tmpDir);
      const notices = logSpy.mock.calls.map((c) => String(c[0]));
      expect(notices.some((n) => n.includes('.poolside/'))).toBe(true);
    });

    it('does not emit a directory-created notice when .poolside/ already exists', () => {
      fs.mkdirSync(path.join(tmpDir, '.poolside'));
      const logSpy = vi.spyOn(console, 'log');
      installAgentSkills('poolside', tmpDir);
      const notices = logSpy.mock.calls.map((c) => String(c[0]));
      expect(notices.some((n) => n.includes('.poolside/ created'))).toBe(false);
    });

    it('writes AGENTS.md with oprim section', () => {
      installAgentSkills('poolside', tmpDir);
      const agentsPath = path.join(tmpDir, 'AGENTS.md');
      expect(fs.existsSync(agentsPath)).toBe(true);
      const content = fs.readFileSync(agentsPath, 'utf-8');
      expect(content).toContain('<!-- oprim:start -->');
      expect(content).toContain('<!-- oprim:end -->');
    });

    it('replaces existing oprim section in AGENTS.md on re-run', () => {
      const agentsPath = path.join(tmpDir, 'AGENTS.md');
      fs.writeFileSync(agentsPath, '# Agents\n<!-- oprim:start -->\nOLD CONTENT\n<!-- oprim:end -->\n');
      installAgentSkills('poolside', tmpDir);
      const content = fs.readFileSync(agentsPath, 'utf-8');
      expect(content).not.toContain('OLD CONTENT');
      expect(content.split('<!-- oprim:start -->').length).toBe(2);
    });

    it('re-run is idempotent for skill files', () => {
      installAgentSkills('poolside', tmpDir);
      installAgentSkills('poolside', tmpDir);
      for (const skill of Object.keys(POOLSIDE_SKILLS)) {
        const skillPath = path.join(tmpDir, '.poolside', 'skills', skill, 'SKILL.md');
        expect(fs.existsSync(skillPath)).toBe(true);
      }
    });
  });

  describe('vibe', () => {
    it('creates .vibe/skills/ with all seven SKILL.md files', () => {
      installAgentSkills('vibe', tmpDir);
      for (const skill of Object.keys(VIBE_SKILLS)) {
        const skillPath = path.join(tmpDir, '.vibe', 'skills', skill, 'SKILL.md');
        expect(fs.existsSync(skillPath)).toBe(true);
      }
    });

    it('creates .vibe/ when it does not exist', () => {
      expect(fs.existsSync(path.join(tmpDir, '.vibe'))).toBe(false);
      installAgentSkills('vibe', tmpDir);
      expect(fs.existsSync(path.join(tmpDir, '.vibe'))).toBe(true);
    });

    it('emits a notice when .vibe/ was created', () => {
      const logSpy = vi.spyOn(console, 'log');
      installAgentSkills('vibe', tmpDir);
      const notices = logSpy.mock.calls.map((c) => String(c[0]));
      expect(notices.some((n) => n.includes('.vibe/'))).toBe(true);
    });

    it('does not emit a directory-created notice when .vibe/ already exists', () => {
      fs.mkdirSync(path.join(tmpDir, '.vibe'));
      const logSpy = vi.spyOn(console, 'log');
      installAgentSkills('vibe', tmpDir);
      const notices = logSpy.mock.calls.map((c) => String(c[0]));
      expect(notices.some((n) => n.includes('.vibe/ created'))).toBe(false);
    });

    it('writes AGENTS.md with oprim section', () => {
      installAgentSkills('vibe', tmpDir);
      const agentsPath = path.join(tmpDir, 'AGENTS.md');
      expect(fs.existsSync(agentsPath)).toBe(true);
      const content = fs.readFileSync(agentsPath, 'utf-8');
      expect(content).toContain('<!-- oprim:start -->');
      expect(content).toContain('<!-- oprim:end -->');
    });

    it('replaces existing oprim section in AGENTS.md on re-run', () => {
      const agentsPath = path.join(tmpDir, 'AGENTS.md');
      fs.writeFileSync(agentsPath, '# Agents\n<!-- oprim:start -->\nOLD CONTENT\n<!-- oprim:end -->\n');
      installAgentSkills('vibe', tmpDir);
      const content = fs.readFileSync(agentsPath, 'utf-8');
      expect(content).not.toContain('OLD CONTENT');
      expect(content.split('<!-- oprim:start -->').length).toBe(2);
    });

    it('re-run is idempotent for skill files', () => {
      installAgentSkills('vibe', tmpDir);
      installAgentSkills('vibe', tmpDir);
      for (const skill of Object.keys(VIBE_SKILLS)) {
        const skillPath = path.join(tmpDir, '.vibe', 'skills', skill, 'SKILL.md');
        expect(fs.existsSync(skillPath)).toBe(true);
      }
    });
  });
});

// oprim-note skill content ─────────────────────────────────────────────────────

describe('oprim-note skill', () => {
  it('instructs NOTE-NNN id scanning, self-seeding tags, and the OKF-tier check', () => {
    const content = CLAUDE_SKILLS['oprim-note'];
    expect(content).toContain('name: oprim-note');
    expect(content).toContain('NOTE-(\\d+)-');
    expect(content).toContain('notes.tags');
    expect(content).toContain('accepted, never rejected');
    expect(content).toContain('oprim/templates/note.md');
    expect(content).toContain('description:');
  });
});

// bet-032 — bets live under oprim/bets/pending/, ID scanning spans pending+archived ─

describe('oprim-bet skill — bet ID scanning spans pending/ and archived/ (bet-032)', () => {
  it('creates new bet directories under oprim/bets/pending/', () => {
    const content = CLAUDE_SKILLS['oprim-bet'];
    expect(content).toContain('oprim/bets/pending/BET-NNN-<slug>/bet-decision.md');
  });

  it('scans both oprim/bets/pending/ and oprim/bets/archived/ for the next BET ID', () => {
    const content = CLAUDE_SKILLS['oprim-bet'];
    expect(content).toContain('Scan both \`oprim/bets/pending/\` and \`oprim/bets/archived/\`');
  });
});

describe('oprim-archive skill — moves from oprim/bets/pending/, not the flat directory (bet-032)', () => {
  it('resolves the bet directory under oprim/bets/pending/', () => {
    const content = CLAUDE_SKILLS['oprim-archive'];
    expect(content).toContain('oprim/bets/pending/');
    expect(content).not.toContain('oprim/bets/<resolved-dir>');
  });

  it('moves the resolved bet directory from pending/ to archived/', () => {
    const content = CLAUDE_SKILLS['oprim-archive'];
    expect(content).toContain('mv oprim/bets/pending/<resolved-dir> oprim/bets/archived/<resolved-dir>');
  });
});

// bet-025 — rules.<artifact> consumption in generated content ──────────────────

describe('rules.<artifact> guidance in generated skill content', () => {
  it('oprim-bet skill reads rules.bet when non-empty, no-op when empty', () => {
    const content = CLAUDE_SKILLS['oprim-bet'];
    expect(content).toContain('rules.bet');
    expect(content).toContain('behavior is unchanged');
  });

  it('oprim-pdr skill reads rules.pdr when non-empty, no-op when empty', () => {
    const content = CLAUDE_SKILLS['oprim-pdr'];
    expect(content).toContain('rules.pdr');
    expect(content).toContain('behavior is unchanged');
  });

  it('oprim-review skill reads rules.review when non-empty, no-op when empty', () => {
    const content = CLAUDE_SKILLS['oprim-review'];
    expect(content).toContain('rules.review');
    expect(content).toContain('behavior is unchanged');
  });

  it('Cursor command wrappers reference rules.bet / rules.pdr / rules.review', () => {
    expect(CURSOR_COMMANDS['oprim-bet.md']).toContain('rules.bet');
    expect(CURSOR_COMMANDS['oprim-pdr.md']).toContain('rules.pdr');
    expect(CURSOR_COMMANDS['oprim-review.md']).toContain('rules.review');
  });

  it('Codex/Gemini/Poolside/Vibe inline workflow text references rules.bet / rules.pdr / rules.review', () => {
    for (const instructions of [codexInstructions(), geminiInstructions(), poolsideInstructions(), vibeInstructions()]) {
      expect(instructions).toContain('rules.bet');
      expect(instructions).toContain('rules.pdr');
      expect(instructions).toContain('rules.review');
    }
  });
});

// bet-031 — oprim-pdr regenerates the decisions rollup view after writing a PDR ────

describe('decisions-view regeneration in oprim-pdr', () => {
  it('Claude oprim-pdr skill runs generate-decisions-view.js', () => {
    expect(CLAUDE_SKILLS['oprim-pdr']).toContain('generate-decisions-view.js');
  });

  it('Cursor oprim-pdr command wrapper runs generate-decisions-view.js', () => {
    expect(CURSOR_COMMANDS['oprim-pdr.md']).toContain('generate-decisions-view.js');
  });

  it('Codex/Gemini/Poolside/Vibe inline workflow text runs generate-decisions-view.js', () => {
    for (const instructions of [codexInstructions(), geminiInstructions(), poolsideInstructions(), vibeInstructions()]) {
      expect(instructions).toContain('generate-decisions-view.js');
    }
  });
});

// promoteContent ID-prefix dispatch ────────────────────────────────────────────

describe('promoteContent dispatch', () => {
  it('dispatches on BET- vs NOTE- prefix and reports unrecognized prefixes', () => {
    const content = CLAUDE_COMMANDS['promote.md'];
    expect(content).toContain('BET-');
    expect(content).toContain('NOTE-');
    expect(content).toContain('A. Bet → OpenSpec change');
    expect(content).toContain('B. Note → Bet');
    expect(content).toContain('Unrecognized ID prefix');
  });

  it('preserves the existing bet → OpenSpec-change steps unchanged', () => {
    const content = CLAUDE_COMMANDS['promote.md'];
    expect(content).toContain('openspec-propose');
    expect(content).toContain('## Capabilities');
  });
});

// 6.1 — oprim-sequence skill file ─────────────────────────────────────────────

describe('oprim-sequence skill installation', () => {
  it('oprim update writes oprim-sequence skill file', () => {
    installAgentSkills('claude', tmpDir);
    const skillPath = path.join(tmpDir, '.claude', 'skills', 'oprim-sequence', 'SKILL.md');
    expect(fs.existsSync(skillPath)).toBe(true);
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('name: oprim-sequence');
    expect(content).toContain('Triage mode');
    expect(content).toContain('Seeded mode');
  });
});

// 6.2 — sequence.md command is a skill wrapper ────────────────────────────────

describe('sequence.md command', () => {
  it('oprim update writes sequence.md containing skill invocation, not inline steps', () => {
    installAgentSkills('claude', tmpDir);
    const cmdPath = path.join(tmpDir, '.claude', 'commands', 'oprim', 'sequence.md');
    const content = fs.readFileSync(cmdPath, 'utf-8');
    expect(content).toContain('oprim-sequence');
    expect(content).not.toContain('Read board');
    expect(content).not.toContain('Check WIP limits');
  });

  it('CLAUDE_COMMANDS sequence.md contains skill invocation', () => {
    const content = CLAUDE_COMMANDS['sequence.md'];
    expect(content).toContain('oprim-sequence');
    expect(content).not.toContain('Read board');
  });
});

// bet-026 — guided remote-context-init skill installation ────────────────────

describe('oprim-context-init skill installation', () => {
  it('oprim update writes oprim-context-init skill file', () => {
    installAgentSkills('claude', tmpDir);
    const skillPath = path.join(tmpDir, '.claude', 'skills', 'oprim-context-init', 'SKILL.md');
    expect(fs.existsSync(skillPath)).toBe(true);
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('name: oprim-context-init');
    expect(content).toContain('oprim context init');
    expect(content).toContain('AskUserQuestion');
  });

  it('warns about opting out of a description, per the guided-init design', () => {
    installAgentSkills('claude', tmpDir);
    const content = fs.readFileSync(
      path.join(tmpDir, '.claude', 'skills', 'oprim-context-init', 'SKILL.md'),
      'utf-8'
    );
    expect(content).toContain('description-less');
  });

  it('oprim update writes context-init.md as a thin skill wrapper', () => {
    installAgentSkills('claude', tmpDir);
    const cmdPath = path.join(tmpDir, '.claude', 'commands', 'oprim', 'context-init.md');
    expect(fs.existsSync(cmdPath)).toBe(true);
    const content = fs.readFileSync(cmdPath, 'utf-8');
    expect(content).toContain('oprim-context-init');
  });
});

// 6.3 — on-prompt-submit.sh detects /oprim:bet ────────────────────────────────

describe('on-prompt-submit.sh hook', () => {
  function writeAndChmodHook(hookPath: string, content: string): void {
    fs.writeFileSync(hookPath, content, 'utf-8');
    fs.chmodSync(hookPath, 0o755);
  }

  function runPromptSubmitHook(input: string): void {
    installAgentSkills('claude', tmpDir);
    const hookPath = path.join(tmpDir, '.claude', 'hooks', 'on-prompt-submit.sh');
    execSync(`bash "${hookPath}"`, {
      input,
      cwd: tmpDir,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }

  it('detects /oprim:bet and writes .sequence-nudge with bet-created', () => {
    const input = JSON.stringify({ prompt: '/oprim:bet My new bet' });
    runPromptSubmitHook(input);
    const nudgePath = path.join(tmpDir, '.claude', 'hooks', '.sequence-nudge');
    expect(fs.existsSync(nudgePath)).toBe(true);
    expect(fs.readFileSync(nudgePath, 'utf-8')).toBe('bet-created');
  });

  it('detects /oprim:promote and writes .sequence-nudge with bet-promoted', () => {
    const input = JSON.stringify({ prompt: '/oprim:promote BET-042' });
    runPromptSubmitHook(input);
    const nudgePath = path.join(tmpDir, '.claude', 'hooks', '.sequence-nudge');
    expect(fs.existsSync(nudgePath)).toBe(true);
    expect(fs.readFileSync(nudgePath, 'utf-8')).toBe('bet-promoted');
  });

  it('does not write .sequence-nudge for unrelated prompts', () => {
    const input = JSON.stringify({ prompt: 'just chatting' });
    runPromptSubmitHook(input);
    const nudgePath = path.join(tmpDir, '.claude', 'hooks', '.sequence-nudge');
    expect(fs.existsSync(nudgePath)).toBe(false);
  });

  it('does not interfere with archive detection when both present', () => {
    const input = JSON.stringify({ prompt: '/opsx:archive my-change' });
    runPromptSubmitHook(input);
    const archivePath = path.join(tmpDir, '.claude', 'hooks', '.archive-pending');
    expect(fs.existsSync(archivePath)).toBe(true);
    const nudgePath = path.join(tmpDir, '.claude', 'hooks', '.sequence-nudge');
    expect(fs.existsSync(nudgePath)).toBe(false);
  });
});

// 6.5 — on-stop.sh reads .sequence-nudge, outputs nudge, deletes flag ─────────

describe('on-stop.sh hook', () => {
  function runStopHook(): string {
    installAgentSkills('claude', tmpDir);
    const hookPath = path.join(tmpDir, '.claude', 'hooks', 'on-stop.sh');
    try {
      return execSync(`bash "${hookPath}"`, {
        cwd: tmpDir,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).toString();
    } catch (e: unknown) {
      return (e as { stdout: Buffer }).stdout?.toString() ?? '';
    }
  }

  it('reads bet-created nudge, outputs message, and deletes flag', () => {
    installAgentSkills('claude', tmpDir);
    const nudgePath = path.join(tmpDir, '.claude', 'hooks', '.sequence-nudge');
    fs.writeFileSync(nudgePath, 'bet-created', 'utf-8');

    const output = runStopHook();

    expect(output).toContain('oprim:sequence');
    expect(output).toContain('backlog');
    expect(fs.existsSync(nudgePath)).toBe(false);
  });

  it('reads bet-promoted nudge, outputs message, and deletes flag', () => {
    installAgentSkills('claude', tmpDir);
    const nudgePath = path.join(tmpDir, '.claude', 'hooks', '.sequence-nudge');
    fs.writeFileSync(nudgePath, 'bet-promoted', 'utf-8');

    const output = runStopHook();

    expect(output).toContain('oprim:sequence');
    expect(output).toContain('promoted');
    expect(fs.existsSync(nudgePath)).toBe(false);
  });
});

// bet-023 — native spec-authoring skill (oprim-spec) ───────────────────────────

describe('oprim-spec skill installation', () => {
  it('installs .claude/skills/oprim-spec/SKILL.md only when framework is native', () => {
    installAgentSkills('claude', tmpDir, 'native');
    const skillPath = path.join(tmpDir, '.claude', 'skills', 'oprim-spec', 'SKILL.md');
    expect(fs.existsSync(skillPath)).toBe(true);

    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('name: oprim-spec');
    expect(content).toContain('SHALL');
    expect(content).toContain('SHOULD');
    expect(content).toContain('MAY');
    expect(content).toContain('#### Scenario:');
    expect(content).toContain('**WHEN**');
    expect(content).toContain('**THEN**');
    expect(content).toContain('oprim/specs/<capability>/spec.md');
    expect(content).toContain('rules.spec');
  });

  it('does not install oprim-spec for openspec or none frameworks', () => {
    installAgentSkills('claude', tmpDir, 'openspec');
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'oprim-spec', 'SKILL.md'))).toBe(false);

    installAgentSkills('claude', tmpDir, 'none');
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'oprim-spec', 'SKILL.md'))).toBe(false);
  });

  it('removes a previously-installed oprim-spec skill when the framework switches away from native', () => {
    installAgentSkills('claude', tmpDir, 'native');
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'oprim-spec', 'SKILL.md'))).toBe(true);

    installAgentSkills('claude', tmpDir, 'openspec');
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'oprim-spec', 'SKILL.md'))).toBe(false);
  });

  it('works with no openspec/ directory and no other OpenSpec scaffolding present', () => {
    expect(fs.existsSync(path.join(tmpDir, 'openspec'))).toBe(false);
    installAgentSkills('claude', tmpDir, 'native');
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'oprim-spec', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'openspec'))).toBe(false);
  });

  it('installs oprim-spec for cursor, poolside, and vibe when framework is native', () => {
    installAgentSkills('cursor', tmpDir, 'native');
    expect(fs.existsSync(path.join(tmpDir, '.cursor', 'skills', 'oprim-spec', 'SKILL.md'))).toBe(true);

    installAgentSkills('poolside', tmpDir, 'native');
    expect(fs.existsSync(path.join(tmpDir, '.poolside', 'skills', 'oprim-spec', 'SKILL.md'))).toBe(true);

    installAgentSkills('vibe', tmpDir, 'native');
    expect(fs.existsSync(path.join(tmpDir, '.vibe', 'skills', 'oprim-spec', 'SKILL.md'))).toBe(true);
  });
});

// bet-023 — promoteContent branches on the selected speccing framework ─────────

describe('promote command branches on speccing framework', () => {
  it('openspec framework: promote.md keeps the existing OpenSpec delegation path', () => {
    installAgentSkills('claude', tmpDir, 'openspec');
    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'oprim', 'promote.md'), 'utf-8');
    expect(content).toContain('A. Bet → OpenSpec change');
    expect(content).toContain('openspec-propose');
    expect(content).not.toContain('oprim-spec');
  });

  it('native framework: promote.md invokes oprim-spec and links oprim/specs path, no OpenSpec', () => {
    installAgentSkills('claude', tmpDir, 'native');
    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'oprim', 'promote.md'), 'utf-8');
    expect(content).toContain('A. Bet → native oprim spec');
    expect(content).toContain('oprim-spec');
    expect(content).toContain('oprim/specs/<capability>/spec.md');
    expect(content).not.toContain('openspec-propose');
  });

  it('none framework: promote.md stops without creating a spec artifact', () => {
    installAgentSkills('claude', tmpDir, 'none');
    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'oprim', 'promote.md'), 'utf-8');
    expect(content).toContain('A. Bet → spec (no framework configured)');
    expect(content).toContain('no speccing framework is configured');
    expect(content).not.toContain('openspec-propose');
    expect(content).not.toContain('oprim-spec');
  });

  it('branches the same way for the Cursor oprim-promote.md command', () => {
    installAgentSkills('cursor', tmpDir, 'native');
    const content = fs.readFileSync(path.join(tmpDir, '.cursor', 'commands', 'oprim-promote.md'), 'utf-8');
    expect(content).toContain('A. Bet → native oprim spec');
    expect(content).toContain('oprim-spec');
  });
});

// bet-024 — spec-dir lifecycle: delta authoring writes under the bet dir ───────

describe('oprim-spec skill — delta authoring scoped to an active bet (bet-024)', () => {
  it('resolves an active bet and writes the delta under oprim/bets/pending/, not oprim/specs/ directly', () => {
    installAgentSkills('claude', tmpDir, 'native');
    const content = fs.readFileSync(
      path.join(tmpDir, '.claude', 'skills', 'oprim-spec', 'SKILL.md'),
      'utf-8'
    );

    expect(content).toContain('Which bet is this spec change for?');
    expect(content).toContain('oprim/bets/pending/<resolved-bet-dir>/specs/<capability>/spec.md');
    expect(content).toContain('never writes to \`oprim/specs/\` directly');
    expect(content).toContain('## ADDED Requirements');
    expect(content).toContain('## MODIFIED Requirements');
    expect(content).toContain('## REMOVED Requirements');
    // current-truth path still referenced as the header-matching source and eventual merge target
    expect(content).toContain('oprim/specs/<capability>/spec.md');
  });

  it('reports a bet-not-found stop condition when the bet id does not resolve', () => {
    installAgentSkills('claude', tmpDir, 'native');
    const content = fs.readFileSync(
      path.join(tmpDir, '.claude', 'skills', 'oprim-spec', 'SKILL.md'),
      'utf-8'
    );
    expect(content).toContain('spec deltas can only be authored against an active bet');
  });
});

describe('promote (native): links a delta path, not a direct current-truth write (bet-024)', () => {
  it('promote.md tells the agent to write a delta and defer merge to archive', () => {
    installAgentSkills('claude', tmpDir, 'native');
    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'oprim', 'promote.md'), 'utf-8');
    expect(content).toContain('oprim/bets/pending/BET-XXX/specs/<capability>/spec.md');
    expect(content).toContain('Spec (delta):');
    expect(content).toContain('merge-on-archive will fold the delta');
  });
});

// bet-024 — spec-dir lifecycle: merge-on-archive folds deltas into current truth

describe('oprim-archive skill — merge-on-archive spec-delta folding (bet-024)', () => {
  function readArchiveSkill(): string {
    installAgentSkills('claude', tmpDir, 'native');
    return fs.readFileSync(path.join(tmpDir, '.claude', 'skills', 'oprim-archive', 'SKILL.md'), 'utf-8');
  }

  it('detects a specs/ directory on the bet before moving it', () => {
    const content = readArchiveSkill();
    expect(content).toContain('oprim/bets/pending/<resolved-dir>/specs/');
    expect(content).toContain('Fold spec deltas into current truth');
  });

  it('matches requirements by ### Requirement: header text, whitespace-insensitive', () => {
    const content = readArchiveSkill();
    expect(content).toContain('### Requirement:');
    expect(content).toContain('whitespace-insensitive');
  });

  it('describes fold logic for ADDED, MODIFIED, and REMOVED deltas', () => {
    const content = readArchiveSkill();
    expect(content).toContain('**ADDED**: append the requirement block');
    expect(content).toContain('**MODIFIED**: find the existing');
    expect(content).toContain('**REMOVED**: find and delete the matching block');
  });

  it('creates oprim/specs/<capability>/spec.md when absent and the delta is entirely ADDED', () => {
    const content = readArchiveSkill();
    expect(content).toContain('create \`oprim/specs/<capability>/spec.md\`');
    expect(content).toContain('entirely \`## ADDED Requirements\`');
  });

  it('errors instead of silently proceeding when MODIFIED/REMOVED target a non-existent current-truth capability', () => {
    const content = readArchiveSkill();
    expect(content).toContain('no current-truth spec exists yet for this capability');
  });

  it('skips the fold step entirely and preserves prior behavior when no specs/ dir is present', () => {
    const content = readArchiveSkill();
    expect(content).toContain('skip this step entirely and go to Step 5');
    expect(content).toContain('archive behavior is unchanged from before spec deltas existed');
  });

  it('warns on concurrent delta overlaps with another still-active bet before archiving', () => {
    const content = readArchiveSkill();
    expect(content).toContain('concurrent') ; // combined warning intro references delta overlaps
    expect(content).toContain('overlap');
    expect(content).toContain('Archiving BET-005 now applies its version');
  });

  it('documents last-write-wins (no 3-way merge) for overlapping requirement deltas across sequential archives', () => {
    const content = readArchiveSkill();
    expect(content).toContain('last-write-wins');
    expect(content).toContain('no 3-way merge');
  });

  it('reports merged capabilities alongside the existing archive report fields', () => {
    const content = readArchiveSkill();
    expect(content).toContain('**Spec deltas merged:**');
    expect(content).toContain('**Archived to:**');
    expect(content).toContain('**Removed from sequence.yaml:**');
  });
});

describe('archive workflow inline content mentions the merge step for Codex/Gemini/Poolside (bet-024)', () => {
  it('codexInstructions includes the spec-delta fold step in the archive section', () => {
    const content = codexInstructions();
    expect(content).toContain('fold each capability');
    expect(content).toContain('last-write-wins on overlaps');
  });
});

// bet-033 — oprim-spec generates proposal/design/tasks on first invocation ────

describe('oprim-spec skill — proposal/design/tasks generation gate (bet-033)', () => {
  function readSpecSkill(): string {
    installAgentSkills('claude', tmpDir, 'native');
    return fs.readFileSync(path.join(tmpDir, '.claude', 'skills', 'oprim-spec', 'SKILL.md'), 'utf-8');
  }

  it('checks for existing design/tasks before writing the spec delta', () => {
    const content = readSpecSkill();
    expect(content).toContain('Check for existing design/tasks artifacts');
    expect(content).toContain('already exist in `oprim/bets/pending/<resolved-bet-dir>/`');
    expect(content).not.toContain('proposal.md');
  });

  it('describes drafting both artifacts only on the first invocation', () => {
    const content = readSpecSkill();
    expect(content).toContain('Draft design.md and tasks.md (first invocation only)');
    expect(content).toContain('**`design.md`**');
    expect(content).toContain('**`tasks.md`**');
    expect(content).toContain('- [ ] N.M <task description>');
  });

  it('skips artifact generation and only writes the delta on a later invocation', () => {
    const content = readSpecSkill();
    expect(content).toContain('skip Step 6 entirely and go straight to Step 7');
  });

  it('updates the report step to mention the new artifacts', () => {
    const content = readSpecSkill();
    expect(content).toContain('also report the `design.md` and `tasks.md` paths');
    expect(content).toContain('left untouched');
  });
});

// bet-033 — oprim-archive warns on an incomplete tasks.md before archiving ────

describe('oprim-archive skill — tasks.md completion warning (bet-033)', () => {
  function readArchiveSkill(): string {
    installAgentSkills('claude', tmpDir, 'native');
    return fs.readFileSync(path.join(tmpDir, '.claude', 'skills', 'oprim-archive', 'SKILL.md'), 'utf-8');
  }

  it('counts unchecked tasks.md items before the move step', () => {
    const content = readArchiveSkill();
    expect(content).toContain('count the number of unchecked `- [ ]` items');
    expect(content).toContain('incomplete-tasks warning');
  });

  it('folds the tasks.md warning into the existing confirm-to-proceed prompt', () => {
    const content = readArchiveSkill();
    expect(content).toContain('Archive BET-NNN anyway? (y/N)');
    expect(content).toContain('unchecked item(s) — implementation may be incomplete');
  });

  it('contributes nothing to the warning when tasks.md is absent or fully checked', () => {
    const content = readArchiveSkill();
    expect(content).toContain("this contributes nothing to the warning");
  });
});

describe('archive workflow inline content mentions the tasks.md check for Codex/Gemini/Poolside (bet-033)', () => {
  it('codexInstructions includes the tasks.md unchecked-item check in the archive section', () => {
    const content = codexInstructions();
    expect(content).toContain('unchecked `- [ ]` items');
  });
});

// bet-023 — framework selection offers a native choice ─────────────────────────

describe('promptFrameworkSelection', () => {
  it('offers native, openspec, and none as choices when prompting', async () => {
    const { promptFrameworkSelection } = await import('../lib/install-agent');
    const { select } = await import('@inquirer/prompts');
    vi.mocked(select).mockResolvedValueOnce('native' as never);

    const result = await promptFrameworkSelection(tmpDir);

    expect(result).toBe('native');
    const call = vi.mocked(select).mock.calls[0][0] as { choices: Array<{ value: string }> };
    const values = call.choices.map((c) => c.value);
    expect(values).toEqual(['native', 'openspec', 'none']);
  });

  it('returns the persisted oprim/config.yaml value without prompting', async () => {
    const { promptFrameworkSelection } = await import('../lib/install-agent');
    const { select } = await import('@inquirer/prompts');
    const selectMock = vi.mocked(select).mockClear();

    fs.mkdirSync(path.join(tmpDir, 'oprim'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'oprim', 'config.yaml'),
      'integrations:\n  spec_framework: native\n'
    );

    const result = await promptFrameworkSelection(tmpDir);

    expect(result).toBe('native');
    expect(selectMock).not.toHaveBeenCalled();
  });
});

// bet-020 — PDR surfacing opt-in defaults to true ───────────────────────────

describe('promptPdrSurfacing', () => {
  it('prompts with default: true and "(Y/n)" copy', async () => {
    const { promptPdrSurfacing } = await import('../lib/install-agent');
    const { confirm } = await import('@inquirer/prompts');
    vi.mocked(confirm).mockResolvedValueOnce(true as never);

    const result = await promptPdrSurfacing();

    expect(result).toBe(true);
    const call = vi.mocked(confirm).mock.calls[0][0] as { message: string; default: boolean };
    expect(call.default).toBe(true);
    expect(call.message).toContain('(Y/n)');
  });

  it('lets the user opt out by answering "n"', async () => {
    const { promptPdrSurfacing } = await import('../lib/install-agent');
    const { confirm } = await import('@inquirer/prompts');
    vi.mocked(confirm).mockResolvedValueOnce(false as never);

    const result = await promptPdrSurfacing();

    expect(result).toBe(false);
  });
});

// bet-027 — declarative workflow schemas: project-level oprim/workflows/ overrides ─────────

describe('project-level workflow overrides (bet-027)', () => {
  it('oprim update picks up a project oprim/workflows/<name>.template.md override and reflects it in the installed skill file', () => {
    fs.mkdirSync(path.join(tmpDir, 'oprim', 'workflows'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'oprim', 'workflows', 'bet.template.md'),
      '---\nname: oprim-bet\ndescription: Custom forked bet workflow\n---\n\nCustom forked bet body.\n'
    );

    installAgentSkills('claude', tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'skills', 'oprim-bet', 'SKILL.md'), 'utf-8');
    expect(content).toContain('Custom forked bet body.');
    expect(content).not.toContain('Naming tip');
  });

  it('does not affect other, non-overridden workflows', () => {
    fs.mkdirSync(path.join(tmpDir, 'oprim', 'workflows'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'oprim', 'workflows', 'bet.template.md'), 'Custom forked bet body.\n');

    installAgentSkills('claude', tmpDir);

    const pdrContent = fs.readFileSync(path.join(tmpDir, '.claude', 'skills', 'oprim-pdr', 'SKILL.md'), 'utf-8');
    expect(pdrContent).toBe(CLAUDE_SKILLS['oprim-pdr']);
  });

  it('a schema-only override changes metadata while the bundled template is still used', () => {
    fs.mkdirSync(path.join(tmpDir, 'oprim', 'workflows'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'oprim', 'workflows', 'archive.schema.yaml'),
      [
        'id: archive',
        'skillName: oprim-archive',
        'title: "OPRIM: Custom Archive Title"',
        'description: Archive a completed bet — move it out of the active board',
        'claude:',
        '  skill: true',
        '  command: archive.md',
        'cursor:',
        '  skill: false',
        '  command: null',
        'poolside:',
        '  skill: true',
        'inline: true',
      ].join('\n')
    );

    installAgentSkills('claude', tmpDir);

    const cmdContent = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'oprim', 'archive.md'), 'utf-8');
    expect(cmdContent).toContain('name: "OPRIM: Custom Archive Title"');

    const skillContent = fs.readFileSync(
      path.join(tmpDir, '.claude', 'skills', 'oprim-archive', 'SKILL.md'),
      'utf-8'
    );
    expect(skillContent).toBe(CLAUDE_SKILLS['oprim-archive']); // template itself is untouched
  });

  it('a malformed override causes oprim update to fail loudly, naming the file, rather than silently using the bundled default', () => {
    fs.mkdirSync(path.join(tmpDir, 'oprim', 'workflows'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'oprim', 'workflows', 'bet.schema.yaml'), 'not: [valid yaml');

    expect(() => installAgentSkills('claude', tmpDir)).toThrowError(/bet\.schema\.yaml/);
  });
});

// bet-027 — every bundled workflow renders byte-identical output on a fresh install (5.3) ────

describe('fresh install renders every bundled workflow (bet-027)', () => {
  it('installs all 8 Claude skills, 4 commands, and every Cursor/Poolside/Vibe skill matching the bundled exports', () => {
    installAgentSkills('claude', tmpDir);
    for (const [name, expected] of Object.entries(CLAUDE_SKILLS)) {
      expect(fs.readFileSync(path.join(tmpDir, '.claude', 'skills', name, 'SKILL.md'), 'utf-8')).toBe(expected);
    }
    for (const [filename, expected] of Object.entries(CLAUDE_COMMANDS)) {
      expect(fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'oprim', filename), 'utf-8')).toBe(expected);
    }

    installAgentSkills('poolside', tmpDir);
    for (const [name, expected] of Object.entries(POOLSIDE_SKILLS)) {
      expect(fs.readFileSync(path.join(tmpDir, '.poolside', 'skills', name, 'SKILL.md'), 'utf-8')).toBe(expected);
    }

    installAgentSkills('vibe', tmpDir);
    for (const [name, expected] of Object.entries(VIBE_SKILLS)) {
      expect(fs.readFileSync(path.join(tmpDir, '.vibe', 'skills', name, 'SKILL.md'), 'utf-8')).toBe(expected);
    }

    installAgentSkills('cursor', tmpDir);
    for (const [filename, expected] of Object.entries(CURSOR_COMMANDS)) {
      expect(fs.readFileSync(path.join(tmpDir, '.cursor', 'commands', filename), 'utf-8')).toBe(expected);
    }
  });
});
