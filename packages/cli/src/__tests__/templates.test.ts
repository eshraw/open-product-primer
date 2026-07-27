import { describe, it, expect } from 'vitest';
import { configTemplate, okfFrontmatter, indexTemplate, noteMinimalFrontmatter } from '../lib/templates';

describe('configTemplate', () => {
  it('renders okf.enabled: true when opted in', () => {
    const content = configTemplate('my-project', true, false, true);
    expect(content).toContain('okf:\n  enabled: true');
  });

  it('renders okf.enabled: false when opted out', () => {
    const content = configTemplate('my-project', true, false, false);
    expect(content).toContain('okf:\n  enabled: false');
  });

  it('renders an empty context field', () => {
    const content = configTemplate('my-project', true, false, false);
    expect(content).toContain('context: ""');
  });

  it('renders an empty rules object', () => {
    const content = configTemplate('my-project', true, false, false);
    expect(content).toContain('rules: {}');
  });

  it('renders an active remote_context key with empty sources', () => {
    const content = configTemplate('my-project', true, false, false);
    expect(content).toContain('remote_context:\n  enabled: false\n  sources: []');
  });

  it('renders the given spec_framework value under integrations', () => {
    const content = configTemplate('my-project', true, false, false, 'native');
    expect(content).toContain('integrations:');
    expect(content).toContain('  spec_framework: native');
  });

  it('defaults spec_framework to openspec when openspec is enabled and no value is given', () => {
    const content = configTemplate('my-project', true, false, false);
    expect(content).toContain('  spec_framework: openspec');
  });

  it('defaults spec_framework to none when openspec is disabled and no value is given', () => {
    const content = configTemplate('my-project', false, false, false);
    expect(content).toContain('  spec_framework: none');
  });
});

describe('okfFrontmatter', () => {
  it('renders a 5-field YAML frontmatter block with the given type and title', () => {
    const block = okfFrontmatter('pdr', '<Decision title>');
    expect(block.startsWith('---\n')).toBe(true);
    expect(block).toContain('type: pdr');
    expect(block).toContain('title: "<Decision title>"');
    expect(block).toContain('description:');
    expect(block).toContain('tags:');
    expect(block).toContain('timestamp:');
    expect(block.trimEnd().endsWith('---')).toBe(true);
  });
});

describe('noteMinimalFrontmatter', () => {
  it('renders a 4-field frontmatter block with no description field', () => {
    const block = noteMinimalFrontmatter('<Note title>');
    expect(block.startsWith('---\n')).toBe(true);
    expect(block).toContain('type: note');
    expect(block).toContain('title: "<Note title>"');
    expect(block).toContain('tags:');
    expect(block).toContain('timestamp:');
    expect(block).not.toContain('description:');
    expect(block.trimEnd().endsWith('---')).toBe(true);
  });
});

describe('indexTemplate', () => {
  it('renders OKF type: index frontmatter and links to bets/decisions/reviews', () => {
    const content = indexTemplate('my-project');
    expect(content).toContain('type: index');
    expect(content).toContain('./bets/');
    expect(content).toContain('./decisions/');
    expect(content).toContain('./reviews/');
  });
});
