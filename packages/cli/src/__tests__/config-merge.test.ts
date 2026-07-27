import { describe, it, expect } from 'vitest';
import { mergeConfigSchema, readSpecFramework, deriveDefaultSpecFramework, mergeSpecFramework } from '../lib/config-merge';

describe('mergeConfigSchema', () => {
  it('adds context, rules, and remote_context to a config predating those keys', () => {
    const old = 'version: 1\nproject:\n  name: "my-project"\nagents: []\n';
    const { content, changed } = mergeConfigSchema(old);

    expect(changed).toBe(true);
    expect(content).toContain('context: ""');
    expect(content).toContain('rules: {}');
    expect(content).toContain('remote_context:\n  enabled: false\n  sources: []');
  });

  it('adds remote_context to a config that still has the old inert store key, leaving store untouched', () => {
    const old = 'version: 1\nagents: []\ncontext: ""\nrules: {}\nstore:\n  enabled: false\n';
    const { content, changed } = mergeConfigSchema(old);

    expect(changed).toBe(true);
    expect(content).toContain('store:\n  enabled: false');
    expect(content).toContain('remote_context:\n  enabled: false\n  sources: []');
    // store's own value is untouched — still exactly one occurrence, unmodified
    expect((content.match(/store:/g) || []).length).toBe(1);
  });

  it('preserves every pre-existing key and value exactly', () => {
    const old = 'version: 1\nproject:\n  name: "my-project"\nagents:\n  - claude\nmeasurement:\n  amplitude:\n    enabled: true\n';
    const { content } = mergeConfigSchema(old);

    expect(content).toContain(old.trimEnd());
    expect(content.startsWith(old)).toBe(true);
  });

  it('is a no-op when all schema keys are already present', () => {
    const current = 'version: 1\nagents: []\ncontext: ""\nrules: {}\nremote_context:\n  enabled: false\n  sources: []\n';
    const { content, changed } = mergeConfigSchema(current);

    expect(changed).toBe(false);
    expect(content).toBe(current);
  });

  it('is idempotent — running the merge twice produces no further changes', () => {
    const old = 'version: 1\nagents: []\n';
    const first = mergeConfigSchema(old);
    const second = mergeConfigSchema(first.content);

    expect(second.changed).toBe(false);
    expect(second.content).toBe(first.content);
  });

  it('never overwrites a user-set value for a key it also adds defaults for', () => {
    const old = 'version: 1\ncontext: "TypeScript monorepo"\nrules:\n  bet: "cite a Slack thread"\n';
    const { content, changed } = mergeConfigSchema(old);

    expect(content).toContain('context: "TypeScript monorepo"');
    expect(content).toContain('bet: "cite a Slack thread"');
    // only `remote_context` was missing
    expect(changed).toBe(true);
    expect(content).toContain('remote_context:\n  enabled: false\n  sources: []');
  });

  it('adds only the missing keys, leaving present ones untouched', () => {
    const old = 'version: 1\ncontext: ""\nagents: []\n';
    const { content } = mergeConfigSchema(old);

    expect((content.match(/^context:/gm) || []).length).toBe(1);
    expect(content).toContain('rules: {}');
    expect(content).toContain('remote_context:\n  enabled: false\n  sources: []');
  });
});

// bet-023 — spec_framework nested under integrations, one-off merge (see design.md) ────

describe('readSpecFramework', () => {
  it('reads the value of an existing spec_framework key', () => {
    const content = 'integrations:\n  openspec:\n    enabled: true\n  spec_framework: native\nokf:\n  enabled: false\n';
    expect(readSpecFramework(content)).toBe('native');
  });

  it('returns null when spec_framework is absent', () => {
    const content = 'integrations:\n  openspec:\n    enabled: true\nokf:\n  enabled: false\n';
    expect(readSpecFramework(content)).toBeNull();
  });
});

describe('deriveDefaultSpecFramework', () => {
  it('derives openspec when integrations.openspec.enabled is true', () => {
    const content = 'integrations:\n  openspec:\n    enabled: true\n    changes_dir: openspec/changes\n';
    expect(deriveDefaultSpecFramework(content)).toBe('openspec');
  });

  it('derives none when integrations.openspec.enabled is false or absent', () => {
    expect(deriveDefaultSpecFramework('integrations:\n  openspec:\n    enabled: false\n')).toBe('none');
    expect(deriveDefaultSpecFramework('version: 1\n')).toBe('none');
  });
});

describe('mergeSpecFramework', () => {
  it('inserts spec_framework under integrations when missing', () => {
    const old = 'version: 1\nintegrations:\n  openspec:\n    enabled: true\n    changes_dir: openspec/changes\nokf:\n  enabled: false\n';
    const { content, changed } = mergeSpecFramework(old, 'openspec');

    expect(changed).toBe(true);
    expect(content).toContain('integrations:\n  spec_framework: openspec\n  openspec:');
  });

  it('is a no-op when spec_framework is already present, even with a different value', () => {
    const old = 'integrations:\n  spec_framework: native\n  openspec:\n    enabled: true\n';
    const { content, changed } = mergeSpecFramework(old, 'openspec');

    expect(changed).toBe(false);
    expect(content).toBe(old);
  });

  it('preserves every other pre-existing key and value exactly', () => {
    const old = 'version: 1\nproject:\n  name: "my-project"\nintegrations:\n  openspec:\n    enabled: false\nokf:\n  enabled: true\n';
    const { content } = mergeSpecFramework(old, 'none');

    expect(content).toContain('project:\n  name: "my-project"');
    expect(content).toContain('okf:\n  enabled: true');
  });

  it('falls back to appending an integrations block when none exists', () => {
    const old = 'version: 1\nagents: []\n';
    const { content, changed } = mergeSpecFramework(old, 'native');

    expect(changed).toBe(true);
    expect(content).toContain('integrations:\n  spec_framework: native\n');
  });
});
