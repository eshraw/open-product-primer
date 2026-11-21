// BET-075 task 1 — product-mode safety net. These snapshots capture the full file tree (path →
// sha256 of contents) produced by `oprim init` / `oprim update` in product mode. They were
// recorded BEFORE portfolio mode was added and must stay unchanged: product mode is
// byte-identical by test, not by care (see BET-075 design.md §2 and the kill criterion).
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initCommand } from '../commands/init';
import { updateCommand } from '../commands/update';
import { checkbox, confirm, select } from '@inquirer/prompts';

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn().mockResolvedValue([]),
  confirm: vi.fn().mockResolvedValue(false),
  select: vi.fn().mockResolvedValue('openspec'),
}));

const ALL_AGENTS = ['claude', 'cursor', 'codex', 'gemini', 'poolside', 'vibe', 'qwen', 'kimi', 'dsh'];

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-parity-'));
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

export function snapshotTree(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = path.join(dir, entry.name);
      const rel = path.relative(root, abs).split(path.sep).join('/');
      if (entry.isDirectory()) {
        out[rel + '/'] = 'dir';
        walk(abs);
      } else {
        out[rel] = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex').slice(0, 16);
      }
    }
  };
  walk(root);
  return out;
}

async function runInit(framework: string, okf: boolean, agents: string[] = ['claude']): Promise<void> {
  vi.mocked(select).mockResolvedValue(framework);
  // confirm() order: OKF opt-in, then PDR surfacing (claude), then nothing else (no mods selected)
  vi.mocked(confirm).mockResolvedValueOnce(okf).mockResolvedValue(false);
  const args = ['--name', 'fixture'];
  for (const a of agents) args.push('--agent', a);
  await initCommand().parseAsync(args, { from: 'user' });
}

describe('product-mode parity — oprim init', () => {
  for (const framework of ['openspec', 'native', 'none']) {
    for (const okf of [false, true]) {
      it(`init framework=${framework} okf=${okf}`, async () => {
        await runInit(framework, okf);
        expect(snapshotTree(tmpDir)).toMatchSnapshot();
      });
    }
  }
});

describe('product-mode parity — oprim update', () => {
  it('update on an existing product workspace leaves config.yaml unchanged when schema is current', async () => {
    await runInit('openspec', false);
    const configPath = path.join(tmpDir, 'oprim', 'config.yaml');
    const before = fs.readFileSync(configPath, 'utf-8');

    vi.mocked(select).mockResolvedValue('openspec');
    vi.mocked(confirm).mockReset().mockResolvedValue(false);
    await updateCommand().parseAsync([], { from: 'user' });

    expect(fs.readFileSync(configPath, 'utf-8')).toBe(before);
    expect(snapshotTree(tmpDir)).toMatchSnapshot();
  });

  it('install parity: update with every agent selected', async () => {
    await runInit('native', false, ALL_AGENTS);
    vi.mocked(select).mockResolvedValue('native');
    vi.mocked(confirm).mockReset().mockResolvedValue(false);
    await updateCommand().parseAsync([], { from: 'user' });

    expect(snapshotTree(tmpDir)).toMatchSnapshot();
    // The inline block is the one place install-list ORDER changes file bytes — pin it verbatim.
    expect(fs.readFileSync(path.join(tmpDir, 'AGENTS.md'), 'utf-8')).toMatchSnapshot();
  });
});
