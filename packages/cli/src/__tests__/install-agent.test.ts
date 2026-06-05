import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installAgentSkills, writeAgentInstructionFile, codexInstructions, geminiInstructions } from '../lib/install-agent';

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
