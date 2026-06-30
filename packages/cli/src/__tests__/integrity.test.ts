import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkSequenceIntegrity, checkSkillVersionDrift, type Check } from '../lib/integrity';
import { CLAUDE_SKILLS, OPRIM_CONTEXT_SKILL_STEP } from '../lib/install-agent';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-integrity-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeSequence(content: string): void {
  const dir = path.join(tmpDir, 'oprim');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'sequence.yaml'), content, 'utf-8');
}

function runChecks(): Check[] {
  const checks: Check[] = [];
  checkSequenceIntegrity(tmpDir, checks);
  return checks;
}

function runDriftChecks(): Check[] {
  const checks: Check[] = [];
  checkSkillVersionDrift(tmpDir, checks);
  return checks;
}

// ── Sequence: WIP limit ──────────────────────────────────────────────────────

describe('checkSequenceIntegrity — WIP limit', () => {
  it('4.1 warns when now count exceeds wip_limits.now', () => {
    writeSequence(`
wip_limits:
  now: 2
now:
  - id: BET-001
    blocked_by: []
    unlocks: []
  - id: BET-002
    blocked_by: []
    unlocks: []
  - id: BET-003
    blocked_by: []
    unlocks: []
backlog: []
`);
    const checks = runChecks();
    expect(checks.some((c) => c.name.includes('WIP limit exceeded') && !c.pass)).toBe(true);
  });

  it('4.1 does not warn when now count is within the WIP limit', () => {
    writeSequence(`
wip_limits:
  now: 2
now:
  - id: BET-001
    blocked_by: []
    unlocks: []
backlog: []
`);
    const checks = runChecks();
    expect(checks.some((c) => c.name.includes('WIP limit'))).toBe(false);
  });

  it('4.1 does not warn when now lane is empty', () => {
    writeSequence(`
wip_limits:
  now: 2
now: []
backlog:
  - id: BET-001
    blocked_by: []
    unlocks: []
`);
    const checks = runChecks();
    expect(checks.some((c) => c.name.includes('WIP limit'))).toBe(false);
  });
});

// ── Sequence: dangling blocked_by ────────────────────────────────────────────

describe('checkSequenceIntegrity — blocked_by references', () => {
  it('4.2 warns on a dangling blocked_by reference', () => {
    writeSequence(`
wip_limits:
  now: 2
now: []
next:
  - id: BET-002
    blocked_by: [BET-999]
    unlocks: []
`);
    const checks = runChecks();
    expect(checks.some((c) => c.name.includes('dangling blocked_by reference BET-999') && !c.pass)).toBe(true);
  });

  it('4.2 does not warn when blocked_by references a known bet', () => {
    writeSequence(`
wip_limits:
  now: 2
now: []
next:
  - id: BET-002
    blocked_by: [BET-005]
    unlocks: []
later:
  - id: BET-005
    blocked_by: []
    unlocks: []
`);
    const checks = runChecks();
    expect(checks.some((c) => c.name.includes('blocked_by'))).toBe(false);
  });

  it('4.2 does not warn when all blocked_by lists are empty', () => {
    writeSequence(`
wip_limits:
  now: 2
now: []
backlog:
  - id: BET-001
    blocked_by: []
    unlocks: []
`);
    const checks = runChecks();
    expect(checks.some((c) => c.name.includes('blocked_by'))).toBe(false);
  });
});

// ── Sequence: dangling unlocks ────────────────────────────────────────────────

describe('checkSequenceIntegrity — unlocks references', () => {
  it('4.3 warns on a dangling unlocks reference', () => {
    writeSequence(`
wip_limits:
  now: 2
now:
  - id: BET-001
    blocked_by: []
    unlocks: [BET-888]
`);
    const checks = runChecks();
    expect(checks.some((c) => c.name.includes('dangling unlocks reference BET-888') && !c.pass)).toBe(true);
  });

  it('4.3 does not warn when unlocks references a known bet', () => {
    writeSequence(`
wip_limits:
  now: 2
now:
  - id: BET-001
    blocked_by: []
    unlocks: [BET-002]
next:
  - id: BET-002
    blocked_by: [BET-001]
    unlocks: []
`);
    const checks = runChecks();
    expect(checks.some((c) => c.name.includes('unlocks'))).toBe(false);
  });
});

// ── Sequence: malformed YAML ─────────────────────────────────────────────────

describe('checkSequenceIntegrity — malformed YAML', () => {
  it('4.4 pushes a single warning and skips further checks on malformed YAML', () => {
    writeSequence('{ invalid: yaml: : :');
    const checks = runChecks();
    expect(checks).toHaveLength(1);
    expect(checks[0]!.name).toContain('could not parse sequence.yaml');
    expect(checks[0]!.pass).toBe(false);
  });
});

// ── Skill version drift ──────────────────────────────────────────────────────

describe('checkSkillVersionDrift', () => {
  const skillName = 'oprim-bet';
  const bundledContent = CLAUDE_SKILLS[skillName]!;

  function writeSkill(name: string, content: string): void {
    const skillDir = path.join(tmpDir, '.claude', 'skills', name);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content, 'utf-8');
  }

  it('4.5 warns when installed skill content differs from bundled content', () => {
    writeSkill(skillName, bundledContent + '\n<!-- outdated -->');
    const checks = runDriftChecks();
    expect(checks.some((c) => c.name.includes(`${skillName} is out of date`) && !c.pass)).toBe(true);
  });

  it('4.6 does not warn when installed skill matches bundled content', () => {
    writeSkill(skillName, bundledContent);
    const checks = runDriftChecks();
    expect(checks.some((c) => c.name.includes(skillName))).toBe(false);
  });

  it('4.7 ignores the PDR-surfacing Step 0 prefix when comparing', () => {
    // Simulate content written by withContextStep: insert step after closing ---
    const lines = bundledContent.split('\n');
    let closingDash = -1;
    let dashCount = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]!.trim() === '---') {
        dashCount++;
        if (dashCount === 2) { closingDash = i; break; }
      }
    }
    const front = lines.slice(0, closingDash + 1).join('\n');
    const body = lines.slice(closingDash + 1).join('\n').trimStart();
    const withStep0 = `${front}\n\n${OPRIM_CONTEXT_SKILL_STEP}\n\n${body}`;

    writeSkill(skillName, withStep0);
    const checks = runDriftChecks();
    expect(checks.some((c) => c.name.includes(skillName))).toBe(false);
  });

  it('4.8 skips all drift checks when .claude/skills/ is absent', () => {
    // No .claude dir written
    const checks = runDriftChecks();
    expect(checks).toHaveLength(0);
  });
});
