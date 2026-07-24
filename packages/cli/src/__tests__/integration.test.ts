import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initCommand } from '../commands/init';
import { updateCommand } from '../commands/update';
import { readAgentsFromConfig } from '../lib/detect';
import { confirm } from '@inquirer/prompts';

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn().mockResolvedValue([]),
  confirm: vi.fn().mockResolvedValue(false),
  select: vi.fn().mockResolvedValue('openspec'),
}));

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-test-'));
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
  vi.mocked(confirm).mockReset().mockResolvedValue(false);
});

// 7.4 ─────────────────────────────────────────────────────────────────────────

describe('oprim init --agent claude', () => {
  it('scaffolds oprim/ and installs Claude skills without a prompt', async () => {
    const cmd = initCommand();
    await cmd.parseAsync(['--agent', 'claude'], { from: 'user' });

    // oprim/ structure created
    expect(fs.existsSync(path.join(tmpDir, 'oprim', 'config.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'oprim', 'sequence.yaml'))).toBe(true);

    // agents persisted to config
    expect(readAgentsFromConfig(tmpDir)).toEqual(['claude']);

    // Claude skills installed
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'oprim', 'promote.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'oprim-pdr', 'SKILL.md'))).toBe(true);

    // Cursor NOT installed
    expect(fs.existsSync(path.join(tmpDir, '.cursor'))).toBe(false);
  });
});

// 7.5 ─────────────────────────────────────────────────────────────────────────

describe('oprim init --agent unknown', () => {
  it('exits non-zero with an error message listing supported agents', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(
      initCommand().parseAsync(['--agent', 'unknown-tool'], { from: 'user' })
    ).rejects.toThrow('process.exit called');

    expect(exitSpy).toHaveBeenCalledWith(1);

    const errorOutput = errorSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
    expect(errorOutput).toContain('unknown-tool');
    expect(errorOutput).toContain('claude');
    expect(errorOutput).toContain('cursor');
  });
});

// 7.6 ─────────────────────────────────────────────────────────────────────────

describe('oprim update with agents: [claude] in config', () => {
  it('installs only Claude skills even when .cursor/ exists', async () => {
    // Bootstrap: oprim with agents: [claude] and a pre-existing .cursor/
    fs.mkdirSync(path.join(tmpDir, 'oprim'));
    fs.writeFileSync(
      path.join(tmpDir, 'oprim', 'config.yaml'),
      'version: 1\nagents:\n  - claude\n'
    );
    fs.mkdirSync(path.join(tmpDir, '.cursor'), { recursive: true });

    const cmd = updateCommand();
    await cmd.parseAsync([], { from: 'user' });

    // Claude skills installed
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'oprim', 'promote.md'))).toBe(true);

    // Cursor commands NOT installed (even though .cursor/ exists)
    expect(fs.existsSync(path.join(tmpDir, '.cursor', 'commands', 'oprim-pdr.md'))).toBe(false);
  });
});

// 5.1 / 5.2 — OKF frontmatter opt-in / opt-out ─────────────────────────────────

