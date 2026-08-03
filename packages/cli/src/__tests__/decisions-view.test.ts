import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { decisionsViewScriptTemplate } from '../lib/templates';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-decisions-view-'));
  fs.mkdirSync(path.join(tmpDir, 'oprim', 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'oprim', 'decisions'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'oprim', 'scripts', 'generate-decisions-view.js'), decisionsViewScriptTemplate);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function runScript(): string {
  execFileSync('node', [path.join(tmpDir, 'oprim', 'scripts', 'generate-decisions-view.js')], { cwd: tmpDir });
  return fs.readFileSync(path.join(tmpDir, 'oprim', 'decisions-view.md'), 'utf-8');
}

function writePdr(filename: string, body: string) {
  fs.writeFileSync(path.join(tmpDir, 'oprim', 'decisions', filename), body);
}

describe('generate-decisions-view.js', () => {
  it('lists Accepted PDRs as current decisions', () => {
    writePdr('PDR-001-first.md', '# PDR-001: First decision\n\n## Status\nAccepted\n');
    writePdr('PDR-002-second.md', '# PDR-002: Second decision\n\n## Status\nAccepted\n');

    const view = runScript();

    expect(view).toContain('PDR-001');
    expect(view).toContain('First decision');
    expect(view).toContain('PDR-002');
    expect(view).toContain('Second decision');
  });

  it('collapses a superseded PDR under its successor with a back-link', () => {
    writePdr('PDR-001-old.md', '# PDR-001: Old decision\n\n## Status\nSuperseded by PDR-003\n');
    writePdr('PDR-003-new.md', '# PDR-003: New decision\n\n## Status\nAccepted\n');

    const view = runScript();

    const topLevelLines = view.split('\n').filter((l) => l.startsWith('- **'));
    expect(topLevelLines.some((l) => l.includes('PDR-001'))).toBe(false);
    expect(topLevelLines.some((l) => l.includes('PDR-003'))).toBe(true);
    expect(view).toContain('supersedes [PDR-001]');
    expect(view).toContain('PDR-001-old.md');
  });

  it('writes a "no decisions yet" message for an empty decisions directory', () => {
    const view = runScript();

    expect(view).toContain('No decisions yet');
  });
});
