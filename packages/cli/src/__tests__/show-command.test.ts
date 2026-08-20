import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { showCommand } from '../commands/show';

let tmpDir: string;
let logLines: string[];
let errorLines: string[];

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-show-command-test-'));
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

function writeBet(dirName: string, title: string, status: string): void {
  const dir = path.join(tmpDir, 'oprim', 'bets', 'pending', dirName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'bet-decision.md'),
    `# Decision: ${dirName.match(/^BET-\d+/)![0]} ${title}\n\n## Status\n- Decision: ${status}\n\n## Links\n- PDRs: None\n`,
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

async function runShow(args: string[]): Promise<void> {
  await showCommand().parseAsync(args, { from: 'user' });
}

describe('oprim show — resolves each artifact type', () => {
  it('4.2 shows a bet by ID', async () => {
    writeBet('BET-030-foo', 'Some bet', 'Build now');
    await runShow(['BET-030']);
    const output = logLines.join('\n');
    expect(output).toContain('BET-030');
    expect(output).toContain('Some bet');
    expect(output).toContain('Build now');
  });

  it('4.2 shows a decision by ID', async () => {
    writeDecision('PDR-005-foo.md', 'Some decision', 'Accepted');
    await runShow(['PDR-005']);
    const output = logLines.join('\n');
    expect(output).toContain('PDR-005');
    expect(output).toContain('Some decision');
  });

  it('4.2 shows a note by ID', async () => {
    writeNote('NOTE-012-foo.md', 'Some note', ['tagA']);
    await runShow(['NOTE-012']);
    const output = logLines.join('\n');
    expect(output).toContain('NOTE-012');
    expect(output).toContain('Some note');
  });

  it('4.2 resolves loosely formatted IDs (bet-30, 30)', async () => {
    writeBet('BET-030-foo', 'Some bet', 'Build now');
    await runShow(['bet-30']);
    expect(logLines.join('\n')).toContain('Some bet');
  });
});

describe('oprim show — JSON output', () => {
  it('4.2 JSON shape includes type, id, path, fields, and content', async () => {
    writeBet('BET-030-foo', 'Some bet', 'Build now');
    await runShow(['BET-030', '--json']);
    expect(logLines).toHaveLength(1);
    const parsed = JSON.parse(logLines[0]!);
    expect(parsed).toMatchObject({ type: 'bet', id: 'BET-030', title: 'Some bet', status: 'Build now' });
    expect(typeof parsed.path).toBe('string');
    expect(typeof parsed.content).toBe('string');
  });
});

describe('oprim show — unresolvable ID', () => {
  it('4.2 reports an error and exits non-zero', async () => {
    await runShow(['BET-999']);
    expect(errorLines.join('\n')).toContain('not found');
    expect(process.exitCode).toBe(1);
  });

  it('4.2 reports an error for an unmatched PDR ID', async () => {
    await runShow(['PDR-999']);
    expect(errorLines.join('\n')).toContain('not found');
    expect(process.exitCode).toBe(1);
  });
});
