import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { installAgentSkills } from '../lib/install-agent';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-test-'));
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
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
