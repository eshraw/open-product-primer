import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CLAUDE_MODS_REGISTRY, getClaudeMod } from '../lib/claude-mods';
import {
  isFunctionHooksActive,
  enableFunctionHooks,
  applyClaudeModsSelection,
} from '../lib/install-agent';
import { readClaudeModsFromConfig, writeClaudeModsToConfig } from '../lib/detect';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-claude-mods-test-'));
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
  delete process.env.CLAUDE_CODE_ENABLE_FUNCTION_HOOKS;
});

describe('CLAUDE_MODS_REGISTRY', () => {
  it('contains the spec-delta-drift interceptor', () => {
    const mod = getClaudeMod('spec-delta-drift-interceptor');
    expect(mod).toBeDefined();
    expect(mod!.hookFiles.length).toBeGreaterThan(0);
    expect(CLAUDE_MODS_REGISTRY.some((m) => m.id === 'spec-delta-drift-interceptor')).toBe(true);
  });
});

describe('isFunctionHooksActive', () => {
  it('is false when neither env var nor settings.json env key is set', () => {
    expect(isFunctionHooksActive(tmpDir)).toBe(false);
  });

  it('is true when the process env var is set', () => {
    process.env.CLAUDE_CODE_ENABLE_FUNCTION_HOOKS = '1';
    expect(isFunctionHooksActive(tmpDir)).toBe(true);
  });

  it('is true when settings.json has the env key set', () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(
      path.join(claudeDir, 'settings.json'),
      JSON.stringify({ env: { CLAUDE_CODE_ENABLE_FUNCTION_HOOKS: '1' } })
    );
    expect(isFunctionHooksActive(tmpDir)).toBe(true);
  });
});

describe('enableFunctionHooks', () => {
  it('merges the env key into settings.json without disturbing existing hooks', () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(
      path.join(claudeDir, 'settings.json'),
      JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'bash ".claude/hooks/on-stop.sh"' }] }] } })
    );

    enableFunctionHooks(tmpDir);

    const settings = JSON.parse(fs.readFileSync(path.join(claudeDir, 'settings.json'), 'utf-8'));
    expect(settings.env.CLAUDE_CODE_ENABLE_FUNCTION_HOOKS).toBe('1');
    expect(settings.hooks.Stop[0].hooks[0].command).toBe('bash ".claude/hooks/on-stop.sh"');
  });
});

describe('readClaudeModsFromConfig / writeClaudeModsToConfig', () => {
  it('returns an empty array when the key is absent', () => {
    const primerDir = path.join(tmpDir, 'oprim');
    fs.mkdirSync(primerDir, { recursive: true });
    fs.writeFileSync(path.join(primerDir, 'config.yaml'), 'version: 1\nagents:\n  - claude\n');
    expect(readClaudeModsFromConfig(tmpDir)).toEqual([]);
  });

  it('round-trips a written selection', () => {
    const primerDir = path.join(tmpDir, 'oprim');
    fs.mkdirSync(primerDir, { recursive: true });
    fs.writeFileSync(path.join(primerDir, 'config.yaml'), 'version: 1\nagents:\n  - claude\nclaude_mods: []\n');

    writeClaudeModsToConfig(['spec-delta-drift-interceptor'], tmpDir);

    expect(readClaudeModsFromConfig(tmpDir)).toEqual(['spec-delta-drift-interceptor']);
  });
});

describe('applyClaudeModsSelection', () => {
  function setupClaudeProject(): void {
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'oprim'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'oprim', 'config.yaml'), 'version: 1\nagents:\n  - claude\nclaude_mods: []\n');
  }

  it('installs a newly-selected mod: writes its hook file and registers it in settings.json', () => {
    setupClaudeProject();

    applyClaudeModsSelection(tmpDir, ['spec-delta-drift-interceptor'], []);

    const scriptPath = path.join(tmpDir, '.claude', 'hooks', 'spec-delta-drift-interceptor.js');
    expect(fs.existsSync(scriptPath)).toBe(true);

    const settings = JSON.parse(fs.readFileSync(path.join(tmpDir, '.claude', 'settings.json'), 'utf-8'));
    expect(settings.hooks.PostToolUse.some((e: { matcher?: string }) => e.matcher === 'Write|Edit')).toBe(true);
    expect(readClaudeModsFromConfig(tmpDir)).toEqual(['spec-delta-drift-interceptor']);
  });

  it('leaves unrelated existing hooks untouched when installing a mod', () => {
    setupClaudeProject();
    fs.writeFileSync(
      path.join(tmpDir, '.claude', 'settings.json'),
      JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'bash ".claude/hooks/on-stop.sh"' }] }] } })
    );

    applyClaudeModsSelection(tmpDir, ['spec-delta-drift-interceptor'], []);

    const settings = JSON.parse(fs.readFileSync(path.join(tmpDir, '.claude', 'settings.json'), 'utf-8'));
    expect(settings.hooks.Stop[0].hooks[0].command).toBe('bash ".claude/hooks/on-stop.sh"');
    expect(settings.hooks.PostToolUse).toBeDefined();
  });

  it('removes a deselected mod: deletes its hook file and settings.json entry', () => {
    setupClaudeProject();
    applyClaudeModsSelection(tmpDir, ['spec-delta-drift-interceptor'], []);

    applyClaudeModsSelection(tmpDir, [], ['spec-delta-drift-interceptor']);

    const scriptPath = path.join(tmpDir, '.claude', 'hooks', 'spec-delta-drift-interceptor.js');
    expect(fs.existsSync(scriptPath)).toBe(false);

    const settings = JSON.parse(fs.readFileSync(path.join(tmpDir, '.claude', 'settings.json'), 'utf-8'));
    expect(settings.hooks.PostToolUse).toBeUndefined();
    expect(readClaudeModsFromConfig(tmpDir)).toEqual([]);
  });

  it('is idempotent when re-applying the same selection', () => {
    setupClaudeProject();
    applyClaudeModsSelection(tmpDir, ['spec-delta-drift-interceptor'], []);
    applyClaudeModsSelection(tmpDir, ['spec-delta-drift-interceptor'], ['spec-delta-drift-interceptor']);

    const settings = JSON.parse(fs.readFileSync(path.join(tmpDir, '.claude', 'settings.json'), 'utf-8'));
    expect(settings.hooks.PostToolUse.length).toBe(1);
  });
});
