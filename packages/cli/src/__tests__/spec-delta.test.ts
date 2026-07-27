import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  foldDelta,
  findCrossBetConflicts,
  parseRequirementHeaders,
  parseCurrentTruthHeaders,
  resolveBetDirectory,
  normalizeBetId,
} from '../lib/spec-delta';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-spec-delta-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── parseRequirementHeaders ──────────────────────────────────────────────────

describe('parseRequirementHeaders', () => {
  it('extracts headers from an ADDED Requirements section', () => {
    const delta = `## ADDED Requirements

### Requirement: The system SHALL do X

Body text.

#### Scenario: does X
- **WHEN** foo
- **THEN** bar

### Requirement: The system SHALL do Y

Body.
`;
    expect(parseRequirementHeaders(delta, 'ADDED')).toEqual([
      'The system SHALL do X',
      'The system SHALL do Y',
    ]);
  });

  it('returns an empty array when the section is absent', () => {
    const delta = `## MODIFIED Requirements\n\n### Requirement: foo\n`;
    expect(parseRequirementHeaders(delta, 'ADDED')).toEqual([]);
  });
});

// ── foldDelta ─────────────────────────────────────────────────────────────────

describe('foldDelta — existing current truth', () => {
  it('1.4 appends an ADDED requirement to the end of the Requirements section', () => {
    const currentTruth = `## Requirements

### Requirement: The system SHALL do A

Body A.
`;
    const delta = `## ADDED Requirements

### Requirement: The system SHALL do B

Body B.
`;
    const result = foldDelta(currentTruth, delta);
    expect(result.content).toContain('### Requirement: The system SHALL do A');
    expect(result.content).toContain('### Requirement: The system SHALL do B');
    expect(result.content.indexOf('do A')).toBeLessThan(result.content.indexOf('do B'));
    expect(result.notes).toEqual([]);
  });

  it('1.4 replaces a matching MODIFIED requirement in place', () => {
    const currentTruth = `## Requirements

### Requirement: The system SHALL do A

Old body.
`;
    const delta = `## MODIFIED Requirements

### Requirement: The system SHALL do A

New body.
`;
    const result = foldDelta(currentTruth, delta);
    expect(result.content).toContain('New body.');
    expect(result.content).not.toContain('Old body.');
    expect(result.notes).toEqual([]);
  });

  it('1.4 treats a non-matching MODIFIED requirement as ADDED and notes it', () => {
    const currentTruth = `## Requirements

### Requirement: The system SHALL do A

Body A.
`;
    const delta = `## MODIFIED Requirements

### Requirement: The system SHALL do Z

New body Z.
`;
    const result = foldDelta(currentTruth, delta);
    expect(result.content).toContain('### Requirement: The system SHALL do Z');
    expect(result.notes.some((n) => n.includes('treated as ADDED'))).toBe(true);
  });

  it('1.4 deletes a matching REMOVED requirement', () => {
    const currentTruth = `## Requirements

### Requirement: The system SHALL do A

Body A.

### Requirement: The system SHALL do B

Body B.
`;
    const delta = `## REMOVED Requirements

### Requirement: The system SHALL do B

Body B.
`;
    const result = foldDelta(currentTruth, delta);
    expect(result.content).toContain('The system SHALL do A');
    expect(result.content).not.toContain('The system SHALL do B');
    expect(result.notes).toEqual([]);
  });

  it('1.4 notes a non-matching REMOVED requirement without error', () => {
    const currentTruth = `## Requirements

### Requirement: The system SHALL do A

Body A.
`;
    const delta = `## REMOVED Requirements

### Requirement: The system SHALL do Z

Body Z.
`;
    const result = foldDelta(currentTruth, delta);
    expect(result.content).toContain('The system SHALL do A');
    expect(result.notes.some((n) => n.includes('nothing removed'))).toBe(true);
  });
});

describe('foldDelta — no existing current truth', () => {
  it('1.4 creates a new Requirements section from ADDED-only deltas', () => {
    const delta = `## ADDED Requirements

### Requirement: The system SHALL do A

Body A.
`;
    const result = foldDelta(null, delta);
    expect(result.content).toContain('## Requirements');
    expect(result.content).toContain('### Requirement: The system SHALL do A');
  });

  it('1.4 throws when the delta contains MODIFIED requirements and no current truth exists', () => {
    const delta = `## MODIFIED Requirements

### Requirement: The system SHALL do A

Body A.
`;
    expect(() => foldDelta(null, delta)).toThrow();
  });

  it('1.4 throws when the delta contains REMOVED requirements and no current truth exists', () => {
    const delta = `## REMOVED Requirements

### Requirement: The system SHALL do A

Body A.
`;
    expect(() => foldDelta(null, delta)).toThrow();
  });
});

