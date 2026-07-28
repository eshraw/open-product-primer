import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkBetDefinitionOfDone, checkSpecDeltaDrift, checkCrossBetConflicts } from '../lib/validate-checks';
import { type Check } from '../lib/integrity';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-validate-checks-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeBetDecision(betDir: string, linksBody: string): void {
  fs.mkdirSync(betDir, { recursive: true });
  fs.writeFileSync(
    path.join(betDir, 'bet-decision.md'),
    `# Decision: Foo\n\n## Status\n- Decision: Build now\n\n## Links\n${linksBody}\n`,
    'utf-8'
  );
}

// ── checkBetDefinitionOfDone ─────────────────────────────────────────────────

describe('checkBetDefinitionOfDone', () => {
  it('2.2 flags a promoted bet missing criteria.yaml', () => {
    const betsDir = path.join(tmpDir, 'oprim', 'bets', 'pending');
    writeBetDecision(
      path.join(betsDir, 'BET-030-foo'),
      "- OpenSpec change: `openspec/changes/bet-030-foo/`\n"
    );

    const checks: Check[] = [];
    checkBetDefinitionOfDone(tmpDir, checks);

    expect(checks.some((c) => c.name === 'bet: BET-030 promoted without criteria.yaml' && !c.pass)).toBe(
      true
    );
  });

  it('2.2 does not flag a promoted bet that has criteria.yaml', () => {
    const betsDir = path.join(tmpDir, 'oprim', 'bets', 'pending');
    const betDir = path.join(betsDir, 'BET-030-foo');
    writeBetDecision(betDir, "- OpenSpec change: `openspec/changes/bet-030-foo/`\n");
    fs.writeFileSync(path.join(betDir, 'criteria.yaml'), 'bet: BET-030\n', 'utf-8');

    const checks: Check[] = [];
    checkBetDefinitionOfDone(tmpDir, checks);

    expect(checks.some((c) => c.name.includes('BET-030'))).toBe(false);
  });

  it('2.2 does not flag an un-promoted bet regardless of criteria.yaml', () => {
    const betsDir = path.join(tmpDir, 'oprim', 'bets', 'pending');
    writeBetDecision(path.join(betsDir, 'BET-031-bar'), '- OpenSpec change: to be filled when promoted\n');

    const checks: Check[] = [];
    checkBetDefinitionOfDone(tmpDir, checks);

    expect(checks.some((c) => c.name.includes('BET-031'))).toBe(false);
  });

  it('2.2 does not flag an un-promoted bet using the angle-bracket placeholder', () => {
    const betsDir = path.join(tmpDir, 'oprim', 'bets', 'pending');
    writeBetDecision(path.join(betsDir, 'BET-032-baz'), '- OpenSpec change: <to be filled when promoted>\n');

    const checks: Check[] = [];
    checkBetDefinitionOfDone(tmpDir, checks);

    expect(checks.some((c) => c.name.includes('BET-032'))).toBe(false);
  });

  it('2.2 excludes archived bets', () => {
    writeBetDecision(
      path.join(tmpDir, 'oprim', 'bets', 'archived', 'BET-033-qux'),
      "- OpenSpec change: `openspec/changes/bet-033-qux/`\n"
    );

    const checks: Check[] = [];
    checkBetDefinitionOfDone(tmpDir, checks);

    expect(checks).toEqual([]);
  });
});

// ── checkSpecDeltaDrift ───────────────────────────────────────────────────────

function writeCurrentTruth(projectRoot: string, capability: string, content: string): void {
  const dir = path.join(projectRoot, 'oprim', 'specs', capability);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'spec.md'), content, 'utf-8');
}

function writeBetDelta(projectRoot: string, betDirName: string, capability: string, content: string): void {
  const dir = path.join(projectRoot, 'oprim', 'bets', 'pending', betDirName, 'specs', capability);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'spec.md'), content, 'utf-8');
}

describe('checkSpecDeltaDrift', () => {
  it('3.2 flags a MODIFIED requirement whose header no longer matches current truth', () => {
    writeCurrentTruth(tmpDir, 'checkout', '## Requirements\n\n### Requirement: The system SHALL do A\n\nBody.\n');
    writeBetDelta(
      tmpDir,
      'BET-040-foo',
      'checkout',
      '## MODIFIED Requirements\n\n### Requirement: The system SHALL do X\n\nBody.\n'
    );

    const checks: Check[] = [];
    checkSpecDeltaDrift(tmpDir, checks);

    expect(
      checks.some(
        (c) =>
          c.name.includes('BET-040') &&
          c.name.includes('MODIFIED') &&
          c.name.includes('The system SHALL do X') &&
          !c.pass
      )
    ).toBe(true);
  });

  it('3.2 flags a REMOVED requirement whose header no longer matches current truth', () => {
    writeCurrentTruth(tmpDir, 'checkout', '## Requirements\n\n### Requirement: The system SHALL do A\n\nBody.\n');
    writeBetDelta(
      tmpDir,
      'BET-041-bar',
      'checkout',
      '## REMOVED Requirements\n\n### Requirement: The system SHALL do X\n\nBody.\n'
    );

    const checks: Check[] = [];
    checkSpecDeltaDrift(tmpDir, checks);

    expect(checks.some((c) => c.name.includes('BET-041') && c.name.includes('REMOVED') && !c.pass)).toBe(
      true
    );
  });

  it('3.2 does not flag when MODIFIED/REMOVED headers match current truth', () => {
    writeCurrentTruth(tmpDir, 'checkout', '## Requirements\n\n### Requirement: The system SHALL do A\n\nBody.\n');
    writeBetDelta(
      tmpDir,
      'BET-042-baz',
      'checkout',
      '## MODIFIED Requirements\n\n### Requirement:   The system   SHALL do A\n\nNew body.\n'
    );

    const checks: Check[] = [];
    checkSpecDeltaDrift(tmpDir, checks);

    expect(checks).toEqual([]);
  });

  it('3.2 does not flag ADDED requirements even when absent from current truth', () => {
    writeCurrentTruth(tmpDir, 'checkout', '## Requirements\n\n### Requirement: The system SHALL do A\n\nBody.\n');
    writeBetDelta(
      tmpDir,
      'BET-043-qux',
      'checkout',
      '## ADDED Requirements\n\n### Requirement: The system SHALL do Z\n\nBody.\n'
    );

    const checks: Check[] = [];
    checkSpecDeltaDrift(tmpDir, checks);

    expect(checks).toEqual([]);
  });
});

// ── checkCrossBetConflicts ───────────────────────────────────────────────────

describe('checkCrossBetConflicts', () => {
  it('emits a failing check for an overlapping requirement header across active bets', () => {
    const delta = '## MODIFIED Requirements\n\n### Requirement: The system SHALL do X\n\nBody.\n';
    writeBetDelta(tmpDir, 'BET-050-foo', 'checkout', delta);
    writeBetDelta(tmpDir, 'BET-051-bar', 'checkout', delta);

    const checks: Check[] = [];
    checkCrossBetConflicts(tmpDir, checks);

    expect(checks.some((c) => c.name.includes('BET-050') && c.name.includes('BET-051') && !c.pass)).toBe(
      true
    );
  });
});
