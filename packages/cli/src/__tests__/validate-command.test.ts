import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateCommand } from '../commands/validate';

let tmpDir: string;
let logLines: string[];
let errorLines: string[];

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-validate-command-test-'));
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

// ── exit codes ────────────────────────────────────────────────────────────────

describe('oprim validate — exit codes', () => {
  it('4.5 exits 0 when there are no required check failures', async () => {
    await validateCommand().parseAsync([], { from: 'user' });
    expect(process.exitCode).toBeUndefined();
  });

  it('4.5 exits non-zero when a required check fails', async () => {
    writeSequence(`
wip_limits:
  now: 2
now:
  - id: BET-001
    blocked_by: [BET-999]
    unlocks: []
`);
    // dangling blocked_by is required: false in checkSequenceIntegrity, so use a
    // spec-delta drift failure (required: true) to exercise the required-failure path.
    const betsDir = path.join(tmpDir, 'oprim', 'bets', 'pending');
    fs.mkdirSync(path.join(betsDir, 'BET-040-foo', 'specs', 'checkout'), { recursive: true });
    fs.writeFileSync(
      path.join(betsDir, 'BET-040-foo', 'specs', 'checkout', 'spec.md'),
      '## MODIFIED Requirements\n\n### Requirement: The system SHALL do X\n\nBody.\n',
      'utf-8'
    );

    await validateCommand().parseAsync([], { from: 'user' });
    expect(process.exitCode).toBe(1);
  });

  it('4.4 --strict exits non-zero on a non-required failure alone', async () => {
    // checkSkillVersionDrift only fires when .claude/skills/ exists with a known skill name
    const skillDir = path.join(tmpDir, '.claude', 'skills', 'oprim-bet');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# stale content\n', 'utf-8');

    await validateCommand().parseAsync(['--strict'], { from: 'user' });
    expect(process.exitCode).toBe(1);
  });

  it('4.5 non-strict mode tolerates a non-required failure', async () => {
    const skillDir = path.join(tmpDir, '.claude', 'skills', 'oprim-bet');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# stale content\n', 'utf-8');

    await validateCommand().parseAsync([], { from: 'user' });
    expect(process.exitCode).toBeUndefined();

    const allOutput = logLines.join('\n');
    expect(allOutput).toContain('oprim-bet is out of date');
  });
});

// ── --json ──────────────────────────────────────────────────────────────────

describe('oprim validate — --json', () => {
  it('4.3 prints a single JSON document with a checks array and no human-readable text', async () => {
    await validateCommand().parseAsync(['--json'], { from: 'user' });

    expect(logLines).toHaveLength(1);
    const parsed = JSON.parse(logLines[0]!);
    expect(Array.isArray(parsed.checks)).toBe(true);
  });
});

// ── --diff ──────────────────────────────────────────────────────────────────

describe('oprim validate — --diff', () => {
  it('4.6 previews a delta against existing current truth without writing files', async () => {
    const specsDir = path.join(tmpDir, 'oprim', 'specs', 'checkout');
    fs.mkdirSync(specsDir, { recursive: true });
    const currentTruthPath = path.join(specsDir, 'spec.md');
    fs.writeFileSync(currentTruthPath, '## Requirements\n\n### Requirement: A\n\nBody A.\n', 'utf-8');
    const before = fs.readFileSync(currentTruthPath, 'utf-8');

    const betDeltaDir = path.join(tmpDir, 'oprim', 'bets', 'pending', 'BET-030-foo', 'specs', 'checkout');
    fs.mkdirSync(betDeltaDir, { recursive: true });
    fs.writeFileSync(
      path.join(betDeltaDir, 'spec.md'),
      '## ADDED Requirements\n\n### Requirement: B\n\nBody B.\n',
      'utf-8'
    );

    await validateCommand().parseAsync(['--diff', 'BET-030'], { from: 'user' });

    const allOutput = logLines.join('\n');
    expect(allOutput).toContain('### Requirement: A');
    expect(allOutput).toContain('### Requirement: B');
    expect(fs.readFileSync(currentTruthPath, 'utf-8')).toBe(before);
  });

  it('4.6 reports no spec deltas when the bet has no specs/ directory', async () => {
    fs.mkdirSync(path.join(tmpDir, 'oprim', 'bets', 'pending', 'BET-031-bar'), { recursive: true });

    await validateCommand().parseAsync(['--diff', 'BET-031'], { from: 'user' });

    const allOutput = logLines.join('\n');
    expect(allOutput).toContain('no spec deltas to preview');
    expect(process.exitCode).toBeUndefined();
  });

  it('4.6 reports an error and exits non-zero for an unresolvable bet ID', async () => {
    fs.mkdirSync(path.join(tmpDir, 'oprim', 'bets', 'pending'), { recursive: true });

    await validateCommand().parseAsync(['--diff', 'BET-999'], { from: 'user' });

    const allOutput = errorLines.join('\n');
    expect(allOutput).toContain('not found');
    expect(process.exitCode).toBe(1);
  });
});
