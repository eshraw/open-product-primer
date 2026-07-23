import { describe, it, expect } from 'vitest';
import { configTemplate, okfFrontmatter, indexTemplate } from '../lib/templates';

describe('configTemplate', () => {
  it('renders okf.enabled: true when opted in', () => {
    const content = configTemplate('my-project', true, false, true);
    expect(content).toContain('okf:\n  enabled: true');
  });

  it('renders okf.enabled: false when opted out', () => {
    const content = configTemplate('my-project', true, false, false);
    expect(content).toContain('okf:\n  enabled: false');
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

describe('indexTemplate', () => {
  it('renders OKF type: index frontmatter and links to bets/decisions/reviews', () => {
    const content = indexTemplate('my-project');
    expect(content).toContain('type: index');
    expect(content).toContain('./bets/');
    expect(content).toContain('./decisions/');
    expect(content).toContain('./reviews/');
  });
});
