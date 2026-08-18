import { loadWorkflowSchema, loadWorkflowTemplate, loadWorkflowVariant, WorkflowSchema } from './workflow-schema';

// Fixed order the pre-refactor oprimWorkflowsInline() concatenated its per-workflow sections in —
// preserved here so Codex/Gemini/Poolside output is unchanged.
const INLINE_SECTION_ORDER = ['bet', 'note', 'criteria', 'pdr', 'review', 'archive', 'sequence', 'explore', 'reconcile'];

function claudeWrapper(name: string, description: string, body: string): string {
  return `---
name: "${name}"
description: ${description}
category: Workflow
tags: [workflow, primer]
---

${description}.

${body}`;
}

function cursorWrapper(id: string, description: string, body: string): string {
  return `---
name: /${id}
id: ${id}
category: Workflow
description: ${description}
---

${body}`;
}

function promoteVariantBody(id: string, schema: WorkflowSchema, framework: string): string {
  const variants = schema.variants;
  if (!variants) throw new Error(`workflow "${id}" has no variants configured`);
  const variantId = variants.includes(framework) ? framework : variants[0];
  const content = loadWorkflowVariant(`${id}.${variantId}.template.md`);
  if (content === null) {
    throw new Error(`Missing variant template ${id}.${variantId}.template.md for workflow "${id}"`);
  }
  return content;
}

/**
 * The full workflow body — a workflow's own frontmatter (`name:`/`description:`) plus its
 * instructional steps — used verbatim as the Claude/Cursor/Poolside SKILL.md content.
 */
export function renderSkillBody(id: string, projectRoot?: string): string {
  return loadWorkflowTemplate(id, projectRoot);
}

/**
 * A thin Claude command wrapper that delegates to the workflow's skill via the Skill tool
 * (archive/sequence/context), or promote's dynamic per-framework content.
 */
export function renderClaudeCommand(id: string, projectRoot?: string, framework = 'openspec'): string {
  const schema = loadWorkflowSchema(id, projectRoot);
  if (!schema.claude.command) {
    throw new Error(`workflow "${id}" has no Claude command target`);
  }
  const body = schema.variants
    ? promoteVariantBody(id, schema, framework)
    : schema.skillName
      ? `Use the Skill tool to invoke the \`${schema.skillName}\` skill.`
      : (() => {
          throw new Error(`workflow "${id}" Claude command has neither a skillName nor variants`);
        })();
  return claudeWrapper(schema.title ?? schema.id, schema.description, body);
}

/**
 * A full Cursor command file: promote's dynamic per-framework content, or a condensed
 * `<id>.cursor-command.md` body (Cursor has no Skill tool, so content is always inlined).
 */
export function renderCursorCommand(id: string, projectRoot?: string, framework = 'openspec'): string {
  const schema = loadWorkflowSchema(id, projectRoot);
  if (!schema.cursor.command) {
    throw new Error(`workflow "${id}" has no Cursor command target`);
  }
  const cursorId = schema.cursor.command.replace(/\.md$/, '');
  const body = schema.variants
    ? promoteVariantBody(id, schema, framework)
    : (() => {
        const content = loadWorkflowVariant(`${id}.cursor-command.md`);
        if (content === null) throw new Error(`Missing ${id}.cursor-command.md for workflow "${id}"`);
        return content;
      })();
  return cursorWrapper(cursorId, schema.cursorDescription ?? schema.description, body);
}

/** A workflow's condensed section for the shared Codex/Gemini/Poolside inline instruction block. */
export function renderInlineSection(id: string): string | null {
  return loadWorkflowVariant(`${id}.inline.md`);
}

/** The full `<!-- oprim:start -->`-delimited inline instruction block written into AGENTS.md/GEMINI.md. */
export function renderAgentInstructions(): string {
  const sections = INLINE_SECTION_ORDER.map((id) => {
    const content = renderInlineSection(id);
    if (content === null) throw new Error(`Missing inline section for workflow "${id}"`);
    return content;
  });
  return '\n## oprim workflows\n\n' + sections.join('\n\n') + '\n';
}
