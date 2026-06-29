import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ovwCommand } from '../commands/ovw';

let tmpDir: string;
let logLines: string[];
let errLines: string[];

function writeSequenceYaml(content: string): void {
  const dir = path.join(tmpDir, 'oprim');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'sequence.yaml'), content);
}

function writeBetDecision(betId: string, slug: string, content: string): void {
  const dir = path.join(tmpDir, 'oprim', 'bets', `${betId}-${slug}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'bet-decision.md'), content);
}

function makeBetDecision(doorType: '2-way' | '1-way' | null, risks: {
  value?: string; usability?: string; feasibility?: string; viability?: string;
} = {}): string {
  const door2 = doorType === '2-way' ? 'x' : ' ';
  const door1 = doorType === '1-way' ? 'x' : ' ';
  return `# Decision\n\n## Door type\n- [${door2}] 2-way door\n- [${door1}] 1-way door\n\n## Risk profile\n- **Value risk**: ${risks.value ?? 'Low'} — rationale\n- **Usability risk**: ${risks.usability ?? 'Low'} — rationale\n- **Feasibility risk**: ${risks.feasibility ?? 'Low'} — rationale\n- **Business viability risk**: ${risks.viability ?? 'Low'} — rationale\n`;
}

async function runOvw(): Promise<void> {
  const cmd = ovwCommand();
  await cmd.parseAsync([], { from: 'user' });
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-ovw-test-'));
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  logLines = [];
  errLines = [];
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    logLines.push(args.map(String).join(' '));
  });
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errLines.push(args.map(String).join(' '));
  });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('oprim ovw — board rendering', () => {
  it('prints each lane header for a board with bets in all lanes', async () => {
    writeSequenceYaml(`
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
later:
  - id: BET-003
    title: Gamma
    blocked_by: []
    unlocks: []
backlog:
  - id: BET-004
    title: Delta
    blocked_by: []
    unlocks: []
`);
    await runOvw();
    const output = logLines.join('\n');
    expect(output).toContain('NOW');
    expect(output).toContain('NEXT');
    expect(output).toContain('LATER');
    expect(output).toContain('BACKLOG');
    expect(output).toContain('BET-001');
    expect(output).toContain('BET-002');
    expect(output).toContain('BET-003');
    expect(output).toContain('BET-004');
  });

  it('prints (empty) for lanes with no bets', async () => {
    writeSequenceYaml(`now: []\nnext: []\nlater: []\nbacklog: []\n`);
    await runOvw();
    const emptyCount = logLines.filter((l) => l.includes('(empty)')).length;
    expect(emptyCount).toBe(4);
  });

  it('shows [risk: unknown] for a now bet with no bet-decision.md', async () => {
    writeSequenceYaml(`now:\n  - id: BET-001\n    title: Alpha\n    blocked_by: []\n    unlocks: []\n`);
    await runOvw();
    expect(logLines.join('\n')).toContain('[risk: unknown]');
  });

  it('renders inline risk metadata for a now bet with complete profile', async () => {
    writeSequenceYaml(`now:\n  - id: BET-001\n    title: Alpha\n    blocked_by: []\n    unlocks: []\n`);
    writeBetDecision('BET-001', 'alpha', makeBetDecision('2-way', { value: 'Low', usability: 'Low', feasibility: 'High', viability: 'Low' }));
    await runOvw();
    const output = logLines.join('\n');
    expect(output).toContain('[2-way | value:L usability:L feasibility:H viability:L]');
  });

  it('shows blocker annotation after risk metadata', async () => {
    writeSequenceYaml(`
now:
  - id: BET-001
    title: Alpha
    blocked_by: [BET-002]
    unlocks: []
next:
  - id: BET-002
    title: Beta
    blocked_by: []
    unlocks: []
`);
    writeBetDecision('BET-001', 'alpha', makeBetDecision('2-way'));
    await runOvw();
    expect(logLines.join('\n')).toContain('[blocked by: BET-002]');
  });

  it('does not show risk metadata for later or backlog bets', async () => {
    writeSequenceYaml(`
later:
  - id: BET-003
    title: Gamma
    blocked_by: []
    unlocks: []
backlog:
  - id: BET-004
    title: Delta
    blocked_by: []
    unlocks: []
`);
    writeBetDecision('BET-003', 'gamma', makeBetDecision('1-way'));
    writeBetDecision('BET-004', 'delta', makeBetDecision('2-way'));
    await runOvw();
    const output = logLines.join('\n');
    expect(output).not.toContain('[1-way');
    expect(output).not.toContain('[2-way');
  });
});

describe('oprim ovw — missing sequence.yaml', () => {
  it('exits non-zero with clear error when sequence.yaml is absent', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    await runOvw();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errLines.join('\n')).toContain("No oprim/sequence.yaml found — run 'oprim init' first");
  });
});

describe('oprim ovw — board-shape advisory rules', () => {
  it('fires now-empty nudge when now lane is empty', async () => {
    writeSequenceYaml(`now: []\nnext:\n  - id: BET-002\n    title: Beta\n    blocked_by: []\n    unlocks: []\n`);
    await runOvw();
    expect(logLines.join('\n')).toContain('Now lane is empty');
  });

  it('fires overloaded nudge when now has more than 3 bets', async () => {
    const bets = ['BET-001', 'BET-002', 'BET-003', 'BET-004'].map((id) =>
      `  - id: ${id}\n    title: ${id}\n    blocked_by: []\n    unlocks: []`
    ).join('\n');
    writeSequenceYaml(`now:\n${bets}\n`);
    await runOvw();
    expect(logLines.join('\n')).toContain('Focus risk: now lane has 4 active bets');
  });

  it('fires stuck-bet nudge when blocker is not in flight', async () => {
    writeSequenceYaml(`
now:
  - id: BET-001
    title: Alpha
    blocked_by: [BET-099]
    unlocks: []
`);
    await runOvw();
    expect(logLines.join('\n')).toContain('BET-001 may be stuck');
  });
});

