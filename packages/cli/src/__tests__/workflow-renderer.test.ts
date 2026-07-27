import { describe, it, expect } from 'vitest';
import {
  renderSkillBody,
  renderClaudeCommand,
  renderCursorCommand,
  renderInlineSection,
  renderAgentInstructions,
} from '../lib/workflow-renderer';

describe('renderSkillBody', () => {
  it('renders the full skill body for a Claude/Cursor/Poolside skill file', () => {
    const body = renderSkillBody('bet');
    expect(body).toContain('name: oprim-bet');
    expect(body).toContain('## Steps');
  });
});

describe('renderClaudeCommand', () => {
  it('renders a thin Skill-tool wrapper for archive/sequence/context', () => {
    expect(renderClaudeCommand('archive')).toContain('Use the Skill tool to invoke the `oprim-archive` skill.');
    expect(renderClaudeCommand('sequence')).toContain('Use the Skill tool to invoke the `oprim-sequence` skill.');
    expect(renderClaudeCommand('context')).toContain(
      'Use the Skill tool to invoke the `oprim-context-init` skill.'
    );
  });

  it('wraps with claude command frontmatter (name/description/category/tags)', () => {
    const content = renderClaudeCommand('archive');
    expect(content).toContain('name: "OPRIM: Archive"');
    expect(content).toContain('category: Workflow');
    expect(content).toContain('tags: [workflow, primer]');
  });

  it('renders framework-specific promote content', () => {
    const openspec = renderClaudeCommand('promote', undefined, 'openspec');
    const native = renderClaudeCommand('promote', undefined, 'native');
    const none = renderClaudeCommand('promote', undefined, 'none');
    expect(openspec).toContain('A. Bet → OpenSpec change');
    expect(native).toContain('A. Bet → native oprim spec');
    expect(none).toContain('A. Bet → spec (no framework configured)');
  });
});

describe('renderCursorCommand', () => {
  it('renders condensed inline content for skill-backed workflows', () => {
    const content = renderCursorCommand('pdr');
    expect(content).toContain('---\nname: /oprim-pdr\nid: oprim-pdr');
    expect(content).toContain('Create a new PDR in');
  });

  it('renders framework-specific promote content', () => {
    const native = renderCursorCommand('promote', undefined, 'native');
    expect(native).toContain('A. Bet → native oprim spec');
  });
});

describe('renderInlineSection / renderAgentInstructions', () => {
  it('returns null for a workflow with no inline section', () => {
    expect(renderInlineSection('promote')).toBeNull();
    expect(renderInlineSection('context')).toBeNull();
  });

  it('returns the condensed section for an inline-eligible workflow', () => {
    expect(renderInlineSection('bet')).toContain('### Bet authoring (oprim-bet)');
  });

  it('assembles the full Codex/Gemini/Poolside inline instruction block', () => {
    const content = renderAgentInstructions();
    expect(content).toContain('## oprim workflows');
    for (const heading of [
      '### Bet authoring (oprim-bet)',
      '### Note authoring (oprim-note)',
      '### Criteria authoring (oprim-criteria)',
      '### PDR authoring (oprim-pdr)',
      '### KPI review (oprim-review)',
      '### Bet archiving (oprim-archive)',
      '### Sequencing board (oprim-sequence)',
    ]) {
      expect(content).toContain(heading);
    }
  });
});
