import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readWorkspaceMode, validateWorkspaceMode } from '../lib/workspace-mode';
import type { Check } from '../lib/integrity';

let tmpDir: string;

function writeConfig(content: string): void {
  fs.mkdirSync(path.join(tmpDir, 'oprim'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'oprim', 'config.yaml'), content, 'utf-8');
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-mode-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('readWorkspaceMode', () => {
  it('defaults to product when there is no config', () => {
    expect(readWorkspaceMode(tmpDir)).toBe('product');
  });

  it('defaults to product when the mode key is absent', () => {
    writeConfig('version: 1\nproject:\n  name: "x"\n');
    expect(readWorkspaceMode(tmpDir)).toBe('product');
  });

  it('reads product and portfolio', () => {
    writeConfig('version: 1\nmode: product\n');
    expect(readWorkspaceMode(tmpDir)).toBe('product');
    writeConfig('version: 1\nmode: portfolio\n');
    expect(readWorkspaceMode(tmpDir)).toBe('portfolio');
    writeConfig('version: 1\nmode: "portfolio"\n');
    expect(readWorkspaceMode(tmpDir)).toBe('portfolio');
  });

  it('ignores a nested mode key', () => {
    writeConfig('version: 1\nsomething:\n  mode: portfolio\n');
    expect(readWorkspaceMode(tmpDir)).toBe('product');
  });

  it('falls back to product for an invalid value', () => {
    writeConfig('version: 1\nmode: portfoilo\n');
    expect(readWorkspaceMode(tmpDir)).toBe('product');
  });
});

describe('validateWorkspaceMode', () => {
  it('adds nothing for absent, product or portfolio', () => {
    for (const content of ['version: 1\n', 'mode: product\n', 'mode: portfolio\n']) {
      writeConfig(content);
      const checks: Check[] = [];
      validateWorkspaceMode(tmpDir, checks);
      expect(checks).toEqual([]);
    }
  });

  it('reports an invalid value as a required failure naming the value', () => {
    writeConfig('version: 1\nmode: portfoilo\n');
    const checks: Check[] = [];
    validateWorkspaceMode(tmpDir, checks);
    expect(checks).toHaveLength(1);
    expect(checks[0].name).toBe('config: unknown mode "portfoilo" (expected product | portfolio)');
    expect(checks[0].required).toBe(true);
    expect(checks[0].pass).toBe(false);
  });
});