describe('oprim ovw — door-type advisory rules', () => {
  it('fires 1-way-no-unrisker nudge for a 1-way door in now with no 2-way unrisker', async () => {
    writeSequenceYaml(`now:\n  - id: BET-001\n    title: Alpha\n    blocked_by: []\n    unlocks: []\n`);
    writeBetDecision('BET-001', 'alpha', makeBetDecision('1-way'));
    await runOvw();
    expect(logLines.join('\n')).toContain('BET-001 is a 1-way door with no 2-way door unrisker');
  });

  it('fires all-now-1-way nudge when every now bet is a 1-way door', async () => {
    writeSequenceYaml(`now:\n  - id: BET-001\n    title: Alpha\n    blocked_by: []\n    unlocks: []\n  - id: BET-002\n    title: Beta\n    blocked_by: []\n    unlocks: []\n`);
    writeBetDecision('BET-001', 'alpha', makeBetDecision('1-way'));
    writeBetDecision('BET-002', 'beta', makeBetDecision('1-way'));
    await runOvw();
    expect(logLines.join('\n')).toContain('full-commitment mode');
  });

  it('fires inversion nudge when a 2-way door is blocked by a 1-way door', async () => {
    writeSequenceYaml(`
now:
  - id: BET-001
    title: Alpha
    blocked_by: [BET-002]
    unlocks: []
  - id: BET-002
    title: Beta
    blocked_by: []
    unlocks: []
`);
    writeBetDecision('BET-001', 'alpha', makeBetDecision('2-way'));
    writeBetDecision('BET-002', 'beta', makeBetDecision('1-way'));
    await runOvw();
    expect(logLines.join('\n')).toContain('order may be inverted');
  });

  it('does not fire 1-way-no-unrisker when a 2-way bet in next unlocks the 1-way bet', async () => {
    writeSequenceYaml(`
now:
  - id: BET-001
    title: Alpha
    blocked_by: []
    unlocks: []
next:
  - id: BET-002
    title: Beta
    blocked_by: []
    unlocks: [BET-001]
`);
    writeBetDecision('BET-001', 'alpha', makeBetDecision('1-way'));
    writeBetDecision('BET-002', 'beta', makeBetDecision('2-way'));
    await runOvw();
    expect(logLines.join('\n')).not.toContain('BET-001 is a 1-way door with no 2-way door unrisker');
  });
});

describe('oprim ovw — risk advisory rules', () => {
  it('fires value-risk nudge for High value risk on a 1-way door', async () => {
    writeSequenceYaml(`now:\n  - id: BET-001\n    title: Alpha\n    blocked_by: []\n    unlocks: []\n`);
    writeBetDecision('BET-001', 'alpha', makeBetDecision('1-way', { value: 'High' }));
    await runOvw();
    expect(logLines.join('\n')).toContain('unvalidated value');
  });

  it('fires feasibility nudge for Medium feasibility risk', async () => {
    writeSequenceYaml(`now:\n  - id: BET-001\n    title: Alpha\n    blocked_by: []\n    unlocks: []\n`);
    writeBetDecision('BET-001', 'alpha', makeBetDecision('2-way', { feasibility: 'Medium' }));
    await runOvw();
    expect(logLines.join('\n')).toContain('feasibility risk is elevated');
  });

  it('fires usability nudge for High usability risk', async () => {
    writeSequenceYaml(`now:\n  - id: BET-001\n    title: Alpha\n    blocked_by: []\n    unlocks: []\n`);
    writeBetDecision('BET-001', 'alpha', makeBetDecision('2-way', { usability: 'High' }));
    await runOvw();
    expect(logLines.join('\n')).toContain('usability risk is elevated');
  });

  it('fires viability nudge for Medium business viability risk', async () => {
    writeSequenceYaml(`now:\n  - id: BET-001\n    title: Alpha\n    blocked_by: []\n    unlocks: []\n`);
    writeBetDecision('BET-001', 'alpha', makeBetDecision('2-way', { viability: 'Medium' }));
    await runOvw();
    expect(logLines.join('\n')).toContain('business viability risk is elevated');
  });

  it('does not fire risk nudges for all-Low risk profiles', async () => {
    writeSequenceYaml(`now:\n  - id: BET-001\n    title: Alpha\n    blocked_by: []\n    unlocks: []\n`);
    writeBetDecision('BET-001', 'alpha', makeBetDecision('2-way', { value: 'Low', usability: 'Low', feasibility: 'Low', viability: 'Low' }));
    await runOvw();
    const output = logLines.join('\n');
    expect(output).not.toContain('elevated');
    expect(output).not.toContain('unvalidated value');
  });

  it('omits Advisory section entirely when no rules fire', async () => {
    writeSequenceYaml(`
now:
  - id: BET-001
    title: Alpha
    blocked_by: []
    unlocks: []
`);
    writeBetDecision('BET-001', 'alpha', makeBetDecision('2-way', { value: 'Low', usability: 'Low', feasibility: 'Low', viability: 'Low' }));
    await runOvw();
    expect(logLines.join('\n')).not.toContain('ADVISORY');
  });
});