describe('oprim init — OKF frontmatter opted in', () => {
  it('writes okf.enabled: true, frontmattered templates, and index.md', async () => {
    // 1st confirm() call = OKF opt-in prompt, 2nd = PDR-surfacing prompt
    vi.mocked(confirm).mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const cmd = initCommand();
    await cmd.parseAsync(['--agent', 'claude'], { from: 'user' });

    const configContent = fs.readFileSync(path.join(tmpDir, 'oprim', 'config.yaml'), 'utf-8');
    expect(configContent).toContain('okf:\n  enabled: true');

    const pdrContent = fs.readFileSync(path.join(tmpDir, 'oprim', 'templates', 'pdr.md'), 'utf-8');
    expect(pdrContent.startsWith('---\ntype: pdr')).toBe(true);

    const betContent = fs.readFileSync(path.join(tmpDir, 'oprim', 'templates', 'bet-decision.md'), 'utf-8');
    expect(betContent.startsWith('---\ntype: bet-decision')).toBe(true);

    const kpiContent = fs.readFileSync(path.join(tmpDir, 'oprim', 'templates', 'kpi-review.md'), 'utf-8');
    expect(kpiContent.startsWith('---\ntype: kpi-review')).toBe(true);

    const criteriaContent = fs.readFileSync(path.join(tmpDir, 'oprim', 'templates', 'criteria.yaml'), 'utf-8');
    expect(criteriaContent.startsWith('---')).toBe(false);

    // Notes get the OKF tier too — frontmatter with a description field
    const noteContent = fs.readFileSync(path.join(tmpDir, 'oprim', 'templates', 'note.md'), 'utf-8');
    expect(noteContent.startsWith('---\ntype: note')).toBe(true);
    expect(noteContent).toContain('description:');

    const indexPath = path.join(tmpDir, 'oprim', 'index.md');
    expect(fs.existsSync(indexPath)).toBe(true);
    expect(fs.readFileSync(indexPath, 'utf-8')).toContain('type: index');
  });
});

describe('oprim init — OKF frontmatter declined', () => {
  it('writes okf.enabled: false, plain templates, and no index.md', async () => {
    const cmd = initCommand();
    await cmd.parseAsync(['--agent', 'claude'], { from: 'user' });

    const configContent = fs.readFileSync(path.join(tmpDir, 'oprim', 'config.yaml'), 'utf-8');
    expect(configContent).toContain('okf:\n  enabled: false');

    for (const file of ['pdr.md', 'bet-decision.md', 'kpi-review.md']) {
      const content = fs.readFileSync(path.join(tmpDir, 'oprim', 'templates', file), 'utf-8');
      expect(content.startsWith('---')).toBe(false);
    }

    // Notes still get minimal frontmatter even when OKF is declined — no description field
    const noteContent = fs.readFileSync(path.join(tmpDir, 'oprim', 'templates', 'note.md'), 'utf-8');
    expect(noteContent.startsWith('---\ntype: note')).toBe(true);
    expect(noteContent).not.toContain('description:');

    expect(fs.existsSync(path.join(tmpDir, 'oprim', 'index.md'))).toBe(false);
  });
});

describe('oprim init — notes directory', () => {
  it('creates oprim/notes/ with a .gitkeep regardless of OKF opt-in', async () => {
    const cmd = initCommand();
    await cmd.parseAsync(['--agent', 'claude'], { from: 'user' });

    expect(fs.existsSync(path.join(tmpDir, 'oprim', 'notes', '.gitkeep'))).toBe(true);
  });
});

// 5.3 — update respects persisted flag, no re-prompt, no template rewrite ──────

describe('oprim update — persisted OKF flag', () => {
  it('reads okf.enabled without re-prompting and does not rewrite templates', async () => {
    fs.mkdirSync(path.join(tmpDir, 'oprim', 'templates'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'oprim', 'config.yaml'),
      'version: 1\nagents:\n  - claude\nokf:\n  enabled: true\n'
    );
    const untouchedPdr = '---\ntype: pdr\ntitle: "hand-edited"\n---\n\n# PDR-XXX: <Decision title>\n';
    fs.writeFileSync(path.join(tmpDir, 'oprim', 'templates', 'pdr.md'), untouchedPdr);

    const logSpy = vi.spyOn(console, 'log');
    const cmd = updateCommand();
    await cmd.parseAsync([], { from: 'user' });

    // Template file untouched
    expect(fs.readFileSync(path.join(tmpDir, 'oprim', 'templates', 'pdr.md'), 'utf-8')).toBe(untouchedPdr);

    // Persisted flag was read and surfaced, not re-prompted
    const notices = logSpy.mock.calls.map((c) => String(c[0]));
    expect(notices.some((n) => n.includes('OKF frontmatter') && n.includes('enabled'))).toBe(true);
    expect(vi.mocked(confirm).mock.calls.some((call) => String(call[0]?.message).includes('OKF'))).toBe(false);
  });
});
