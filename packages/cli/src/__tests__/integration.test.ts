import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initCommand } from '../commands/init';
import { updateCommand } from '../commands/update';
import { readAgentsFromConfig } from '../lib/detect';

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
});

// 7.4 ─────────────────────────────────────────────────────────────────────────

describe('oprim init --agent claude', () => {
  it('scaffolds primer/ and installs Claude skills without a prompt', async () => {
    const cmd = initCommand();
    await cmd.parseAsync(['--agent', 'claude'], { from: 'user' });

    // primer/ structure created
    expect(fs.existsSync(path.join(tmpDir, 'primer', 'config.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'primer', 'sequence.yaml'))).toBe(true);

    // agents persisted to config
    expect(readAgentsFromConfig(tmpDir)).toEqual(['claude']);

    // Claude skills installed
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'oprim', 'pdr.md'))).toBe(true);
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
    // Bootstrap: primer with agents: [claude] and a pre-existing .cursor/
    fs.mkdirSync(path.join(tmpDir, 'primer'));
    fs.writeFileSync(
      path.join(tmpDir, 'primer', 'config.yaml'),
      'version: 1\nagents:\n  - claude\n'
    );
    fs.mkdirSync(path.join(tmpDir, '.cursor'), { recursive: true });

    const cmd = updateCommand();
    await cmd.parseAsync([], { from: 'user' });

    // Claude skills installed
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'oprim', 'pdr.md'))).toBe(true);

    // Cursor commands NOT installed (even though .cursor/ exists)
    expect(fs.existsSync(path.join(tmpDir, '.cursor', 'commands', 'oprim-pdr.md'))).toBe(false);
  });
});
