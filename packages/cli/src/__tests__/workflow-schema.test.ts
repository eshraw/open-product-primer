import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadWorkflowSchema, loadWorkflowTemplate } from '../lib/workflow-schema';

let tmpDir: string;
let overridesDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-workflow-schema-test-'));
  overridesDir = path.join(tmpDir, 'oprim', 'workflows');
  fs.mkdirSync(overridesDir, { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadWorkflowSchema', () => {
  it('bundled only: returns the CLI-bundled schema when no override exists', () => {
    const schema = loadWorkflowSchema('bet', tmpDir);
    expect(schema.id).toBe('bet');
    expect(schema.skillName).toBe('oprim-bet');
    expect(schema.claude.skill).toBe(true);
  });

  it('resolves the bundled schema when no projectRoot is given at all', () => {
    const schema = loadWorkflowSchema('pdr');
    expect(schema.skillName).toBe('oprim-pdr');
  });

  it('override schema only: project schema.yaml overrides the bundled one, template still bundled', () => {
    fs.writeFileSync(
      path.join(overridesDir, 'bet.schema.yaml'),
      [
        'id: bet',
        'skillName: oprim-bet-custom',
        'title: null',
        'description: Custom bet description',
        'claude:',
        '  skill: true',
        '  command: null',
        'cursor:',
        '  skill: false',
        '  command: null',
        'poolside:',
        '  skill: false',
        'inline: false',
      ].join('\n')
    );

    const schema = loadWorkflowSchema('bet', tmpDir);
    expect(schema.skillName).toBe('oprim-bet-custom');
    expect(schema.description).toBe('Custom bet description');

    const template = loadWorkflowTemplate('bet', tmpDir);
    expect(template).toBe(loadWorkflowTemplate('bet')); // still the bundled default
  });

  it('override template only: project template.md overrides the bundled one, schema still bundled', () => {
    fs.writeFileSync(path.join(overridesDir, 'bet.template.md'), '---\nname: oprim-bet\n---\n\nCustom body.\n');

    const schema = loadWorkflowSchema('bet', tmpDir);
    expect(schema.skillName).toBe('oprim-bet'); // still bundled

    const template = loadWorkflowTemplate('bet', tmpDir);
    expect(template).toBe('---\nname: oprim-bet\n---\n\nCustom body.\n');
  });

  it('override both: project schema and template both take precedence', () => {
    fs.writeFileSync(
      path.join(overridesDir, 'pdr.schema.yaml'),
      [
        'id: pdr',
        'skillName: oprim-pdr',
        'title: null',
        'description: Overridden pdr description',
        'claude:',
        '  skill: true',
        '  command: null',
        'cursor:',
        '  skill: false',
        '  command: null',
        'poolside:',
        '  skill: false',
        'inline: false',
      ].join('\n')
    );
    fs.writeFileSync(path.join(overridesDir, 'pdr.template.md'), 'Overridden pdr template.\n');

    expect(loadWorkflowSchema('pdr', tmpDir).description).toBe('Overridden pdr description');
    expect(loadWorkflowTemplate('pdr', tmpDir)).toBe('Overridden pdr template.\n');
  });

  it('malformed override schema: fails with an actionable error naming the file, no silent fallback', () => {
    const overridePath = path.join(overridesDir, 'bet.schema.yaml');
    fs.writeFileSync(overridePath, 'not: [valid yaml');

    expect(() => loadWorkflowSchema('bet', tmpDir)).toThrowError(/bet\.schema\.yaml/);
  });

  it('override schema missing required fields fails with an actionable error naming the file', () => {
    const overridePath = path.join(overridesDir, 'bet.schema.yaml');
    fs.writeFileSync(overridePath, 'id: bet\n');

    expect(() => loadWorkflowSchema('bet', tmpDir)).toThrowError(/bet\.schema\.yaml/);
  });

  it('vibe.skill defaults to poolside.skill when a schema declares no vibe key (bet-042)', () => {
    const schema = loadWorkflowSchema('bet', tmpDir);
    expect(schema.poolside.skill).toBe(true);
    expect(schema.vibe.skill).toBe(true);
  });

  it('qwen.skill defaults to poolside.skill when a schema declares no qwen key (bet-043)', () => {
    const schema = loadWorkflowSchema('bet', tmpDir);
    expect(schema.poolside.skill).toBe(true);
    expect(schema.qwen.skill).toBe(true);
  });

  it('qwen.skill can be overridden independently of poolside.skill', () => {
    fs.writeFileSync(
      path.join(overridesDir, 'bet.schema.yaml'),
      [
        'id: bet',
        'skillName: oprim-bet',
        'title: null',
        'description: Custom bet description',
        'claude:',
        '  skill: true',
        '  command: null',
        'cursor:',
        '  skill: false',
        '  command: null',
        'poolside:',
        '  skill: true',
        'qwen:',
        '  skill: false',
        'inline: false',
      ].join('\n')
    );

    const schema = loadWorkflowSchema('bet', tmpDir);
    expect(schema.poolside.skill).toBe(true);
    expect(schema.qwen.skill).toBe(false);
  });

  it('vibe.skill can be overridden independently of poolside.skill', () => {
    fs.writeFileSync(
      path.join(overridesDir, 'bet.schema.yaml'),
      [
        'id: bet',
        'skillName: oprim-bet',
        'title: null',
        'description: Custom bet description',
        'claude:',
        '  skill: true',
        '  command: null',
        'cursor:',
        '  skill: false',
        '  command: null',
        'poolside:',
        '  skill: true',
        'vibe:',
        '  skill: false',
        'inline: false',
      ].join('\n')
    );

    const schema = loadWorkflowSchema('bet', tmpDir);
    expect(schema.poolside.skill).toBe(true);
    expect(schema.vibe.skill).toBe(false);
  });
});
