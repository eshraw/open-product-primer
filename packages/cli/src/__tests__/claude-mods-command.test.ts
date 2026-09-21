import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkbox, confirm } from '@inquirer/prompts';
import { claudeModsCommand } from '../commands/claude-mods';
import { readClaudeModsFromConfig } from '../lib/detect';

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn().mockResolvedValue([]),
  confirm: vi.fn().mockResolvedValue(false),
}));

let tmpDir: string;
let errorLines: string[];

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-claude-mods-command-test-'));
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  vi.mocked(checkbox).mockReset().mockResolvedValue([]);
  vi.mocked(confirm).mockReset().mockResolvedValue(false);
  errorLines = [];
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errorLines.push(args.map(String).join(' '));
  });
  process.exitCode = undefined;
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

function writeConfig(agents: string[], claudeMods: string[] = []): void {
  const primerDir = path.join(tmpDir, 'oprim');
  fs.mkdirSync(primerDir, { recursive: true });
  const agentsYaml = agents.length ? `agents:\n${agents.map((a) => `  - ${a}`).join('\n')}\n` : 'agents: []\n';
  const modsYaml = claudeMods.length ? `claude_mods:\n${claudeMods.map((m) => `  - ${m}`).join('\n')}\n` : 'claude_mods: []\n';
  fs.writeFileSync(path.join(primerDir, 'config.yaml'), `version: 1\n${agentsYaml}${modsYaml}`);
}

async function run(args: string[] = []): Promise<void> {
  await claudeModsCommand().parseAsync(args, { from: 'user' });
}

describe('claudeModsCommand', () => {
  it('exits with an error when claude is not in the configured agents', async () => {
    writeConfig(['cursor']);
    fs.mkdirSync(path.join(tmpDir, '.cursor'), { recursive: true });

    await run();

    expect(process.exitCode).toBe(1);
    expect(errorLines.some((l) => l.includes('Claude Code is not installed'))).toBe(true);
  });

  it('exits with an error when oprim/config.yaml has no agents at all', async () => {
    await run();
    expect(process.exitCode).toBe(1);
  });

  it('pre-checks previously-installed mods in the prompt', async () => {
    writeConfig(['claude'], ['spec-delta-drift-interceptor']);
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
    vi.mocked(checkbox).mockResolvedValueOnce(['spec-delta-drift-interceptor']);

    await run();

    const choices = vi.mocked(checkbox).mock.calls[0]![0].choices as Array<{ value: string; checked?: boolean }>;
    expect(choices.find((c) => c.value === 'spec-delta-drift-interceptor')?.checked).toBe(true);
    expect(readClaudeModsFromConfig(tmpDir)).toEqual(['spec-delta-drift-interceptor']);
  });

  it('installs the mod and offers to enable function hooks when none are selected yet', async () => {
    writeConfig(['claude']);
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
    vi.mocked(checkbox).mockResolvedValueOnce(['spec-delta-drift-interceptor']);
    vi.mocked(confirm).mockResolvedValueOnce(true);

    await run();

    expect(confirm).toHaveBeenCalled();
    const settings = JSON.parse(fs.readFileSync(path.join(tmpDir, '.claude', 'settings.json'), 'utf-8'));
    expect(settings.env.CLAUDE_CODE_ENABLE_FUNCTION_HOOKS).toBe('1');
  });

  it('does not prompt to enable function hooks when zero mods are selected', async () => {
    writeConfig(['claude']);
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
    vi.mocked(checkbox).mockResolvedValueOnce([]);

    await run();

    expect(confirm).not.toHaveBeenCalled();
  });

  it('removing every mod uninstalls all mod hook entries', async () => {
    writeConfig(['claude'], ['spec-delta-drift-interceptor']);
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
    vi.mocked(checkbox).mockResolvedValueOnce([]);

    await run();

    expect(readClaudeModsFromConfig(tmpDir)).toEqual([]);
  });

  it('--update reinstalls currently-selected mods without prompting or changing the selection', async () => {
    writeConfig(['claude'], ['spec-delta-drift-interceptor']);
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
    const registerPath = path.join(
      tmpDir,
      '.claude',
      'skills',
      'spec-delta-drift-interceptor',
      'hooks',
      'register.js'
    );
    fs.mkdirSync(path.dirname(registerPath), { recursive: true });
    fs.writeFileSync(registerPath, '// stale installed content');

    await run(['--update']);

    expect(checkbox).not.toHaveBeenCalled();
    expect(readClaudeModsFromConfig(tmpDir)).toEqual(['spec-delta-drift-interceptor']);
    const content = fs.readFileSync(registerPath, 'utf-8');
    expect(content).not.toContain('stale installed content');
  });

  it('--update is a no-op when no mods are installed', async () => {
    writeConfig(['claude']);
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });

    await run(['--update']);

    expect(checkbox).not.toHaveBeenCalled();
    expect(readClaudeModsFromConfig(tmpDir)).toEqual([]);
  });
});
