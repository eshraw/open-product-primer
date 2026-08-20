import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { statusCommand } from '../commands/status';

let tmpDir: string;
let logLines: string[];
let errorLines: string[];

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-status-command-test-'));
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  logLines = [];
  errorLines = [];
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    logLines.push(args.map(String).join(' '));
  });
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

function writeSequence(content: string): void {
  const dir = path.join(tmpDir, 'oprim');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'sequence.yaml'), content, 'utf-8');
}

async function runStatus(args: string[]): Promise<void> {
  await statusCommand().parseAsync(args, { from: 'user' });
}

describe('oprim status — human-readable', () => {
  it('4.3 prints each lane and its bets', async () => {
    writeSequence(`
wip_limits:
  now: 2
now:
  - id: BET-001
    title: Alpha
    blocked_by: []
    unlocks: []
next:
  - id: BET-002
    title: Beta
    blocked_by: []
    unlocks: []
later: []
backlog:
  - id: BET-003
    title: Gamma
    blocked_by: []
    unlocks: []
`);
    await runStatus([]);
    const output = logLines.join('\n');
    expect(output).toContain('NOW');
    expect(output).toContain('BET-001');
    expect(output).toContain('NEXT');
    expect(output).toContain('BET-002');
    expect(output).toContain('BACKLOG');
    expect(output).toContain('BET-003');
  });

  it('4.3 reports WIP limit usage', async () => {
    writeSequence(`
wip_limits:
  now: 2
now:
  - id: BET-001
    title: Alpha
    blocked_by: []
    unlocks: []
`);
    await runStatus([]);
    expect(logLines.join('\n')).toContain('1/2');
  });

  it('4.3 errors when sequence.yaml is missing', async () => {
    await runStatus([]);
    expect(errorLines.join('\n')).toContain("run 'oprim init' first");
    expect(process.exitCode).toBe(1);
  });
});

describe('oprim status — JSON output', () => {
  it('4.3 JSON shape matches sequence.yaml structure', async () => {
    writeSequence(`
wip_limits:
  now: 2
now:
  - id: BET-001
    title: Alpha
    blocked_by: []
    unlocks: []
next: []
later: []
backlog: []
`);
    await runStatus(['--json']);
    expect(logLines).toHaveLength(1);
    const parsed = JSON.parse(logLines[0]!);
    expect(parsed.wip_limits).toEqual({ now: 2 });
    expect(parsed.now).toHaveLength(1);
    expect(parsed.now[0]).toMatchObject({ id: 'BET-001', title: 'Alpha' });
    expect(parsed.next).toEqual([]);
    expect(parsed.later).toEqual([]);
    expect(parsed.backlog).toEqual([]);
  });
});
