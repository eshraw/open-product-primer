import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installAgentSkills, writeAgentInstructionFile, codexInstructions, geminiInstructions, CLAUDE_COMMANDS } from '../lib/install-agent';

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
  it('contains all five workflow sections', () => {
    const content = codexInstructions();
    expect(content).toContain('oprim-bet');
    expect(content).toContain('oprim-criteria');
    expect(content).toContain('oprim-pdr');
    expect(content).toContain('oprim-review');
    expect(content).toContain('oprim-archive');
  });
});

describe('geminiInstructions', () => {
  it('contains all five workflow sections', () => {
    const content = geminiInstructions();
    expect(content).toContain('oprim-bet');
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
      for (const skill of ['oprim-pdr', 'oprim-bet', 'oprim-criteria', 'oprim-review']) {
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
      for (const skill of ['oprim-pdr', 'oprim-bet', 'oprim-criteria', 'oprim-review']) {
        const skillPath = path.join(tmpDir, '.cursor', 'skills', skill, 'SKILL.md');
        expect(fs.existsSync(skillPath)).toBe(true);
      }
    });

    it('creates .cursor/commands/ and command files', () => {
      installAgentSkills('cursor', tmpDir);
      for (const cmd of ['oprim-pdr.md', 'oprim-bet.md', 'oprim-criteria.md', 'oprim-review.md']) {
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