// ── findCrossBetConflicts ───────────────────────────────────────────────────

function writeBetSpec(betsDir: string, betName: string, capability: string, content: string): void {
  const dir = path.join(betsDir, betName, 'specs', capability);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'spec.md'), content, 'utf-8');
}

describe('findCrossBetConflicts', () => {
  it('1.5 reports an overlap when two active bets modify the same requirement header in the same capability', () => {
    const betsDir = path.join(tmpDir, 'oprim', 'bets');
    const delta = `## MODIFIED Requirements\n\n### Requirement: The system SHALL do X\n\nBody.\n`;
    writeBetSpec(betsDir, 'BET-009-foo', 'checkout', delta);
    writeBetSpec(betsDir, 'BET-010-bar', 'checkout', delta);

    const conflicts = findCrossBetConflicts(betsDir);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      betA: 'BET-009-foo',
      betB: 'BET-010-bar',
      capability: 'checkout',
      header: 'The system SHALL do X',
    });
  });

  it('1.5 reports no conflicts when no two bets share a matching header', () => {
    const betsDir = path.join(tmpDir, 'oprim', 'bets');
    writeBetSpec(
      betsDir,
      'BET-009-foo',
      'checkout',
      `## ADDED Requirements\n\n### Requirement: The system SHALL do X\n\nBody.\n`
    );
    writeBetSpec(
      betsDir,
      'BET-010-bar',
      'checkout',
      `## ADDED Requirements\n\n### Requirement: The system SHALL do Y\n\nBody.\n`
    );

    expect(findCrossBetConflicts(betsDir)).toEqual([]);
  });

  it('1.5 does not compare bets across different capabilities', () => {
    const betsDir = path.join(tmpDir, 'oprim', 'bets');
    const delta = `## ADDED Requirements\n\n### Requirement: The system SHALL do X\n\nBody.\n`;
    writeBetSpec(betsDir, 'BET-009-foo', 'checkout', delta);
    writeBetSpec(betsDir, 'BET-010-bar', 'billing', delta);

    expect(findCrossBetConflicts(betsDir)).toEqual([]);
  });

  it('1.5 excludes archived bets from comparison', () => {
    const betsDir = path.join(tmpDir, 'oprim', 'bets');
    const delta = `## ADDED Requirements\n\n### Requirement: The system SHALL do X\n\nBody.\n`;
    writeBetSpec(betsDir, 'BET-009-foo', 'checkout', delta);
    writeBetSpec(path.join(betsDir, 'archived'), 'BET-010-bar', 'checkout', delta);

    expect(findCrossBetConflicts(betsDir)).toEqual([]);
  });

  it('1.5 returns an empty array when the bets directory does not exist', () => {
    expect(findCrossBetConflicts(path.join(tmpDir, 'nonexistent'))).toEqual([]);
  });
});

// ── resolveBetDirectory / normalizeBetId ─────────────────────────────────────

describe('resolveBetDirectory', () => {
  it('normalizes shorthand bet IDs', () => {
    expect(normalizeBetId('5')).toBe('BET-005');
    expect(normalizeBetId('bet-005')).toBe('BET-005');
    expect(normalizeBetId('BET-005')).toBe('BET-005');
  });

  it('resolves a slugged directory', () => {
    const betsDir = path.join(tmpDir, 'oprim', 'bets');
    fs.mkdirSync(path.join(betsDir, 'BET-030-foo'), { recursive: true });
    expect(resolveBetDirectory(betsDir, '30')).toBe('BET-030-foo');
  });

  it('returns null when no directory matches', () => {
    const betsDir = path.join(tmpDir, 'oprim', 'bets');
    fs.mkdirSync(betsDir, { recursive: true });
    expect(resolveBetDirectory(betsDir, '999')).toBeNull();
  });
});

describe('parseCurrentTruthHeaders', () => {
  it('extracts headers from a flat Requirements section', () => {
    const content = `## Requirements\n\n### Requirement: A\n\nBody.\n\n### Requirement: B\n\nBody.\n`;
    expect(parseCurrentTruthHeaders(content)).toEqual(['A', 'B']);
  });
});
