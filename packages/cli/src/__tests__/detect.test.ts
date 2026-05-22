import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readAgentsFromConfig, writeAgentsToConfig } from '../lib/detect';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// 7.1 ─────────────────────────────────────────────────────────────────────────

describe('readAgentsFromConfig', () => {
  it('returns null when primer/config.yaml does not exist', () => {
    expect(readAgentsFromConfig(tmpDir)).toBeNull();
  });

  it('returns null when agents field is absent', () => {
    fs.mkdirSync(path.join(tmpDir, 'primer'));
    fs.writeFileSync(path.join(tmpDir, 'primer', 'config.yaml'), 'version: 1\nproject:\n  name: test\n');
    expect(readAgentsFromConfig(tmpDir)).toBeNull();
  });

  it('returns empty array when agents field is an empty list', () => {
    fs.mkdirSync(path.join(tmpDir, 'primer'));
    fs.writeFileSync(path.join(tmpDir, 'primer', 'config.yaml'), 'version: 1\nagents: []\n');
    expect(readAgentsFromConfig(tmpDir)).toEqual([]);
  });

  it('returns array of agents when field is present', () => {
    fs.mkdirSync(path.join(tmpDir, 'primer'));
    fs.writeFileSync(path.join(tmpDir, 'primer', 'config.yaml'), 'version: 1\nagents:\n  - claude\n  - cursor\n');
    expect(readAgentsFromConfig(tmpDir)).toEqual(['claude', 'cursor']);
  });
});

// 7.2 ─────────────────────────────────────────────────────────────────────────

describe('writeAgentsToConfig', () => {
  beforeEach(() => {
    fs.mkdirSync(path.join(tmpDir, 'primer'));
    fs.writeFileSync(
      path.join(tmpDir, 'primer', 'config.yaml'),
      'version: 1\nproject:\n  name: my-project\nagents: []\nmeasurement:\n  amplitude:\n    enabled: false\n'
    );
  });

  it('writes selected agents to config', () => {
    writeAgentsToConfig(['claude'], tmpDir);
    const result = readAgentsFromConfig(tmpDir);
    expect(result).toEqual(['claude']);
  });

  it('does not clobber other config fields', () => {
    writeAgentsToConfig(['claude'], tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, 'primer', 'config.yaml'), 'utf-8');
    expect(content).toContain('my-project');
    expect(content).toContain('amplitude');
    expect(content).toContain('version');
  });

  it('updates agents field from empty to a list', () => {
    writeAgentsToConfig(['claude', 'cursor'], tmpDir);
    expect(readAgentsFromConfig(tmpDir)).toEqual(['claude', 'cursor']);
  });

  it('is a no-op when config file does not exist', () => {
    fs.rmSync(path.join(tmpDir, 'primer', 'config.yaml'));
    expect(() => writeAgentsToConfig(['claude'], tmpDir)).not.toThrow();
  });
});
