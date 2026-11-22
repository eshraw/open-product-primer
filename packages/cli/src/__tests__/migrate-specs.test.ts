import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { migrateCommand, migrateLegacySpecs } from '../commands/migrate';
import { checkLegacySpecFormat } from '../lib/validate-checks';
import { type Check } from '../lib/integrity';

let tmpDir: string;
let logLines: string[];

const req = (name: string, body = `Body of ${name}.`) =>
  `### Requirement: ${name}\n${body}\n\n#### Scenario: ${name} works\n- **WHEN** x\n- **THEN** y`;

function writeSpec(capability: string, content: string): string {
  const dir = path.join(tmpDir, 'oprim', 'specs', capability);
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, 'spec.md');
  fs.writeFileSync(p, content);
  return p;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-migrate-specs-test-'));
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  logLines = [];
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    logLines.push(args.map(String).join(' '));
  });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

describe('oprim migrate --specs', () => {
  it('migrates a legacy ADDED-only file to one Requirements section, bodies unchanged', async () => {
    const blocks = [req('A'), req('B'), req('C'), req('D')];
    const p = writeSpec('bet-archiving', `## ADDED Requirements\n\n${blocks.join('\n\n')}\n`);

    await migrateCommand().parseAsync(['--specs'], { from: 'user' });

    expect(fs.readFileSync(p, 'utf-8')).toBe(`## Requirements\n\n${blocks.join('\n\n')}\n`);
    expect(logLines.join('\n')).toContain('migrated bet-archiving (4 requirements)');
  });

  it('merges ADDED + MODIFIED in file order, keeping the MODIFIED version of a duplicate', () => {
    const p = writeSpec(
      'sequence-view-scaffold',
      `# t\n\n## ADDED Requirements\n\n${req('A')}\n\n${req('B')}\n\n## MODIFIED Requirements\n\n${req('A', 'New A.')}\n\n${req('C')}\n`
    );

    const report = migrateLegacySpecs(tmpDir);

    expect(report.migrated).toEqual([{ capability: 'sequence-view-scaffold', requirements: 3, duplicates: ['A'] }]);
    expect(fs.readFileSync(p, 'utf-8')).toBe(`# t\n\n## Requirements\n\n${req('A', 'New A.')}\n\n${req('B')}\n\n${req('C')}\n`);
  });

  it('leaves canonical files untouched', () => {
    const content = `# x Specification\n\n## Purpose\n\nTBD\n\n## Requirements\n\n${req('A')}\n`;
    const p = writeSpec('note-authoring', content);
    const report = migrateLegacySpecs(tmpDir);
    expect(report.canonical).toEqual(['note-authoring']);
    expect(fs.readFileSync(p, 'utf-8')).toBe(content);
  });

  it('is idempotent and reports 0 legacy specs on a re-run', async () => {
    writeSpec('bet-archiving', `## ADDED Requirements\n\n${req('A')}\n`);
    await migrateCommand().parseAsync(['--specs'], { from: 'user' });
    const after = fs.readFileSync(path.join(tmpDir, 'oprim', 'specs', 'bet-archiving', 'spec.md'), 'utf-8');
    logLines = [];

    await migrateCommand().parseAsync(['--specs'], { from: 'user' });

    expect(logLines.join('\n')).toContain('0 legacy specs');
    expect(fs.readFileSync(path.join(tmpDir, 'oprim', 'specs', 'bet-archiving', 'spec.md'), 'utf-8')).toBe(after);
  });

  it('leaves a file it cannot parse fully untouched and reports it', () => {
    const content = `## ADDED Requirements\n\n${req('A')}\n\n## Requirements (deprecated)\n\n${req('B')}\n`;
    const p = writeSpec('weird', content);
    const report = migrateLegacySpecs(tmpDir);
    expect(report.failed).toEqual([{ capability: 'weird', reason: 'found 2 requirement headers but parsed 1' }]);
    expect(fs.readFileSync(p, 'utf-8')).toBe(content);
  });

  it('plain migrate is unchanged when oprim/ exists', async () => {
    fs.mkdirSync(path.join(tmpDir, 'oprim'));
    await migrateCommand().parseAsync([], { from: 'user' });
    expect(logLines.join('\n')).toContain('oprim/ already exists — nothing to migrate.');
  });
});

describe('checkLegacySpecFormat', () => {
  it('warns (non-required) only for legacy specs', () => {
    writeSpec('bet-archiving', `## ADDED Requirements\n\n${req('A')}\n`);
    writeSpec('note-authoring', `# n\n\n## Purpose\n\nTBD\n\n## Requirements\n\n${req('A')}\n`);
    const checks: Check[] = [];
    checkLegacySpecFormat(tmpDir, checks);
    expect(checks).toEqual([
      {
        name: "spec: bet-archiving uses legacy delta headings — run 'oprim migrate --specs'",
        pass: false,
        required: false,
      },
    ]);
  });
});
