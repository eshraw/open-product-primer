import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectAvailableAgents, readAgentsFromConfig, writeAgentsToConfig } from '../lib/detect';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// detectAvailableAgents ───────────────────────────────────────────────────────

describe('detectAvailableAgents', () => {
  it('returns empty array when no agent indicators are present', () => {
    expect(detectAvailableAgents(tmpDir)).toEqual([]);
  });

  it('detects claude when .claude/ directory exists', () => {
    fs.mkdirSync(path.join(tmpDir, '.claude'));
    expect(detectAvailableAgents(tmpDir)).toContain('claude');
  });

  it('detects cursor when .cursor/ directory exists', () => {
    fs.mkdirSync(path.join(tmpDir, '.cursor'));
    expect(detectAvailableAgents(tmpDir)).toContain('cursor');
  });

  it('detects codex when AGENTS.md exists', () => {
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '# Agents\n');
    expect(detectAvailableAgents(tmpDir)).toContain('codex');
  });

  it('does not detect codex when AGENTS.md is absent', () => {
    expect(detectAvailableAgents(tmpDir)).not.toContain('codex');
  });

  it('detects gemini when GEMINI.md exists', () => {
    fs.writeFileSync(path.join(tmpDir, 'GEMINI.md'), '# Gemini\n');
    expect(detectAvailableAgents(tmpDir)).toContain('gemini');
  });

  it('does not detect gemini when GEMINI.md is absent', () => {
    expect(detectAvailableAgents(tmpDir)).not.toContain('gemini');
  });

  it('detects all four agents when all indicators are present', () => {
    fs.mkdirSync(path.join(tmpDir, '.claude'));
    fs.mkdirSync(path.join(tmpDir, '.cursor'));
    fs.writeFileSync(path.join(tmpDir, 'AGENTS.md'), '');
    fs.writeFileSync(path.join(tmpDir, 'GEMINI.md'), '');
    const result = detectAvailableAgents(tmpDir);
    expect(result).toContain('claude');
    expect(result).toContain('cursor');
    expect(result).toContain('codex');
    expect(result).toContain('gemini');
  });
});

// 7.1 ─────────────────────────────────────────────────────────────────────────

describe('readAgentsFromConfig', () => {
  it('returns null when oprim/config.yaml does not exist', () => {
    expect(readAgentsFromConfig(tmpDir)).toBeNull();
  });

  it('returns null when agents field is absent', () => {
    fs.mkdirSync(path.join(tmpDir, 'oprim'));
    fs.writeFileSync(path.join(tmpDir, 'oprim', 'config.yaml'), 'version: 1\nproject:\n  name: test\n');
    expect(readAgentsFromConfig(tmpDir)).toBeNull();
  });

  it('returns empty array when agents field is an empty list', () => {
    fs.mkdirSync(path.join(tmpDir, 'oprim'));
    fs.writeFileSync(path.join(tmpDir, 'oprim', 'config.yaml'), 'version: 1\nagents: []\n');
    expect(readAgentsFromConfig(tmpDir)).toEqual([]);
  });

  it('returns array of agents when field is present', () => {
    fs.mkdirSync(path.join(tmpDir, 'oprim'));
    fs.writeFileSync(path.join(tmpDir, 'oprim', 'config.yaml'), 'version: 1\nagents:\n  - claude\n  - cursor\n');
    expect(readAgentsFromConfig(tmpDir)).toEqual(['claude', 'cursor']);
  });
});

// 7.2 ─────────────────────────────────────────────────────────────────────────

describe('writeAgentsToConfig', () => {
  beforeEach(() => {
    fs.mkdirSync(path.join(tmpDir, 'oprim'));
    fs.writeFileSync(
      path.join(tmpDir, 'oprim', 'config.yaml'),
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
    const content = fs.readFileSync(path.join(tmpDir, 'oprim', 'config.yaml'), 'utf-8');
    expect(content).toContain('my-project');
    expect(content).toContain('amplitude');
    expect(content).toContain('version');
  });

  it('updates agents field from empty to a list', () => {
    writeAgentsToConfig(['claude', 'cursor'], tmpDir);
    expect(readAgentsFromConfig(tmpDir)).toEqual(['claude', 'cursor']);
  });

  it('is a no-op when config file does not exist', () => {
    fs.rmSync(path.join(tmpDir, 'oprim', 'config.yaml'));
    expect(() => writeAgentsToConfig(['claude'], tmpDir)).not.toThrow();
  });
});
