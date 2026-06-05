import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { doctorCommand } from '../commands/doctor';

let tmpDir: string;
let logLines: string[];

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-doctor-test-'));
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  logLines = [];
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    logLines.push(args.map(String).join(' '));
  });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('oprim doctor — archived bet exclusion', () => {
  it('does not emit a discovery check for bets under oprim/bets/archived/', async () => {
    const archivedBetDir = path.join(tmpDir, 'oprim', 'bets', 'archived', 'BET-002');
    fs.mkdirSync(archivedBetDir, { recursive: true });
    fs.writeFileSync(path.join(archivedBetDir, 'bet-decision.md'), '# BET-002\n');
    // No discovery.md — if doctor scanned archived bets, it would warn here

    await doctorCommand().parseAsync([], { from: 'user' });

    const allOutput = logLines.join('\n');
    expect(allOutput).not.toContain('BET-002');
  });

  it('still emits a discovery warning for active bets missing discovery.md', async () => {
    const activeBetDir = path.join(tmpDir, 'oprim', 'bets', 'BET-005');
    fs.mkdirSync(activeBetDir, { recursive: true });
    fs.writeFileSync(path.join(activeBetDir, 'bet-decision.md'), '# BET-005\n');
    // No discovery.md — doctor should warn

    await doctorCommand().parseAsync([], { from: 'user' });

    const allOutput = logLines.join('\n');
    expect(allOutput).toContain('BET-005');
  });
});
