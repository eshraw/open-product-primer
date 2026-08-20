import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { listCommand } from '../commands/list';

let tmpDir: string;
let logLines: string[];

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-list-command-test-'));
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  logLines = [];
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    logLines.push(args.map(String).join(' '));
  });
  process.exitCode = undefined;
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

function writeBet(sub: 'pending' | 'archived', dirName: string, title: string, status: string): void {
  const dir = path.join(tmpDir, 'oprim', 'bets', sub, dirName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'bet-decision.md'),
    `# Decision: ${dirName.match(/^BET-\d+/)![0]} ${title}\n\n## Status\n- Decision: ${status}\n`,
    'utf-8'
  );
}

function writeDecision(fileName: string, title: string, status: string): void {
  const dir = path.join(tmpDir, 'oprim', 'decisions');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), `# ${fileName.match(/^PDR-\d+/)![0]}: ${title}\n\n## Status\n${status}\n`, 'utf-8');
}

function writeNote(fileName: string, title: string, tags: string[]): void {
  const dir = path.join(tmpDir, 'oprim', 'notes');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, fileName),
    `---\ntype: note\ntitle: "${title}"\ntags: [${tags.join(', ')}]\ntimestamp: 2026-01-01T00:00:00Z\n---\n\n# Note: ${title}\n`,
    'utf-8'
  );
}

async function runList(args: string[]): Promise<void> {
  await listCommand().parseAsync(args, { from: 'user' });
}

describe('oprim list — type filters', () => {
  it('4.1 lists bets by default with no type flag', async () => {
    writeBet('pending', 'BET-001-alpha', 'Alpha', 'Build now');
    await runList(['--json']);
    const parsed = JSON.parse(logLines[0]!);
    expect(parsed.bets).toHaveLength(1);
    expect(parsed.decisions).toBeUndefined();
    expect(parsed.notes).toBeUndefined();
  });

  it('4.1 lists only requested type when a single flag is passed', async () => {
    writeBet('pending', 'BET-001-alpha', 'Alpha', 'Build now');
    writeNote('NOTE-001-idea.md', 'An idea', ['tag1']);
    await runList(['--notes', '--json']);
    const parsed = JSON.parse(logLines[0]!);
    expect(parsed.notes).toHaveLength(1);
    expect(parsed.bets).toBeUndefined();
  });

  it('4.1 combines multiple type flags', async () => {
    writeBet('pending', 'BET-001-alpha', 'Alpha', 'Build now');
    writeDecision('PDR-001-decision.md', 'A decision', 'Accepted');
    await runList(['--bets', '--decisions', '--json']);
    const parsed = JSON.parse(logLines[0]!);
    expect(parsed.bets).toHaveLength(1);
    expect(parsed.decisions).toHaveLength(1);
    expect(parsed.notes).toBeUndefined();
  });

  it('4.1 human-readable table includes bet id, title, and status', async () => {
    writeBet('pending', 'BET-001-alpha', 'Alpha bet', 'Build now');
    await runList(['--bets']);
    const output = logLines.join('\n');
    expect(output).toContain('BET-001');
    expect(output).toContain('Alpha bet');
    expect(output).toContain('Build now');
  });

  it('4.1 includes bets from both pending and archived', async () => {
    writeBet('pending', 'BET-001-alpha', 'Alpha', 'Build now');
    writeBet('archived', 'BET-002-beta', 'Beta', 'Build now');
    await runList(['--bets', '--json']);
    const parsed = JSON.parse(logLines[0]!);
    const ids = parsed.bets.map((b: { id: string }) => b.id);
    expect(ids).toEqual(expect.arrayContaining(['BET-001', 'BET-002']));
  });
});

describe('oprim list — JSON output', () => {
  it('4.1 prints a single JSON document with { id, title, status, path } entries', async () => {
    writeBet('pending', 'BET-001-alpha', 'Alpha', 'Build now');
    await runList(['--bets', '--json']);
    expect(logLines).toHaveLength(1);
    const parsed = JSON.parse(logLines[0]!);
    expect(parsed.bets[0]).toMatchObject({ id: 'BET-001', title: 'Alpha', status: 'Build now' });
    expect(typeof parsed.bets[0].path).toBe('string');
  });
});
